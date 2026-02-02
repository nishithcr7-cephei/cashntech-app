import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {AppBar, Container, ProgramBreadcrumb} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {ensureCameraPermission} from '@services/permissions';
import {runGSTInvoiceExtractionWithAI} from '@services/ocr';
import {InvoiceForm} from '@components/InvoiceForm';
import {InvoiceCamera} from '@components/InvoiceCamera';
import {UploadModal} from '@components/index';
import type {InvoiceFields, InvoiceLineItem} from '../../types/Invoice';
import type {GSTInvoiceJSON} from '@services/gstInvoiceExtractor';
import {DocumentPickerResponse} from '@react-native-documents/picker';
import {Camera, Upload, AI, Plus, LeftChevron} from '@assets/Icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import {
  fetchDealerInfoRequest,
  fetchBankListRequest,
  createInvoiceRequest,
  resetCreateInvoiceState,
} from '@store/invoice/inv.slice';
import {
  selectDealerInfo,
  selectDealerInfoError,
  selectBankList,
  selectCreateInvoiceLoading,
  selectCreateInvoiceSuccess,
  selectCreateInvoiceError,
} from '@store/invoice/inv.selector';
import {selectProgramSelection} from '@store/programSelection/programSelection.selector';
import type {DealerInfoParticipant} from '@store/invoice/inv.types';

const emptyFields: InvoiceFields = {
  dealer: '',
  dealerCode: '',
  odAccountNumber: '',
  invoiceNumber: '',
  associatedPO: '',
  invoiceDate: '',
  paymentDate: '',
  invoiceDueDate: '',
  grnDate: '',
  earlyPaymentDiscount: '',
  currency: 'INR',
  creditTo: '',
  remark: '',
  items: [],
  discountType: '',
  discountValue: '',
  cgst: '',
  sgst: '',
  grandTotal: '',
};

// Convert GSTInvoiceJSON line items to InvoiceLineItem format
const convertGSTItemsToInvoiceItems = (gstItems: GSTInvoiceJSON['line_items']): InvoiceLineItem[] => {
  return gstItems.map(item => ({
    itemName: item.description || '',
    quantity: item.quantity.toString(),
    unit: item.unit || 'PCS',
    pricePerQuantity: item.rate_per_unit.toString(),
    total: item.taxable_amount.toString(),
    discountType:
      item.discount_type && item.discount_value != null && item.discount_value > 0
        ? (item.discount_type === 'value' ? 'value' : 'percentage')
        : '',
    discountValue: item.discount_value != null && item.discount_value > 0 ? String(item.discount_value) : '',
    discountAmount: item.discount_amount != null && item.discount_amount > 0 ? String(item.discount_amount) : '',
    taxType:
      item.tax_type && ((item.tax_percentage != null && item.tax_percentage > 0) || (item.tax_amount != null && item.tax_amount > 0))
        ? (item.tax_type || 'GST')
        : '',
    taxPercentage: item.tax_percentage != null && item.tax_percentage > 0 ? String(item.tax_percentage) : '',
    taxAmount: item.tax_amount != null && item.tax_amount > 0 ? String(item.tax_amount) : '',
  }));
};

interface ValidationErrors {
  invoiceNumber?: string;
  dealer?: string;
  dealerCode?: string;
  invoiceDate?: string;
  items?: string;
  [key: string]: string | undefined;
}

export const CreateInvoice: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const programSelection = useSelector(selectProgramSelection);
  const dealerInfo = useSelector(selectDealerInfo);
  const dealerInfoError = useSelector(selectDealerInfoError);
  const bankList = useSelector(selectBankList);
  const createInvoiceLoading = useSelector(selectCreateInvoiceLoading);
  const createInvoiceSuccess = useSelector(selectCreateInvoiceSuccess);
  const createInvoiceError = useSelector(selectCreateInvoiceError);
  const userId = useSelector((s: any) => s.user?.id);

  const [fields, setFields] = useState<InvoiceFields>(emptyFields);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [selectedParticipant, setSelectedParticipant] = useState<DealerInfoParticipant | null>(null);
  const [selectedPartnerBankId, setSelectedPartnerBankId] = useState<string>('');
  const [selectedAttachment, setSelectedAttachment] = useState<DocumentPickerResponse | null>(null);
  const disabled = useMemo(() => loading || createInvoiceLoading, [loading, createInvoiceLoading]);
  const [productType, setProductType] = useState<'dealer_finance' | 'vendor_finance'>('dealer_finance');
  const invoiceNo: string | undefined = route?.params?.invoiceNo;
  const mode: 'edit' | 'recreate' | undefined = route?.params?.mode;
  const baseTitle = productType === 'vendor_finance' ? 'Vendor Invoice' : 'Dealer Invoice';
  const headerModeTitle =
    mode === 'edit'
      ? `Edit ${baseTitle}`
      : mode === 'recreate'
        ? `Recreate ${baseTitle}`
        : `${baseTitle} [Create Invoice]`;
  const headerRefTitle = invoiceNo
    ? `Invoice / Unique Ref. No: ${invoiceNo}`
    : undefined;
  
  // Fetch dealer info and bank list when program is selected
  useEffect(() => {
    const programId = programSelection?.programId;
    if (programId) {
      dispatch(fetchDealerInfoRequest(programId));
    }
    dispatch(fetchBankListRequest());
  }, [programSelection?.programId, dispatch]);

  // Toast: programId debug - verify if program selection reached Create Invoice
  useEffect(() => {
    const programId = programSelection?.programId;
    Toast.show({
      type: programId ? 'success' : 'error',
      text1: programId ? `Program selected: ${programId}` : 'No program selected',
      text2: programId ? `Fetching dealer info...` : 'Select a program first from Select Program screen',
    });
  }, [programSelection?.programId]);

  // Toast: dealer info API result (debug)
  useEffect(() => {
    if (dealerInfo) {
      const count = dealerInfo?.participants?.length ?? 0;
      Toast.show({
        type: count > 0 ? 'success' : 'info',
        text1: count > 0 ? `Dealer info loaded: ${count} dealer(s)` : 'No dealers found for this program',
      });
    }
  }, [dealerInfo]);

  useEffect(() => {
    if (dealerInfoError) {
      Toast.show({
        type: 'error',
        text1: 'Dealer info failed',
        text2: dealerInfoError,
      });
    }
  }, [dealerInfoError]);

  // Load last selected product type (Dealer Finance / Vendor Finance) for dynamic labels
  useEffect(() => {
    AsyncStorage.getItem('selectedProductType')
      .then(stored => {
        if (stored === 'dealer_finance' || stored === 'vendor_finance') {
          setProductType(stored);
        }
      })
      .catch(() => {});
  }, []);

  // Handle create invoice success / error
  useEffect(() => {
    if (createInvoiceSuccess) {
      dispatch(resetCreateInvoiceState());
      setFields(emptyFields);
      setSelectedParticipant(null);
      setSelectedPartnerBankId('');
      setSelectedAttachment(null);
      Alert.alert('Success', 'Invoice created successfully.', [
        {text: 'OK', onPress: () => (navigation as any).navigate('InvoiceDetails')},
      ]);
    }
  }, [createInvoiceSuccess, dispatch, navigation]);

  useEffect(() => {
    if (createInvoiceError) {
      Alert.alert('Error', createInvoiceError, [
        {text: 'OK', onPress: () => dispatch(resetCreateInvoiceState())},
      ]);
    }
  }, [createInvoiceError, dispatch]);

  // Ensure currency is always INR
  useEffect(() => {
    if (!fields.currency || fields.currency !== 'INR') {
      setFields(prev => ({...prev, currency: 'INR'}));
    }
  }, [fields.currency]);

  // Validation function
  const validateField = (fieldName: keyof InvoiceFields, value: any): string | undefined => {
    switch (fieldName) {
      case 'invoiceNumber':
        if (!value?.trim()) {
          return 'Invoice / Unique Ref. No is required';
        }
        return undefined;
      case 'dealer':
        if (!value?.trim()) {
          return 'Dealer Name is required';
        }
        return undefined;
      case 'dealerCode':
        if (!value?.trim()) {
          return 'Dealer Code is required';
        }
        return undefined;
      case 'invoiceDate':
        if (!value?.trim()) {
          return 'Invoice Date is required';
        }
        return undefined;
      case 'creditTo':
        if (!value?.trim()) {
          return 'Credit To is required';
        }
        return undefined;
      case 'items':
        if (!value || value.length === 0) {
          return 'At least one item is required';
        }
        // Validate each item
        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          if (!item.itemName?.trim()) {
            return `Item ${i + 1}: Item Name is required`;
          }
          if (!item.quantity?.trim() || parseFloat(item.quantity) <= 0) {
            return `Item ${i + 1}: Valid Quantity is required`;
          }
          if (!item.unit?.trim()) {
            return `Item ${i + 1}: Unit is required`;
          }
          if (!item.pricePerQuantity?.trim() || parseFloat(item.pricePerQuantity) <= 0) {
            return `Item ${i + 1}: Valid Price is required`;
          }
        }
        return undefined;
      default:
        return undefined;
    }
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    const invoiceNumberError = validateField('invoiceNumber', fields.invoiceNumber);
    if (invoiceNumberError) newErrors.invoiceNumber = invoiceNumberError;
    
    const dealerError = validateField('dealer', fields.dealer);
    if (dealerError) newErrors.dealer = dealerError;
    
    const dealerCodeError = validateField('dealerCode', fields.dealerCode);
    if (dealerCodeError) newErrors.dealerCode = dealerCodeError;
    
    const invoiceDateError = validateField('invoiceDate', fields.invoiceDate);
    if (invoiceDateError) newErrors.invoiceDate = invoiceDateError;
    
    const creditToError = validateField('creditTo', fields.creditTo);
    if (creditToError) newErrors.creditTo = creditToError;
    
    const itemsError = validateField('items', fields.items);
    if (itemsError) newErrors.items = itemsError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return (
      fields.invoiceNumber?.trim() &&
      fields.dealer?.trim() &&
      fields.dealerCode?.trim() &&
      fields.invoiceDate?.trim() &&
      fields.creditTo?.trim() &&
      fields.items &&
      fields.items.length > 0 &&
      fields.items.every(item => 
        item.itemName?.trim() &&
        item.quantity?.trim() &&
        parseFloat(item.quantity) > 0 &&
        item.unit?.trim() &&
        item.pricePerQuantity?.trim() &&
        parseFloat(item.pricePerQuantity) > 0
      )
    );
  }, [fields]);
  
  const applyPatch = (patch: Partial<InvoiceFields>) => {
    if (patch.currency && patch.currency !== 'INR') patch.currency = 'INR';
    if (patch.dealer && dealerInfo?.participants) {
      const participant = dealerInfo.participants.find(
        p => p.party.entity_name === patch.dealer,
      );
      if (participant) {
        patch.dealerCode = participant.company_code;
        patch.odAccountNumber = participant.od_account_no;
        setSelectedParticipant(participant);
      }
    }
    setFields(prev => {
      const updated = {...prev, ...patch};
      const newErrors = {...errors};
      Object.keys(patch).forEach(key => {
        const fieldName = key as keyof InvoiceFields;
        const error = validateField(fieldName, updated[fieldName]);
        if (error) newErrors[fieldName] = error;
        else delete newErrors[fieldName];
      });
      setErrors(newErrors);
      return updated;
    });
  };

  const handleImagePath = async (uriOrPath: string | null) => {
    if (!uriOrPath) return;
    try {
      setLoading(true);
      
      // Use Gemini AI only for extraction
      const {gstInvoice} = await runGSTInvoiceExtractionWithAI(uriOrPath);
      
      // Convert AI-extracted items to form format
      let extractedItems: InvoiceLineItem[] = [];
      
      if (gstInvoice?.line_items && gstInvoice.line_items.length > 0) {
        // Use AI-extracted items
        extractedItems = convertGSTItemsToInvoiceItems(gstInvoice.line_items);
      }
      
      setFields(prev => {
        const header = gstInvoice.invoice_header;
        const merged = {
          ...prev,
          // Extract invoice header fields from Gemini result
          invoiceNumber: header.invoice_number || prev.invoiceNumber,
          invoiceDate: header.invoice_date || prev.invoiceDate,
          associatedPO: header.order_no || prev.associatedPO,
          earlyPaymentDiscount: header.early_payment_discount || prev.earlyPaymentDiscount || '',
          grnDate: header.grn_date || prev.grnDate || '',
          // Keep dropdown fields empty (user must select manually - NOT filled by OCR)
          dealer: prev.dealer || '',
          dealerCode: prev.dealerCode || '',
          odAccountNumber: prev.odAccountNumber || '',
          // Additional fields (keep existing or empty)
          paymentDate: prev.paymentDate || '',
          invoiceDueDate: prev.invoiceDueDate || '',
          creditTo: prev.creditTo || '',
          remark: prev.remark || '',
        };
        // Ensure currency remains INR
        merged.currency = 'INR';
        
        // Set items - number of rows will match number of items found (discount/tax from OCR if on invoice)
        if (extractedItems.length > 0) {
          merged.items = extractedItems;
        }
        
        return merged;
      });
      
      const itemCount = extractedItems.length;
      Alert.alert(
        'Success', 
        `Invoice data extracted using Gemini AI! Found ${itemCount} item${itemCount !== 1 ? 's' : ''} and filled automatically.`
      );
    } catch (e: any) {
      Alert.alert('Gemini AI Error', e?.message ?? 'Failed to extract invoice data using Gemini AI. Please try again or enter manually.');
    } finally {
      setLoading(false);
    }
  };

  const openCamera = async () => {
    const ok = await ensureCameraPermission();
    if (!ok) {
      return Alert.alert('Permission Required', 'Camera permission is needed to capture invoices.');
    }
    setShowCamera(true);
  };

  const handleUploadFile = async (file: DocumentPickerResponse | undefined) => {
    if (!file) return;
    setSelectedAttachment(file);
    if (file.type?.startsWith('image/')) {
      handleImagePath(file.uri);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        Alert.alert('Validation Error', errors[firstErrorKey] || 'Please fill all required fields');
      }
      return;
    }

    const createdBy = userId != null ? String(userId) : '';

    if (dealerInfo && (!selectedParticipant || !selectedPartnerBankId)) {
      Alert.alert(
        'Validation Error',
        'Please select Dealer and Bank from the dropdowns.',
      );
      return;
    }
    if (dealerInfo && !createdBy) {
      Alert.alert('Error', 'User session not found. Please log in again.');
      return;
    }

    if (dealerInfo && selectedParticipant && programSelection?.programId) {
      dispatch(
        createInvoiceRequest({
          fields,
          createdBy,
          partnerBank: selectedPartnerBankId,
          program: programSelection.programId,
          anchorParticipantMapping: selectedParticipant.id,
          party: selectedParticipant.party.id,
          counterPartyName: selectedParticipant.party.entity_name,
          counterPartyCode: selectedParticipant.company_code,
          counterPartyOdAccount: selectedParticipant.od_account_no,
          attachment: selectedAttachment ?? undefined,
        }),
      );
    } else {
      Alert.alert(
        'Setup Required',
        'Please select a Program from the dashboard first, then try again.',
      );
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Invoice',
      'Are you sure you want to cancel? All entered data will be reset.',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            setFields(emptyFields);
            (navigation as any).navigate('InvoiceDetails');
          },
        },
      ]
    );
  };

  const dealerOptions = useMemo(
    () =>
      dealerInfo?.participants?.map(p => ({
        label: p.party.entity_name,
        value: p.party.entity_name,
      })) ?? [],
    [dealerInfo],
  );
  const creditToOptions = useMemo(
    () =>
      dealerInfo?.party?.party_bank_details?.map(b => ({
        label: b.account_number,
        value: b.account_number,
      })) ?? [],
    [dealerInfo],
  );
  const bankOptions = useMemo(
    () =>
      bankList?.map(b => ({
        label: b.bank_name,
        value: b.id,
      })) ?? [],
    [bankList],
  );

  return (
    <Container>
      <AppBar title="Create Invoice" navigation={navigation as any} />
      <ProgramBreadcrumb />
      <View style={styles.pageTitleBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            (navigation as any).navigate('InvoiceDetails');
          }}>
          <LeftChevron height={scaleWidth(16)} width={scaleHeight(16)} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitleText} numberOfLines={1}>
            {headerModeTitle}
          </Text>
          {!!headerRefTitle && (
            <Text style={styles.pageSubtitleText} numberOfLines={1}>
              {headerRefTitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.container}>
        {/* AI Badge */}
        <View style={styles.aiBadge}>
          <AI width={scaleWidth(18)} height={scaleHeight(18)} color={Colors.primaryColor} />
          <Text style={styles.aiBadgeText}>AI-Powered Invoice Processing</Text>
        </View>

        {/* OCR Action Section */}
        <View style={styles.ocrSection}>
          <Text style={styles.ocrTitle}>Scan Invoice with OCR</Text>
          <Text style={styles.ocrSubtitle}>Capture or upload invoice to auto-fill form using AI</Text>

          <View style={styles.ocrButtons}>
            <TouchableOpacity
              style={[styles.ocrButton, styles.cameraButton]}
              onPress={openCamera}
              disabled={disabled}>
              <Camera width={scaleWidth(20)} height={scaleHeight(20)} />
              <Text style={styles.ocrButtonText}>Capture</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ocrButton, styles.galleryButton]}
              onPress={() => setIsUploadModalVisible(true)}
              disabled={disabled}>
              <Upload width={scaleWidth(20)} height={scaleHeight(20)} />
              <Text style={styles.ocrButtonText}>Upload</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primaryColor} />
              <Text style={styles.loadingText}>Extracting invoice data...</Text>
            </View>
          )}
          {selectedAttachment && (
            <View style={styles.selectedFileRow}>
              <Text style={styles.selectedFileText} numberOfLines={1}>
                Selected: {selectedAttachment.name}
              </Text>
              <TouchableOpacity onPress={() => setSelectedAttachment(null)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Text style={styles.removeFileText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Invoice Form */}
        <ScrollView
          style={styles.formContainer}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}>
          <InvoiceForm
            value={fields}
            onChange={applyPatch}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading || createInvoiceLoading}
            errors={errors}
            isFormValid={isFormValid}
            productType={productType}
            dealerOptions={dealerOptions.length > 0 ? dealerOptions : undefined}
            creditToOptions={creditToOptions.length > 0 ? creditToOptions : undefined}
            bankOptions={bankOptions.length > 0 ? bankOptions : undefined}
            selectedBankId={selectedPartnerBankId}
            onBankSelect={setSelectedPartnerBankId}
          />
        </ScrollView>

        {/* Footer (Upload Invoice only) */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.uploadInvoiceButton}
            onPress={() => setIsUploadModalVisible(true)}
            disabled={disabled}>
            <View style={styles.buttonIconContainer}>
              <Plus width={scaleWidth(16)} height={scaleHeight(16)} />
            </View>
            <Text style={styles.uploadInvoiceButtonText}>Upload Invoice</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <InvoiceCamera
          onCaptured={(path) => {
            setShowCamera(false);
            handleImagePath('file://' + path);
          }}
          onClose={() => setShowCamera(false)}
        />
      </Modal>

      {/* UploadModal */}
      <UploadModal
        visible={isUploadModalVisible}
        allowedFileTypes={['jpg', 'jpeg', 'png']}
        onClose={(file) => {
          if (file) {
            handleUploadFile(file);
            setIsUploadModalVisible(false);
          } else {
            setIsUploadModalVisible(false);
          }
        }}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  pageTitleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  backButton: {
    marginRight: scaleWidth(12),
    padding: scaleWidth(4),
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
  },
  pageTitleText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  pageSubtitleText: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(16),
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    gap: scaleWidth(8),
  },
  aiBadgeText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
    letterSpacing: 0.3,
  },
  ocrSection: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(16),
    paddingBottom: scaleHeight(12),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  ocrTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(4),
  },
  ocrSubtitle: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    marginBottom: scaleHeight(16),
  },
  ocrButtons: {
    flexDirection: 'row',
    gap: scaleWidth(12),
  },
  ocrButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(8),
    gap: scaleWidth(8),
  },
  cameraButton: {
    backgroundColor: Colors.primaryColor,
  },
  galleryButton: {
    backgroundColor: Colors.gray200,
  },
  ocrButtonText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleHeight(12),
    gap: scaleWidth(8),
  },
  loadingText: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
  },
  selectedFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scaleHeight(12),
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(12),
    backgroundColor: Colors.gray200,
    borderRadius: scaleWidth(8),
  },
  selectedFileText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    flex: 1,
  },
  removeFileText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
    marginLeft: scaleWidth(8),
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    paddingBottom: scaleHeight(100),
  },
  footer: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    alignItems: 'center',
  },
  uploadInvoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryColor,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(18),
    borderRadius: scaleWidth(8),
    gap: scaleWidth(8),
    width: '58%',
    maxWidth: scaleWidth(260),
    minWidth: scaleWidth(160),
  },
  buttonIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadInvoiceButtonText: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
});

