import React, {useMemo, useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Modal,
  InteractionManager,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {AppBar, Container} from '@components/index';
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
  createInvoiceRequest,
  resetCreateInvoiceState,
} from '@store/invoice/inv.slice';
import {
  selectDealerInfo,
  selectDealerInfoError,
  selectCreateInvoiceLoading,
  selectCreateInvoiceSuccess,
  selectCreateInvoiceError,
} from '@store/invoice/inv.selector';
import {selectProgramSelection} from '@store/programSelection/programSelection.selector';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';
import type {DealerInfoParticipant} from '@store/invoice/inv.types';
import {decryptValue} from '@utils/decrypt';

const getInitialFields = (): InvoiceFields => ({
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
});

const convertGSTItemsToInvoiceItems = (
  gstItems: GSTInvoiceJSON['line_items'],
): InvoiceLineItem[] =>
  gstItems.map(item => ({
    itemName: item.description || '',
    quantity: item.quantity.toString(),
    unit: item.unit || 'PCS',
    pricePerQuantity: item.rate_per_unit.toString(),
    total: item.taxable_amount.toString(),
    discountType:
      item.discount_type && item.discount_value != null && item.discount_value > 0
        ? item.discount_type === 'value'
          ? 'value'
          : 'percentage'
        : '',
    discountValue:
      item.discount_value != null && item.discount_value > 0
        ? String(item.discount_value)
        : '',
    discountAmount:
      item.discount_amount != null && item.discount_amount > 0
        ? String(item.discount_amount)
        : '',
    taxType:
      item.tax_type &&
      ((item.tax_percentage != null && item.tax_percentage > 0) ||
        (item.tax_amount != null && item.tax_amount > 0))
        ? item.tax_type || 'GST'
        : '',
    taxPercentage:
      item.tax_percentage != null && item.tax_percentage > 0
        ? String(item.tax_percentage)
        : '',
    taxAmount:
      item.tax_amount != null && item.tax_amount > 0 ? String(item.tax_amount) : '',
  }));

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
  const createInvoiceLoading = useSelector(selectCreateInvoiceLoading);
  const createInvoiceSuccess = useSelector(selectCreateInvoiceSuccess);
  const createInvoiceError = useSelector(selectCreateInvoiceError);
  const userId = useSelector((s: any) => s.user?.id);
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const isAnchorMaker = userRole === 'anchor_maker';
  const isDealerMaker = userRole === 'dealer_maker';

  const [fields, setFields] = useState<InvoiceFields>(() => getInitialFields());
  const [ocrLoading, setOcrLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isOcrUploadModalVisible, setIsOcrUploadModalVisible] = useState(false);
  const [isProofUploadModalVisible, setIsProofUploadModalVisible] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [selectedParticipant, setSelectedParticipant] = useState<DealerInfoParticipant | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<DocumentPickerResponse | null>(null);
  const disabled = useMemo(
    () => createInvoiceLoading || ocrLoading,
    [createInvoiceLoading, ocrLoading],
  );
  const [productType, setProductType] = useState<'dealer_finance' | 'vendor_finance'>('dealer_finance');
  const invoiceNo: string | undefined = route?.params?.invoiceNo;
  const mode: 'edit' | 'recreate' | undefined = route?.params?.mode;
  const previewFieldsFromRoute: InvoiceFields | undefined = route?.params?.previewFields;
  const previewAttachmentFromRoute: DocumentPickerResponse | undefined = route?.params?.previewAttachment;
  const previewReturnToken: number | undefined = route?.params?.previewReturnToken;
  const headerModeTitle ="Invoice Details";
   
  const headerRefTitle = invoiceNo
    ? `Invoice / Unique Ref. No: ${invoiceNo}`
    : undefined;
  const programContext = useMemo(() => {
    const bank = programSelection?.bankName;
    const product = programSelection?.productName;
    const program = programSelection?.programName;

    if (!bank && !product && !program) {
      return null;
    }

    const parts: string[] = [];
    if (bank) parts.push(bank);
    if (product) parts.push(product);
    if (program) parts.push(program);

    return parts.join(' - ');
  }, [programSelection]);
  
  // Role-based access control: Prevent anchor_checker from accessing Create Invoice screen
  useEffect(() => {
    if (userRole === 'anchor_checker') {
      Alert.alert(
        'Access Denied',
        'Anchor Checker cannot create invoices. You can only approve/reject invoices.',
        [
          {
            text: 'OK',
            onPress: () => {
              (navigation as any).navigate('InvoiceDetails');
            },
          },
        ],
      );
    }
  }, [userRole, navigation]);
  
  // Fetch dealer info and bank list when program is selected
  useEffect(() => {
    const programId = programSelection?.programId;
    if (programId) {
      dispatch(fetchDealerInfoRequest(programId));
    }
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

  // Restore form when returning from preview (Close X on preview page)
  useEffect(() => {
    if (!previewReturnToken) return;
    if (previewFieldsFromRoute) setFields(previewFieldsFromRoute);
    if (previewAttachmentFromRoute) setSelectedAttachment(previewAttachmentFromRoute);
    if (previewFieldsFromRoute?.dealer && dealerInfo?.participants?.length) {
      const participant = dealerInfo.participants.find(
        p => p.party.entity_name === previewFieldsFromRoute.dealer,
      );
      if (participant) setSelectedParticipant(participant);
    }
  }, [
    previewReturnToken,
    previewFieldsFromRoute,
    previewAttachmentFromRoute,
    dealerInfo?.participants,
  ]);

  // Handle create invoice success / error
  useEffect(() => {
    if (createInvoiceSuccess) {
      dispatch(resetCreateInvoiceState());
      setFields(getInitialFields());
      setSelectedParticipant(null);
      setSelectedAttachment(null);
      Alert.alert('Success', 'Invoice created successfully.', [
        {text: 'OK', onPress: () => (navigation as any).navigate('InvoiceDetails', {refreshList: true})},
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
      case 'paymentDate':
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
          if (!item.discountType?.trim()) {
            return `Item ${i + 1}: Discount Type is required`;
          }
          if (!item.discountValue?.trim()) {
            return `Item ${i + 1}: Discount Value is required`;
          }
          const hasValidTaxInArray = Array.isArray(item.taxes)
            ? item.taxes.some(
                (t: any) =>
                  t?.taxType?.trim() &&
                  t?.taxPercentage?.toString().trim() &&
                  Number(t.taxPercentage) >= 0,
              )
            : false;
          const hasLegacyTax =
            item.taxType?.trim() &&
            item.taxPercentage?.toString().trim() &&
            Number(item.taxPercentage) >= 0;
          if (!hasValidTaxInArray && !hasLegacyTax) {
            return `Item ${i + 1}: Tax details are required`;
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
        parseFloat(item.pricePerQuantity) > 0 &&
        item.discountType?.trim() &&
        item.discountValue?.trim() &&
        ((Array.isArray((item as any).taxes) &&
          (item as any).taxes.some(
            (t: any) =>
              t?.taxType?.trim() &&
              t?.taxPercentage?.toString().trim() &&
              Number(t.taxPercentage) >= 0,
          )) ||
          (item.taxType?.trim() &&
            item.taxPercentage?.toString().trim() &&
            Number(item.taxPercentage) >= 0))
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
        patch.dealerCode = decryptValue(participant.company_code ?? '') || participant.company_code;
        patch.odAccountNumber = decryptValue(participant.od_account_no ?? '') || participant.od_account_no;
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

  const openUploadPreview = useCallback(
    (previewFields: InvoiceFields, previewAttachment: DocumentPickerResponse) => {
      (navigation as any).navigate('InvoiceUploadPreview', {
        previewFields,
        previewAttachment,
        previewAnchorName:
          decryptValue(dealerInfo?.party?.entity_name ?? '') ||
          dealerInfo?.party?.entity_name ||
          '',
      });
    },
    [navigation, dealerInfo?.party?.entity_name],
  );

  const openCamera = async () => {
    const ok = await ensureCameraPermission();
    if (!ok) {
      return Alert.alert('Permission Required', 'Camera permission is needed to capture invoices.');
    }
    setShowCamera(true);
  };

  const runOcrAndPatchForm = async (uriOrPath: string | null) => {
    if (!uriOrPath) return;
    try {
      setOcrLoading(true);
      const {gstInvoice} = await runGSTInvoiceExtractionWithAI(uriOrPath);
      const header = gstInvoice?.invoice_header;
      const extractedItems =
        gstInvoice?.line_items?.length > 0
          ? convertGSTItemsToInvoiceItems(gstInvoice.line_items)
          : [];

      setFields(prev => ({
        ...prev,
        invoiceNumber: header?.invoice_number || prev.invoiceNumber,
        invoiceDate: header?.invoice_date || prev.invoiceDate,
        associatedPO: header?.order_no || prev.associatedPO,
        earlyPaymentDiscount:
          header?.early_payment_discount || prev.earlyPaymentDiscount || '',
        grnDate: header?.grn_date || prev.grnDate || '',
        items: extractedItems.length > 0 ? extractedItems : prev.items,
      }));

      Toast.show({
        type: 'success',
        text1: `OCR completed (${extractedItems.length} item${
          extractedItems.length === 1 ? '' : 's'
        } extracted)`,
        visibilityTime: 2500,
      });
    } catch (e: any) {
      Alert.alert('OCR Error', e?.message ?? 'Failed to extract invoice data.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleOcrUploadFile = async (file: DocumentPickerResponse | undefined) => {
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      Toast.show({
        type: 'error',
        text1: 'OCR upload supports images only',
        visibilityTime: 2500,
      });
      return;
    }
    await runOcrAndPatchForm(file.uri);
  };

  const handleProofUploadFile = async (
    file: DocumentPickerResponse | undefined,
  ) => {
    if (!file) return;
    setSelectedAttachment(file);
    openUploadPreview(fields, file);
  };

  const handleSubmit = async () => {
    if (!selectedAttachment) {
      Toast.show({
        type: 'error',
        text1: 'Please upload invoice first',
        visibilityTime: 3000,
      });
      return;
    }
    if (!validateForm()) {
      const firstErrorKey = Object.keys(errors)[0];
      const msg = firstErrorKey && errors[firstErrorKey]
        ? errors[firstErrorKey]
        : 'Please fill all required fields';
      Toast.show({
        type: 'error',
        text1: msg,
        visibilityTime: 3000,
      });
      return;
    }

    const createdBy = userId != null ? String(userId) : '';

    const partnerBankId = programSelection?.bankId;
    if (dealerInfo && (!selectedParticipant || !partnerBankId)) {
      Toast.show({
        type: 'error',
        text1: 'Please select a Program (with Bank) and Dealer first.',
        visibilityTime: 3000,
      });
      return;
    }
    if (dealerInfo && !createdBy) {
      Toast.show({
        type: 'error',
        text1: 'User session not found. Please log in again.',
        visibilityTime: 3000,
      });
      return;
    }

    if (dealerInfo && selectedParticipant && programSelection?.programId && partnerBankId) {
      dispatch(
        createInvoiceRequest({
          fields,
          createdBy,
          partnerBank: partnerBankId,
          program: programSelection.programId,
          anchorParticipantMapping: selectedParticipant.id,
          // For Anchor-maker: backend expects invoice.party to be the Anchor party,
          // while counter party details come from the selected participant (dealer).
          party: dealerInfo.party.id,
          counterPartyName: selectedParticipant.party.entity_name,
          counterPartyCode: selectedParticipant.company_code,
          counterPartyOdAccount: selectedParticipant.od_account_no,
          attachment: selectedAttachment ?? undefined,
        }),
      );
    } else {
      Toast.show({
        type: 'error',
        text1: 'Please select a Program from the dashboard first, then try again.',
        visibilityTime: 3000,
      });
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
            resetCreateInvoiceForm();
            (navigation as any).navigate('InvoiceDetails');
          },
        },
      ]
    );
  };

  const resetCreateInvoiceForm = useCallback(() => {
    setFields(getInitialFields());
    setErrors({});
    setSelectedParticipant(null);
    setSelectedAttachment(null);
    setShowCamera(false);
    setIsOcrUploadModalVisible(false);
    setIsProofUploadModalVisible(false);
  }, []);

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener('beforeRemove', (e: any) => {
      const actionType = e?.data?.action?.type;
      const targetRouteName = e?.data?.action?.payload?.name;
      const isGoingToPreview =
        actionType === 'NAVIGATE' && targetRouteName === 'InvoiceUploadPreview';
      if (!isGoingToPreview) {
        InteractionManager.runAfterInteractions(() => {
          resetCreateInvoiceForm();
        });
      }
    });

    return unsubscribe;
  }, [navigation, resetCreateInvoiceForm]);

  const dealerOptions = useMemo(
    () =>
      dealerInfo?.participants?.map(p => ({
        label: decryptValue(p.party.entity_name ?? '') || p.party.entity_name,
        value: p.party.entity_name,
      })) ?? [],
    [dealerInfo],
  );
  const creditToOptions = useMemo(
    () =>
      dealerInfo?.party?.party_bank_details?.map(b => ({
        label: decryptValue(b.account_number ?? '') || b.account_number,
        value: b.account_number,
      })) ?? [],
    [dealerInfo],
  );
  return (
    <Container>
      <AppBar 
        title={(isAnchorMaker || isDealerMaker) ? "Transactions > Invoice List & Approval" : "Create Invoice"} 
        navigation={navigation as any}
        hideHamburger={isAnchorMaker || isDealerMaker}
        renderLeftIcon={<LeftChevron width={scaleWidth(18)} height={scaleHeight(18)} />}
        onPressLeftIcon={() => {
          (navigation as any).navigate('InvoiceDetails');
        }}
      />
      <View style={styles.pageTitleBar}>
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitleText} numberOfLines={1}>
            {headerModeTitle}
          </Text>
          
        </View>
      </View>
      <View style={styles.container}>
        {/* OCR Badge */}
        <View style={styles.aiBadge}>
          <AI
            width={scaleWidth(18)}
            height={scaleHeight(18)}
            color={Colors.primaryColor}
          />
          <Text style={styles.aiBadgeText}>OCR Extraction (Capture / Upload)</Text>
        </View>

        {/* OCR Section */}
        <View style={styles.ocrSection}>
          <Text style={styles.ocrTitle}>Scan invoice for OCR</Text>
          <Text style={styles.ocrSubtitle}>
            Capture or upload invoice image to auto-fill form fields.
          </Text>

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
              onPress={() => setIsOcrUploadModalVisible(true)}
              disabled={disabled}>
              <Upload width={scaleWidth(20)} height={scaleHeight(20)} />
              <Text style={styles.ocrButtonText}>Upload</Text>
            </TouchableOpacity>
          </View>

          {ocrLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primaryColor} />
              <Text style={styles.loadingText}>Extracting invoice data...</Text>
            </View>
          )}

          {selectedAttachment && (
            <View style={styles.selectedFileRow}>
              <Text style={styles.selectedFileText} numberOfLines={1}>
                Proof Uploaded: {selectedAttachment.name}
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
            loading={createInvoiceLoading}
            errors={errors}
            isFormValid={isFormValid}
            submitButtonAppearsDisabled={!selectedAttachment || !isFormValid}
            productType={productType}
            dealerOptions={dealerOptions.length > 0 ? dealerOptions : undefined}
            creditToOptions={creditToOptions.length > 0 ? creditToOptions : undefined}
            staleInvoicePeriodDays={dealerInfo?.basic_parameters?.stale_invoice_period_days != null ? Number(dealerInfo.basic_parameters.stale_invoice_period_days) : undefined}
            defaultPaymentTermsDays={dealerInfo?.basic_parameters?.default_payment_terms_days != null ? Number(dealerInfo.basic_parameters.default_payment_terms_days) : undefined}
          />
        </ScrollView>

        {/* Footer (Upload Invoice only) */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.uploadInvoiceButton}
            onPress={() => setIsProofUploadModalVisible(true)}
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
          onCaptured={async path => {
            setShowCamera(false);
            const cameraAttachment: DocumentPickerResponse = {
              uri: 'file://' + path,
              name: `captured-invoice-${Date.now()}.jpg`,
              type: 'image/jpeg',
            } as DocumentPickerResponse;
            await runOcrAndPatchForm(cameraAttachment.uri);
          }}
          onClose={() => setShowCamera(false)}
        />
      </Modal>

      {/* OCR UploadModal */}
      <UploadModal
        visible={isOcrUploadModalVisible}
        allowedFileTypes={['jpg', 'jpeg', 'png']}
        onClose={(file) => {
          if (file) {
            handleOcrUploadFile(file);
            setIsOcrUploadModalVisible(false);
          } else {
            setIsOcrUploadModalVisible(false);
          }
        }}
      />

      {/* Proof UploadModal */}
      <UploadModal
        visible={isProofUploadModalVisible}
        allowedFileTypes={['jpg', 'jpeg', 'png', 'pdf']}
        onClose={(file) => {
          if (file) {
            handleProofUploadFile(file);
            setIsProofUploadModalVisible(false);
          } else {
            setIsProofUploadModalVisible(false);
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

