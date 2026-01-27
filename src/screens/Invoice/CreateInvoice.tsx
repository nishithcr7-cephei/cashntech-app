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
import {AppBar, Container} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {ensureCameraPermission} from '@services/permissions';
import {runOcrFromPath, runGSTInvoiceExtractionWithAI} from '@services/ocr';
import {InvoiceForm} from '@components/InvoiceForm';
import {InvoiceCamera} from '@components/InvoiceCamera';
import {UploadModal} from '@components/index';
import type {InvoiceFields, InvoiceLineItem} from '../../types/Invoice';
import type {GSTInvoiceJSON} from '@services/gstInvoiceExtractor';
import {DocumentPickerResponse} from '@react-native-documents/picker';
import {Camera, Upload, AI, Plus, LeftChevron} from '@assets/Icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    unit: 'PCS', // Default unit - can be enhanced to extract from invoice
    pricePerQuantity: item.rate_per_unit.toString(),
    total: item.taxable_amount.toString(),
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
  const [fields, setFields] = useState<InvoiceFields>(emptyFields);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const disabled = useMemo(() => loading, [loading]);
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
  
  // Load last selected product type (Dealer Finance / Vendor Finance) for dynamic labels
  useEffect(() => {
    AsyncStorage.getItem('selectedProductType')
      .then(stored => {
        if (stored === 'dealer_finance' || stored === 'vendor_finance') {
          setProductType(stored);
        }
      })
      .catch(() => {
        // Ignore errors, default will be Dealer Finance
      });
  }, []);

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
    // Prevent currency from being changed
    if (patch.currency && patch.currency !== 'INR') {
      patch.currency = 'INR';
    }
    setFields(prev => {
      const updated = {...prev, ...patch};
      
      // Real-time validation for changed fields
      const newErrors = {...errors};
      Object.keys(patch).forEach(key => {
        const fieldName = key as keyof InvoiceFields;
        const error = validateField(fieldName, updated[fieldName]);
        if (error) {
          newErrors[fieldName] = error;
        } else {
          delete newErrors[fieldName];
        }
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
        const merged = {
          ...prev,
          // Extract invoice header fields from Gemini result
          invoiceNumber: gstInvoice.invoice_header.invoice_number || prev.invoiceNumber,
          invoiceDate: gstInvoice.invoice_header.invoice_date || prev.invoiceDate,
          associatedPO: gstInvoice.invoice_header.order_no || prev.associatedPO,
          // Keep dropdown fields empty (user must select manually - NOT filled by OCR)
          dealer: prev.dealer || '',
          dealerCode: prev.dealerCode || '',
          odAccountNumber: prev.odAccountNumber || '',
          // Additional fields (keep existing or empty)
          paymentDate: prev.paymentDate || '',
          invoiceDueDate: prev.invoiceDueDate || '',
          grnDate: prev.grnDate || '',
          creditTo: prev.creditTo || '',
          remark: prev.remark || '',
          earlyPaymentDiscount: prev.earlyPaymentDiscount || '',
        };
        // Ensure currency remains INR
        merged.currency = 'INR';
        
        // Set items - number of rows will match number of items found
        if (extractedItems.length > 0) {
          // Initialize item-level discount and tax fields
          merged.items = extractedItems.map(item => ({
            ...item,
            discountType: '',
            discountValue: '',
            discountAmount: '',
            taxType: '',
            taxPercentage: '',
            taxAmount: '',
          }));
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

  const handleUploadFile = (file: DocumentPickerResponse | undefined) => {
    if (file) {
      handleImagePath(file.uri);
    }
  };

  const handleSubmit = async () => {
    // Validate all fields
    if (!validateForm()) {
      // Scroll to first error if needed
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        Alert.alert('Validation Error', errors[firstErrorKey] || 'Please fill all required fields');
      }
      return;
    }

    // Simulate API call with loading state
    setLoading(true);
    
    // Calculate totals for display
    const subtotal = fields.items.reduce((sum, item) => {
      return sum + (parseFloat(item.total) || 0);
    }, 0);
    
    // Calculate discount
    let discountAmount = 0;
    const discountType = fields.discountType || '';
    const discountValue = parseFloat(fields.discountValue || '0') || 0;
    
    if (discountType === 'percentage' && discountValue > 0) {
      discountAmount = (subtotal * discountValue) / 100;
    } else if (discountType === 'absolute' && discountValue > 0) {
      discountAmount = discountValue;
    }
    
    // Calculate final amount after discount
    const finalAmount = Math.max(0, subtotal - discountAmount);
    
    const cgst = fields.cgst ? parseFloat(fields.cgst) : finalAmount * 0.025;
    const sgst = fields.sgst ? parseFloat(fields.sgst) : finalAmount * 0.025;
    const grandTotal = finalAmount + cgst + sgst;

    // Log the data that would be submitted (for debugging)
    console.log('Invoice Data to be submitted:', {
      ...fields,
      calculatedSubtotal: subtotal.toFixed(2),
      calculatedDiscountAmount: discountAmount.toFixed(2),
      calculatedFinalAmount: finalAmount.toFixed(2),
      calculatedCGST: cgst.toFixed(2),
      calculatedSGST: sgst.toFixed(2),
      calculatedGrandTotal: grandTotal.toFixed(2),
    });

    // Simulate API delay for better UX
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Success',
        'Invoice data validated successfully!\n\n(API integration pending)',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form and navigate back
              setFields(emptyFields);
              (navigation as any).navigate('InvoiceDetails');
            },
          },
        ]
      );
    }, 1500); // 1.5 second delay to simulate API call
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

  return (
    <Container>
      <AppBar 
        title="Invoice Dashboard" 
        navigation={navigation as any}
        showProgramSelector={true}
      />
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
            loading={loading}
            errors={errors}
            isFormValid={isFormValid}
            productType={productType}
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
        allowedFileTypes={['jpg', 'jpeg', 'png', 'pdf']}
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

