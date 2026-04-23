import React, {useMemo, useState, useEffect, useCallback} from 'react';
import moment from 'moment';
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
  BackHandler,
} from 'react-native';
import {useNavigation, useRoute, useFocusEffect} from '@react-navigation/native';
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
  updateInvoiceRequest,
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
import {
  setProgramSelection,
  setProgramScope,
  toggleProgramSelection,
} from '@store/programSelection/programSelection.slice';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';
import type {DealerInfoParticipant} from '@store/invoice/inv.types';
import {decryptValue} from '@utils/decrypt';
import {invoiceApi} from '@services/api/invoice.api';

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

import {
  fetchPermissionsRequest,
  selectPermissions,
  selectPermissionsLoading,
  selectPermissionsError,
} from '@store/permissions';

export const CreateInvoice: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const programSelection = useSelector((state: any) => state.programSelection);

  const resetScreenData = useCallback(() => {
    setFields(getInitialFields());
    setSelectedParticipant(null);
    setSelectedAttachment(null);
    dispatch(resetCreateInvoiceState());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchPermissionsRequest());
      
      const onBackPress = () => {
        // When device back button is pressed, flush and allow default back behavior
        resetScreenData();
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => {
        backHandler.remove();
      };
    }, [dispatch, resetScreenData]),
  );

  // Flush screen data on unmount or when navigating away (back button)
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      // If we are not coming back from preview, ensure we have a fresh state.
      if (!route.params?.previewReturnToken) {
        resetScreenData();
      }
    });

    const removeListener = navigation.addListener('beforeRemove', (e) => {
      // If we are navigating to Preview, do NOT flush data.
      // We check the action to see where we are going.
      const action = e.data.action;
      const isGoingToPreview = action.type === 'NAVIGATE' && (action.payload as any)?.name === 'InvoiceUploadPreview';
      
      if (!isGoingToPreview) {
        // Flush state if leaving the screen (Back button, menu switch, etc.)
        resetScreenData();
      }
    });

    return () => {
      unsubscribeFocus();
      removeListener();
    };
  }, [navigation, dispatch, route.params?.previewReturnToken, resetScreenData]);

  // Handle final flush only when the screen is actually unmounting
  useEffect(() => {
    return () => {
      console.log('[CreateInvoice] Unmounting screen, flushing data');
      resetScreenData();
    };
  }, [resetScreenData]);

  const dealerInfo = useSelector(selectDealerInfo);
  const dealerInfoError = useSelector(selectDealerInfoError);
  const createInvoiceLoading = useSelector(selectCreateInvoiceLoading);
  const createInvoiceSuccess = useSelector(selectCreateInvoiceSuccess);
  const createInvoiceError = useSelector(selectCreateInvoiceError);
  const userId = useSelector((s: any) => s.user?.id);
  const permissions = useSelector(selectPermissions) || [];
  const permissionsLoading = useSelector(selectPermissionsLoading);
  const permissionsError = useSelector(selectPermissionsError);
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const isAnchorMaker = userRole === 'anchor_maker';
  const isDealerMaker = userRole === 'dealer_maker';
  const isCashnTechUser = userRole === 'cashntech_user';

  const [fields, setFields] = useState<InvoiceFields>(() => getInitialFields());
  const [ocrLoading, setOcrLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isOcrUploadModalVisible, setIsOcrUploadModalVisible] = useState(false);
  const [isProofUploadModalVisible, setIsProofUploadModalVisible] = useState(false);

  const isFormValid = useMemo(() => {
    return !!(
      fields.invoiceNumber?.trim() &&
      fields.dealer?.trim() &&
      fields.invoiceDate?.trim() &&
      fields.items &&
      fields.items.length > 0 &&
      fields.creditTo?.trim()
    );
  }, [fields]);

  console.log('[CreateInvoice] Render, createInvoiceLoading:', createInvoiceLoading, 'isFormValid:', isFormValid);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [selectedParticipant, setSelectedParticipant] = useState<DealerInfoParticipant | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<DocumentPickerResponse | null>(null);
  const disabled = useMemo(
    () => createInvoiceLoading || ocrLoading || permissionsLoading,
    [createInvoiceLoading, ocrLoading, permissionsLoading],
  );
  const [productType, setProductType] = useState<'dealer_finance' | 'vendor_finance'>('dealer_finance');
  const invoiceNo: string | undefined = route?.params?.invoiceNo;
  const mode: 'edit' | 'recreate' | undefined = route?.params?.mode;
  const previewFieldsFromRoute: InvoiceFields | undefined = route?.params?.previewFields;
  const previewAttachmentFromRoute: DocumentPickerResponse | undefined = route?.params?.previewAttachment;
  const previewReturnToken: number | undefined = route?.params?.previewReturnToken;
  
  const hasCreatePerm = permissions.includes('lms.transactions.invoice_list.action.create_invoice');
  const hasEditPerm = permissions.includes('lms.transactions.invoice_list.action.edit');
  const hasRecreatePerm = permissions.includes('lms.transactions.invoice_list.action.recreate_invoice');
  const hasUploadPerm = permissions.includes('lms.transactions.invoice_list.action.import');
  const hasAttachmentPerm = permissions.includes('lms.transactions.invoice_list.action.attachment');
  const canUploadFinal = hasUploadPerm && hasAttachmentPerm;

  // Determine required permission based on mode
  const hasRequiredPerm = () => {
    if (mode === 'edit') {
      return hasEditPerm;
    } else if (mode === 'recreate') {
      return hasRecreatePerm;
    } else {
      return hasCreatePerm;
    }
  };

  const headerModeTitle = mode === 'edit' ? "Invoice Details [Edit Invoice]" : "Invoice Details";
   
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

  // Permission validation for Create/Edit Invoice
  useEffect(() => {
    if (!permissionsLoading && !hasRequiredPerm()) {
      const actionName = mode === 'edit' ? 'edit' : mode === 'recreate' ? 'recreate' : 'create';
      Alert.alert(
        'Access Denied',
        `You do not have permission to ${actionName} an invoice. Please contact your administrator.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Safely navigate back - if canGoBack, use goBack, otherwise navigate to InvoiceDetails
              if ((navigation as any).canGoBack?.()) {
                (navigation as any).goBack();
              } else {
                (navigation as any).navigate('InvoiceDetails');
              }
            },
          },
        ],
      );
      
      // Optional: Automatically navigate the user back after 3 seconds
      const timer = setTimeout(() => {
        if ((navigation as any).canGoBack?.()) {
          (navigation as any).goBack();
        } else {
          (navigation as any).navigate('InvoiceDetails');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [permissionsLoading, hasCreatePerm, hasEditPerm, hasRecreatePerm, mode, navigation]);

  // Handle Permissions API Error
  useEffect(() => {
    if (permissionsError) {
      Alert.alert('Error', 'Failed to verify permissions. Please try again.');
    }
  }, [permissionsError]);
  
  // Fetch dealer info and bank list when program is selected
  useEffect(() => {
    const programId = programSelection?.programId;
    if (programId) {
      dispatch(fetchDealerInfoRequest(programId));
    }
  }, [programSelection?.programId, dispatch]);

  // Toast: removed debug program selection toasts
  useEffect(() => {
    // Debug toasts removed for better UX
  }, [programSelection?.programId]);

  // Toast: removed debug dealer info toasts
  useEffect(() => {
    if (dealerInfo) {
      // Debug toasts removed for better UX
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

  // Fetch invoice details when in 'edit' or 'recreate' mode
  useEffect(() => {
    if ((mode !== 'edit' && mode !== 'recreate') || !route?.params?.invoiceId) return;

    let cancelled = false;
    setOcrLoading(true);
    invoiceApi
      .getInvoiceDetails(route.params.invoiceId)
      .then((res: any) => {
        if (cancelled || !res) return;
        const data = res;
        const apm = data.anchorParticipantMapping;

        // In edit mode the dealer field is read-only (not a dropdown), so store the decrypted name for display
        const rawDealerEntityName = apm?.party?.entity_name || '';
        const decryptedDealerName = decryptValue(rawDealerEntityName) || rawDealerEntityName;
        const dealerCode = apm?.company_code_given_by_party || '';
        const odAccountNumber =
          decryptValue(apm?.od_account_no ?? '') || apm?.od_account_no || '';

        const mappedItems: InvoiceLineItem[] = (data.invoiceItems || []).map(
          (item: any) => ({
            id: item.id,
            itemName: item.name || '',
            description: item.description || '',
            quantity: String(item.quantity || '0'),
            unit: item.unit || 'PCS',
            pricePerQuantity: String(item.price_per_quantity || '0'),
            total: String(item.total || '0'),
            // Normalize discount_type: convert 'absolute' to 'value' for the dropdown
            discountType: item.discount_type === 'absolute' ? 'value' : (item.discount_type || ''),
            discountValue: String(item.discount_value || '0'),
            discountAmount: String(item.discount_amount || '0'),
            taxes: (item.taxes || []).map((t: any) => ({
              taxType: t.tax_type || 'GST',
              taxPercentage: String(t.tax_percentage || '0'),
              taxAmount: String(t.tax_amount || '0'),
            })),
          }),
        );

        const formatDate = (date: string) =>
          date ? moment(date).format('DD-MM-YYYY') : '';

        const nextFields: InvoiceFields = {
          ...getInitialFields(),
          dealer: decryptedDealerName,
          dealerCode,
          odAccountNumber,
          invoiceNumber: data.invoice_ref_no || '',
          associatedPO: '',
          invoiceDate: formatDate(data.invoice_date),
          paymentDate: formatDate(data.payment_date),
          invoiceDueDate: formatDate(data.invoice_due_date),
          grnDate: formatDate(data.grn_date),
          remark: data.remark || '',
          currency: data.currency || 'INR',
          creditTo: data.partnerBank?.bank_name || '',
          items: mappedItems,
          discountValue: String(data.discount_total || '0'),
          grandTotal: String(data.final_total || '0'),
          attachments: (data.attachment || []).map((a: any) => ({
            id: a.id,
            attachment_url: a.attachment_url,
          })),
        };

        setFields(nextFields);

        // Update flat program fields so dealerInfo can be fetched.
        // Use setProgramSelection (not toggleProgramSelection) so selectedPrograms
        // is NOT updated — this keeps the breadcrumb in its previous state and
        // allows the beforeRemove reset to 'all' to work correctly on back.
        if (data.program?.id) {
          dispatch(
            toggleProgramSelection({
              programId: data.program?.id || '',
              programName: data.program?.program_name || data.program_name || '',
              bankId: data.program?.productConfig?.partnerBank?.id || data.partnerBank?.id || '',
              bankName: data.program?.productConfig?.partnerBank?.bank_name || data.bank_name || data.partnerBank?.bank_name || '',
              productId: data.program?.productConfig?.product?.id || '',
              productName: data.program?.productConfig?.product?.name || data.product_name || '',
              partyId: data.party?.id || '',
              userType: (data.program?.productConfig?.product?.name || data.product_name || '').toLowerCase().includes('dealer') ? 'dealer' : 'vendor',
            }),
          );
        }

        // Pre-select participant from dealerInfo if available
        if (dealerInfo?.participants?.length) {
          const participant = dealerInfo.participants.find(
            p => p.party.entity_name === rawDealerEntityName || p.id === apm?.id,
          );
          if (participant) setSelectedParticipant(participant);
        }
      })
      .catch(err => {
        Alert.alert('Error', 'Failed to fetch invoice details for editing.');
        console.error('Fetch edit details error:', err);
      })
      .finally(() => {
        if (!cancelled) setOcrLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, route?.params?.invoiceId, dealerInfo?.participants]);

  // Handle create invoice success / error
  useEffect(() => {
    if (createInvoiceSuccess) {
      dispatch(resetCreateInvoiceState());
      setFields(getInitialFields());
      setSelectedParticipant(null);
      setSelectedAttachment(null);
      Alert.alert('Success', mode === 'edit' ? 'Invoice updated successfully.' : 'Invoice created successfully.', [
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
      case 'invoiceDueDate':
        if (!value?.trim()) {
          return 'Invoice Due Date is required';
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

  // Validate all fields in order of appearance
  const validateForm = (returnFirstOnly = false): {isValid: boolean; firstError?: string; errors: ValidationErrors} => {
    const newErrors: ValidationErrors = {};
    let firstError: string | undefined;

    const validationOrder: string[] = [
      'dealer',
      'dealerCode',
      'invoiceNumber',
      'invoiceDate',
      'invoiceDueDate',
      'creditTo',
      'items',
    ];

    if (canUploadFinal) {
      validationOrder.push('attachment');
    }

    for (const field of validationOrder) {
      let error: string | undefined;
      
      if (field === 'attachment') {
        const hasAnyAttachmentForValidation = !!selectedAttachment || (fields.attachments && fields.attachments.length > 0);
        if (!hasAnyAttachmentForValidation) {
           error = 'Please upload the invoice file';
        }
      } else {
        error = validateField(field as keyof InvoiceFields, fields[field as keyof InvoiceFields]);
      }

      if (error) {
        newErrors[field] = error;
        if (!firstError) firstError = error;
        if (returnFirstOnly) break;
      }
    }
    
    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      firstError,
      errors: newErrors,
    };
  };

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
    // 1. First, validate all form fields in order of appearance
    const validation = validateForm(true);
    console.log('[CreateInvoice] handleSubmit called, validation:', validation);
    if (!validation.isValid) {
      Toast.show({
        type: 'error',
        text1: validation.firstError || 'Please fill all required fields',
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
      if (mode === 'edit' && route?.params?.invoiceId) {
        console.log('[CreateInvoice] Dispatching updateInvoiceRequest');
        dispatch(
          updateInvoiceRequest({
            invoiceId: route.params.invoiceId,
            fields,
            createdBy,
            attachment: selectedAttachment ?? undefined,
            approval_level: 1, // Reset to first checker as per backend discovery
          }),
        );
        return;
      }

      console.log('[CreateInvoice] Attempting to dispatch createInvoiceRequest', {
        partnerBankId,
        programId: programSelection?.programId,
        productId: programSelection?.productId,
        participantId: selectedParticipant?.id,
        partyId: programSelection?.partyId || (dealerInfo as any)?.party?.id
      });
      try {
        dispatch(
          createInvoiceRequest({
            fields,
            createdBy,
            partnerBank: String(partnerBankId || ''),
            program: String(programSelection?.programId || ''),
            product: String(programSelection?.productId || ''),
            anchorParticipantMapping: String(selectedParticipant?.id || ''),
            // For Anchor-maker: backend expects invoice.party to be the Anchor party.
            // prioritize the partyId captured at program selection.
            party: String(programSelection?.partyId || (dealerInfo as any)?.party?.id || ''),
            counterPartyName: String(selectedParticipant?.party?.entity_name || ''),
            counterPartyCode: String(selectedParticipant?.company_code || ''),
            counterPartyOdAccount: String(selectedParticipant?.od_account_no || ''),
            attachment: selectedAttachment ?? undefined,
          }),
        );
        console.log('[CreateInvoice] createInvoiceRequest dispatch was successful');
      } catch (e: any) {
        console.error('[CreateInvoice] CRITICAL ERROR during dispatch:', e);
        Alert.alert('Submission Error', 'A local error occurred while preparing your submission. Please try again.');
      }
    } else {
      console.log('[CreateInvoice] handleSubmit failed to enter a dispatch block', {
        dealerInfo: !!dealerInfo,
        selectedParticipant: !!selectedParticipant,
        programId: programSelection?.programId,
        partnerBankId
      });
      Toast.show({
        type: 'error',
        text1: 'Please select a Program from the dashboard first, then try again.',
        visibilityTime: 3000,
      });
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      setOcrLoading(true);
      await invoiceApi.deleteInvoiceAttachment(attachmentId);
      setFields(prev => ({
        ...prev,
        attachments: (prev.attachments || []).filter(a => a.id !== attachmentId),
      }));
      Toast.show({
        type: 'success',
        text1: 'Attachment deleted',
      });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to delete attachment');
    } finally {
      setOcrLoading(false);
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
        dispatch(setProgramScope('all'));
        InteractionManager.runAfterInteractions(() => {
          resetCreateInvoiceForm();
        });
      }
    });

    return unsubscribe;
  }, [navigation, resetCreateInvoiceForm]);

  // Handle Android hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        (navigation as any).navigate('InvoiceDetails');
        return true; // Prevent default behavior (going back to Home)
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation]),
  );

  const hasAnyAttachment = !!selectedAttachment || (fields.attachments && fields.attachments.length > 0);
  const submitButtonAppearsDisabledInternal = (canUploadFinal && !hasAnyAttachment) || !isFormValid;
  
  const submitDisabledReasonInternal = useMemo(() => {
    if (!fields.dealer?.trim()) return 'Dealer Name is required';
    if (!fields.dealerCode?.trim()) return 'Dealer Code is required';
    if (!fields.invoiceNumber?.trim()) return 'Invoice / Unique Ref. No is required';
    if (!fields.invoiceDate?.trim()) return 'Invoice Date is required';
    if (!fields.creditTo?.trim()) return 'Credit To is required';
    if (!fields.items || fields.items.length === 0) return 'At least one item is required';
    
    // Items detail check
    for (let i = 0; i < (fields.items?.length || 0); i++) {
       const item = fields.items![i];
       if (!item.itemName?.trim()) return `Item ${i + 1}: Item Name is required`;
       if (!item.quantity?.trim() || parseFloat(item.quantity) <= 0) return `Item ${i + 1}: Valid Quantity is required`;
       if (!item.unit?.trim()) return `Item ${i + 1}: Unit is required`;
       if (!item.pricePerQuantity?.trim() || parseFloat(item.pricePerQuantity) <= 0) return `Item ${i + 1}: Valid Price is required`;
    }

    if (canUploadFinal && !hasAnyAttachment) {
      return 'Please upload the invoice file';
    }
    return undefined;
  }, [fields, canUploadFinal, hasAnyAttachment]);

  const dealerOptions = useMemo(
    () =>
      dealerInfo?.participants?.map(p => ({
        label: decryptValue(p.party.entity_name ?? '') || p.party.entity_name,
        value: p.party.entity_name,
      })) ?? [],
    [dealerInfo],
  );
  const creditToOptions = useMemo(
    () => {
      // Use bank_details from party root if available
      const details = (dealerInfo as any)?.bank_details || dealerInfo?.party?.party_bank_details;
      return details?.map((b: any) => ({
        label: decryptValue(b.account_number ?? '') || b.account_number,
        value: b.account_number,
      })) ?? [];
    },
    [dealerInfo],
  );
  if (permissionsLoading) {
    return (
      <Container>
        <AppBar 
          title="Create Invoice" 
          navigation={navigation as any} 
          renderLeftIcon={<LeftChevron width={scaleWidth(18)} height={scaleHeight(18)} />}
          onPressLeftIcon={() => {
          resetScreenData();
          (navigation as any).navigate('InvoiceDetails');
        }}
        />
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white}}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
          <Text style={{marginTop: scaleHeight(12), fontFamily: Fonts.GilroyMedium, color: Colors.graybase}}>
            Verifying permissions...
          </Text>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <AppBar 
        title={(isAnchorMaker || isDealerMaker || isCashnTechUser) ? "Transactions > Invoice List & Approval" : "Create Invoice"} 
        navigation={navigation as any}
        hideHamburger={isAnchorMaker || isDealerMaker || isCashnTechUser}
        renderLeftIcon={<LeftChevron width={scaleWidth(18)} height={scaleHeight(18)} />}
        onPressLeftIcon={() => (navigation as any).navigate('InvoiceDetails')}
      />
      <View style={styles.pageTitleBar}>
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitleText} numberOfLines={1}>
            {headerModeTitle}
          </Text>
          {(fields.invoiceNumber || invoiceNo) && (
            <Text style={styles.pageSubtitleText}>
              {fields.invoiceNumber || invoiceNo}
            </Text>
          )}
          
        </View>
      </View>
      <View style={styles.container}>
        {/* OCR Badge */}
        {hasCreatePerm && (
          <View style={styles.aiBadge}>
            <AI
              width={scaleWidth(18)}
              height={scaleHeight(18)}
              color={Colors.primaryColor}
            />
            <Text style={styles.aiBadgeText}>OCR Extraction (Capture / Upload)</Text>
          </View>
        )}

        {/* OCR Section */}
        {hasCreatePerm && (
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
          </View>
        )}

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
            submitButtonAppearsDisabled={submitButtonAppearsDisabledInternal}
            submitDisabledReason={submitDisabledReasonInternal}
            productType={productType}
            dealerOptions={dealerOptions.length > 0 ? dealerOptions : undefined}
            creditToOptions={creditToOptions.length > 0 ? creditToOptions : undefined}
            staleInvoicePeriodDays={dealerInfo?.basic_parameters?.stale_invoice_period_days != null ? Number(dealerInfo.basic_parameters.stale_invoice_period_days) : undefined}
            defaultPaymentTermsDays={dealerInfo?.basic_parameters?.default_payment_terms_days != null ? Number(dealerInfo.basic_parameters.default_payment_terms_days) : undefined}
            mode={mode}
            onDeleteAttachment={handleDeleteAttachment}
            canUploadFinal={canUploadFinal}
            onAddAttachment={() => setIsProofUploadModalVisible(true)}
            selectedAttachment={selectedAttachment}
          />
        </ScrollView>
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
  proofSection: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(12),
    paddingBottom: scaleHeight(12),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
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
    paddingBottom: scaleHeight(20),
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

