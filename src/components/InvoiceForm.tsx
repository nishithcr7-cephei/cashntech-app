import React, {useState, useEffect, useMemo} from 'react';
import Toast from 'react-native-toast-message';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Linking,
  Keyboard,
} from 'react-native';
import type {InvoiceFields, InvoiceLineItem} from '@type/Invoice';
import {DateNTimePicker, CustomDropdown} from '@components/index';
import {
  AdvanceInterestFormulaModal,
  DisbursementRequestedFormulaModal,
  InvoiceAmountFormulaModal,
  NetDisbursementFormulaModal,
} from '@components/AdvanceInterestFormulaModal';
import {InvoiceAccountingSummary} from '@components/InvoiceAccountingSummary';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import moment from 'moment';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {useSelector} from 'react-redux';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';
import {
  computeInvoiceLineAggregates,
  computeInvoiceNetTotal,
  formatIndianAmountInput,
  stripAmountInput,
} from '@utils/invoiceTotals';

const AMOUNT_ITEM_FIELDS = new Set<keyof InvoiceLineItem>([
  'quantity',
  'pricePerQuantity',
  'discountValue',
]);

/**
 * Credit-to bank account option. `accountId` carries the party-info
 * `bankAccounts.id` UUID (DF + VF, unified backend) — sent as
 * `credit_to_account_id` on submit; `value`/`label` stay the display
 * account number for backward-compatible matching (e.g. edit mode).
 */
export type CreditToOption = DropdownOption & {accountId?: string};

/** Party tax from GET /configuration/program/invoice-tax/:programId */
export type PartyTaxOption = {
  label: string;
  value: string;
  percentage: number;
  id?: number;
  /** Present when tax is linked to TDS section master */
  sectionNatureId?: string | null;
  threshold?: number | null;
  isTds?: boolean;
};

function normalizeUnitInput(value: string): string {
  return value.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 3);
}

const emptyFields: InvoiceFields = {
  dealer: '',
  dealerCode: '',
  odAccountNumber: '',
  invoiceNumber: '',
  associatedPO: '',
  tenor: '',
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
  tdsAmount: '0',
  upfrontInterest: '0',
};

interface ValidationErrors {
  invoiceNumber?: string;
  dealer?: string;
  dealerCode?: string;
  invoiceDate?: string;
  tenor?: string;
  items?: string;
  [key: string]: string | undefined;
}

type Props = {
  value: InvoiceFields;
  onChange: (patch: Partial<InvoiceFields>) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  errors?: ValidationErrors;
  isFormValid?: boolean;
  productType?: 'dealer_finance' | 'vendor_finance';
  entityType?: 'dealer' | 'anchor'; // Role-based: 'dealer' for Anchor Maker/Checker, 'anchor' for Dealer Maker
  dealerOptions?: DropdownOption[];
  creditToOptions?: CreditToOption[];
  tenorOptions?: DropdownOption[];
  /** Active party taxes — GST dropdown only (TDS filtered out by parent). */
  partyTaxOptions?: PartyTaxOption[];
  onLoadPartyTaxes?: () => void;
  /** Show Advance Interest row (VF + Upfront) — web Create parity. */
  showAdvanceInterest?: boolean;
  advanceInterest?: number;
  /** ROI used in VF Upfront Advance Interest formula tooltip. */
  roiPercent?: number;
  bankOptions?: DropdownOption[];
  selectedBankId?: string;
  onBankSelect?: (bankId: string) => void;
  /** From dealer-info API basic_parameters: days user can go back for invoice date (default 30) */
  staleInvoicePeriodDays?: number;
  /** From dealer-info API basic_parameters: max days from today for invoice due date (default 60) */
  defaultPaymentTermsDays?: number;
  /** When true, submit button appears disabled but remains pressable (for toast feedback) */
  submitButtonAppearsDisabled?: boolean;
  /** Human-readable reason WHY the submit button is disabled — shown as toast when pressed */
  submitDisabledReason?: string;
  mode?: 'edit' | 'recreate';
  onDeleteAttachment?: (id: number) => void;
  onDeleteItem?: (index: number) => void;
  onDeleteItemTax?: (itemIndex: number, taxIndex: number) => void;
  canUploadFinal?: boolean;
  onAddAttachment?: () => void;
  selectedAttachment?: any; // To avoid import complexity now, using any for DocumentPickerResponse
  /** Open invoice preview again to cross-check before submit. */
  onPreview?: () => void;
  /** When true, preview button looks disabled but stays pressable (toast feedback). */
  previewButtonAppearsDisabled?: boolean;
  /** Reason shown when preview is pressed while not ready. */
  previewDisabledReason?: string;
  /** When true, item discount/tax dropdowns and delete actions are locked (OCR-filled invoice). */
  isOcrMode?: boolean;
  /** When true, form inputs are locked; Cancel remains available. */
  ocrLoading?: boolean;
};

export const InvoiceForm: React.FC<Props> = ({
  value,
  onChange,
  onSubmit,
  onCancel,
  loading = false,
  errors = {},
  productType = 'dealer_finance',
  entityType,
  dealerOptions,
  creditToOptions,
  tenorOptions,
  partyTaxOptions,
  onLoadPartyTaxes,
  showAdvanceInterest = false,
  advanceInterest = 0,
  roiPercent = 0,
  staleInvoicePeriodDays = 30,
  defaultPaymentTermsDays = 60,
  submitButtonAppearsDisabled = false,
  submitDisabledReason,
  mode,
  onDeleteAttachment,
  onDeleteItem,
  onDeleteItemTax,
  canUploadFinal = false,
  onAddAttachment,
  selectedAttachment,
  onPreview,
  previewButtonAppearsDisabled = false,
  previewDisabledReason,
  isOcrMode = false,
  ocrLoading = false,
}) => {
  const storageBaseUrl = 'https://d2wayd1he5a7q1.cloudfront.net'; // Same as DetailView
  const dealerData = dealerOptions ?? [];
  const creditToData = creditToOptions ?? [];
  const taxTypeDropdownData: DropdownOption[] =
    partyTaxOptions && partyTaxOptions.length > 0
      ? [
          {label: 'None', value: ''},
          ...partyTaxOptions.map(t => ({label: t.label, value: t.value})),
        ]
      : [
          {label: 'None', value: ''},
          {label: 'GST', value: 'GST'},
          {label: 'CGST', value: 'CGST'},
          {label: 'OTHER', value: 'OTHER'},
        ];

  const isPartyConfiguredTax = (taxName: string) =>
    !!taxName && (partyTaxOptions?.some(t => t.value === taxName) ?? false);
  const [showInvoiceNumberTooltip, setShowInvoiceNumberTooltip] = useState(false);
  const [showPOTooltip, setShowPOTooltip] = useState(false);
  const [showCreditAccountTooltip, setShowCreditAccountTooltip] = useState(false);
  const [showDiscountTooltip, setShowDiscountTooltip] = useState(false);
  const [showCGSTTooltip, setShowCGSTTooltip] = useState(false);
  const [showSGSTTooltip, setShowSGSTTooltip] = useState(false);
  const [showPaymentDateTooltip, setShowPaymentDateTooltip] = useState(false);
  const [showAdvanceInterestFormula, setShowAdvanceInterestFormula] =
    useState(false);
  const [showInvoiceAmountFormula, setShowInvoiceAmountFormula] =
    useState(false);
  const [showDisbursementRequestedFormula, setShowDisbursementRequestedFormula] =
    useState(false);
  const [showNetDisbursementFormula, setShowNetDisbursementFormula] =
    useState(false);

  // Role-based entity type: use entityType prop if provided, otherwise derive from productType or user role
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const isDealerMaker = userRole === 'dealer_maker';
  const effectiveEntityType = entityType ?? (isDealerMaker ? 'anchor' : 'dealer');
  const isDealerFinance = productType !== 'vendor_finance';
  
  // Determine labels based on entityType (role-based)
  const entityLabel = effectiveEntityType === 'anchor' ? 'Anchor' : 'Dealer';
  const entityCodeLabel = effectiveEntityType === 'anchor' ? 'Anchor Code' : 'Dealer Code';
  const entityNameLabel = effectiveEntityType === 'anchor' ? 'Anchor Name' : 'Dealer Name';
  const entityODLabel = effectiveEntityType === 'anchor' ? 'Anchor OD Account' : 'Dealer OD Account';
  const entityInvoiceLabel = effectiveEntityType === 'anchor' ? 'Anchor Invoice' : 'Dealer Invoice';

  const TENURE_DAYS = defaultPaymentTermsDays;
  const isHistoricalInvoiceMode = mode === 'edit' || mode === 'recreate';

  const selectedTenorDays = useMemo(() => {
    const parsed = parseInt(String(value.tenor ?? '').trim(), 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    return undefined;
  }, [value.tenor]);

  const advanceInterestFormulaAmounts = useMemo(() => {
    const {subTotal, discountTotal, taxTotal} = computeInvoiceLineAggregates(
      value.items,
      value,
    );
    return {
      basicAmount: subTotal,
      discount: discountTotal,
      gstAmount: taxTotal,
      tdsAmount: parseFloat(value.tdsAmount || '0') || 0,
      advanceInterest: showAdvanceInterest ? advanceInterest : 0,
      roiPercent,
      tenorDays: selectedTenorDays ?? value.tenor,
    };
  }, [
    value.items,
    value.cgst,
    value.sgst,
    value.taxTotal,
    value.tdsAmount,
    value.tenor,
    selectedTenorDays,
    showAdvanceInterest,
    advanceInterest,
    roiPercent,
  ]);

  const tenureDaysForDueDate = selectedTenorDays ?? TENURE_DAYS;

  // Calculate Invoice Due Date based on Invoice Date, GRN Date, and Tenure
  const calculateInvoiceDueDate = (
    invoiceDate: string,
    grnDate: string,
    tenureDays: number
  ): string => {
    if (!invoiceDate) return '';

    // If GRN Date is available, use GRN Date + Tenure
    // Otherwise, use Invoice Date + Tenure
    const baseDate = grnDate && grnDate.trim() 
      ? moment(grnDate, ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true)
      : moment(invoiceDate, ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true);

    if (!baseDate.isValid()) return '';

    // Add tenure days to base date
    const dueDate = baseDate.clone().add(tenureDays, 'days');
    return dueDate.format('DD-MM-YYYY');
  };

  // Auto-calculate Invoice Due Date only when Invoice Date or GRN Date changes.
  // Do NOT include invoiceDueDate in deps – otherwise manual due date changes get overwritten.
  useEffect(() => {
    if (isHistoricalInvoiceMode) return;
    if (!selectedTenorDays) return;
    if (value.invoiceDate) {
      const calculatedDueDate = calculateInvoiceDueDate(
        value.invoiceDate,
        value.grnDate || '',
        selectedTenorDays,
      );
      if (calculatedDueDate) {
        onChange({invoiceDueDate: calculatedDueDate});
      }
    } else if (!value.invoiceDate && value.invoiceDueDate) {
      onChange({invoiceDueDate: ''});
    }
  }, [
    value.invoiceDate,
    value.grnDate,
    selectedTenorDays,
    isHistoricalInvoiceMode,
  ]);

  // Validate Invoice Date: up to staleInvoicePeriodDays back from today, no future dates
  const validateInvoiceDate = (dateStr: string): string | undefined => {
    if (isHistoricalInvoiceMode) return undefined;
    if (!dateStr) return undefined;
    
    const invoiceDate = moment(dateStr, ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true);
    if (!invoiceDate.isValid()) {
      return 'Invalid date format';
    }

    const today = moment().startOf('day');
    const minDate = moment().subtract(staleInvoicePeriodDays, 'days').startOf('day');

    if (invoiceDate.isAfter(today)) {
      return 'Invoice date cannot be in the future';
    }
    if (invoiceDate.isBefore(minDate)) {
      return `Invoice date cannot be more than ${staleInvoicePeriodDays} days in the past`;
    }

    return undefined;
  };

  // Validate Invoice Due Date: from today up to defaultPaymentTermsDays
  const validateInvoiceDueDate = (dateStr: string): string | undefined => {
    if (isHistoricalInvoiceMode) return undefined;
    if (!dateStr) return undefined;
    
    const dueDate = moment(dateStr, ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true);
    if (!dueDate.isValid()) {
      return 'Invalid date format';
    }

    const today = moment().startOf('day');
    const maxDate = moment()
      .add(tenureDaysForDueDate, 'days')
      .startOf('day');

    if (dueDate.isBefore(today)) {
      return 'Invoice due date cannot be in the past';
    }
    if (dueDate.isAfter(maxDate)) {
      return `Invoice due date cannot be more than ${tenureDaysForDueDate} days from today`;
    }

    return undefined;
  };

  // Validate Payment Date: no back date, today or future only
  const validatePaymentDate = (dateStr: string, _invoiceDateStr?: string): string | undefined => {
    if (isHistoricalInvoiceMode) return undefined;
    if (!dateStr) return undefined;
    
    const paymentDate = moment(dateStr, ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true);
    if (!paymentDate.isValid()) {
      return 'Invalid date format';
    }

    const today = moment().startOf('day');
    if (paymentDate.isBefore(today)) {
      return 'Payment date cannot be in the past';
    }

    return undefined;
  };

  const set = (key: keyof InvoiceFields) => (text: string) => {
    onChange({[key]: text});
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Default reset behavior
      onChange(emptyFields);
    }
  };

  // Helper to parse date string from OCR or convert Date to string
  const parseDateValue = (dateValue: string | undefined): string | Date => {
    if (!dateValue) return '';
    if (typeof dateValue === 'string') {
      // Try to parse common date formats
      const parsed = moment(dateValue, ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'MM-DD-YYYY', 'MM/DD/YYYY'], true);
      if (parsed.isValid()) {
        return parsed.format('DD-MM-YYYY');
      }
      return dateValue;
    }
    return dateValue;
  };

  // Helper to convert Date to string format
  const formatDateForStorage = (date: Date): string => {
    return moment(date).format('DD-MM-YYYY');
  };

  /**
   * Numeric precision utility (equivalent to Web's Ue() utility)
   * Rounds a value to 2 decimal places and ensures it's a valid number.
   */
  const roundToTwo = (val: number | string): number => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 0;
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  const updateItem = (index: number, field: keyof InvoiceLineItem, text: string) => {
    const newItems = [...(value.items || [])];
    if (!newItems[index]) {
      newItems[index] = {
        itemName: '', 
        description: '',
        quantity: '', 
        unit: '', 
        pricePerQuantity: '', 
        total: '',
        discountType: '',
        discountValue: '',
        discountAmount: '',
        taxType: '',
        taxPercentage: '',
        taxAmount: '',
        taxes: [{taxType: '', taxPercentage: '', taxAmount: ''}],
      };
    }
    const normalizedText =
      field === 'unit'
        ? normalizeUnitInput(text)
        : AMOUNT_ITEM_FIELDS.has(field)
          ? stripAmountInput(text)
          : text;
    newItems[index] = {...newItems[index], [field]: normalizedText};
    
    // Auto-calculate line total (qty * price)
    const qty = parseFloat(newItems[index].quantity) || 0;
    const price = parseFloat(newItems[index].pricePerQuantity) || 0;
    const lineTotal = roundToTwo(qty * price);
    newItems[index].total = lineTotal.toFixed(2);
    
    // Auto-calculate item-level discount
    const discountType = newItems[index].discountType || '';
    let discountValue = parseFloat(newItems[index].discountValue || '0') || 0;
    
    // Validation: Percentage must be <= 100
    if (discountType === 'percentage' && discountValue > 100) {
      discountValue = 100;
      newItems[index].discountValue = '100';
    }
    // Validation: Absolute must be <= lineTotal
    if (discountType === 'value' && discountValue > lineTotal) {
      discountValue = lineTotal;
      newItems[index].discountValue = lineTotal.toFixed(2);
    }

    let discountAmount = 0;
    if (discountType === 'percentage' && discountValue > 0) {
      discountAmount = roundToTwo((lineTotal * discountValue) / 100);
    } else if (discountType === 'value' && discountValue > 0) {
      discountAmount = roundToTwo(discountValue);
    }
    newItems[index].discountAmount = discountAmount.toFixed(2);
    
    // Web currently calculates tax on the item subtotal before discount.
    const taxableBase = lineTotal;
    
    const rawTaxes = newItems[index].taxes?.length ? newItems[index].taxes! : (newItems[index].taxType ? [{taxType: newItems[index].taxType!, taxPercentage: newItems[index].taxPercentage || '', taxAmount: newItems[index].taxAmount || ''}] : []);
    const taxes = rawTaxes.map(t => ({...t}));
    taxes.forEach((t, i) => {
      if (!t.taxType) {
        taxes[i] = {...t, taxPercentage: '', taxAmount: '0.00'};
        return;
      }
      const pct = parseFloat(t.taxPercentage || '0') || 0;
      taxes[i] = {...t, taxAmount: roundToTwo((taxableBase * pct) / 100).toFixed(2)};
    });
    newItems[index].taxes = taxes.length ? taxes : [{taxType: '', taxPercentage: '', taxAmount: ''}];
    newItems[index].taxAmount = roundToTwo(taxes.reduce((s, t) => s + (parseFloat(t.taxAmount || '0') || 0), 0)).toFixed(2);
    
    onChange({items: newItems});
  };

  const updateItemTax = (itemIndex: number, taxIndex: number, field: 'taxType' | 'taxPercentage' | 'taxAmount', fieldValue: string) => {
    const newItems = [...(value.items || [])];
    const item = newItems[itemIndex];
    if (!item) return;
    const taxes = [...(item.taxes?.length ? item.taxes : [{taxType: item.taxType || '', taxPercentage: item.taxPercentage || '', taxAmount: item.taxAmount || ''}])];
    if (!taxes[taxIndex]) taxes[taxIndex] = {taxType: '', taxPercentage: '', taxAmount: ''};
    taxes[taxIndex] = {...taxes[taxIndex], [field]: fieldValue};
    // Web currently calculates tax on the item subtotal before discount.
    const itemSubTotal = parseFloat(item.total) || 0;

    taxes.forEach((t, i) => {
      if (!t.taxType) {
        taxes[i] = {...t, taxPercentage: '', taxAmount: '0.00'};
        return;
      }
      const pct = parseFloat(t.taxPercentage || '0') || 0;
      taxes[i] = {...t, taxAmount: roundToTwo((itemSubTotal * pct) / 100).toFixed(2)};
    });
    newItems[itemIndex] = {...item, taxes};
    newItems[itemIndex].taxAmount = roundToTwo(taxes.reduce((s, t) => s + (parseFloat(t.taxAmount || '0') || 0), 0)).toFixed(2);
    onChange({items: newItems});
  };

  /** Tax type from party config: auto-fill % from API and lock (matches web). */
  const handleTaxTypeSelect = (itemIndex: number, taxIndex: number, taxName: string) => {
    onLoadPartyTaxes?.();
    const partyTax = partyTaxOptions?.find(t => t.value === taxName);
    const pct =
      taxName && partyTax != null ? String(partyTax.percentage) : '';

    const newItems = [...(value.items || [])];
    const item = newItems[itemIndex];
    if (!item) return;
    const taxes = [
      ...(item.taxes?.length
        ? item.taxes
        : [
            {
              taxType: item.taxType || '',
              taxPercentage: item.taxPercentage || '',
              taxAmount: item.taxAmount || '',
            },
          ]),
    ];
    if (!taxes[taxIndex]) {
      taxes[taxIndex] = {taxType: '', taxPercentage: '', taxAmount: ''};
    }
    taxes[taxIndex] = {
      ...taxes[taxIndex],
      taxType: taxName,
      taxPercentage: taxName ? pct : '',
      taxAmount: taxName ? taxes[taxIndex].taxAmount : '0.00',
    };

    const itemSubTotal = parseFloat(item.total) || 0;

    taxes.forEach((t, i) => {
      if (!t.taxType) {
        taxes[i] = {...t, taxPercentage: '', taxAmount: '0.00'};
        return;
      }
      const taxPct = parseFloat(t.taxPercentage || '0') || 0;
      taxes[i] = {
        ...t,
        taxAmount: roundToTwo((itemSubTotal * taxPct) / 100).toFixed(2),
      };
    });
    newItems[itemIndex] = {...item, taxes};
    newItems[itemIndex].taxAmount = roundToTwo(
      taxes.reduce((s, t) => s + (parseFloat(t.taxAmount || '0') || 0), 0),
    ).toFixed(2);
    onChange({items: newItems});
  };

  const addItemTax = (itemIndex: number) => {
    const newItems = [...(value.items || [])];
    const item = newItems[itemIndex];
    if (!item) return;
    const taxes = [...(item.taxes?.length ? item.taxes : [{taxType: item.taxType || '', taxPercentage: item.taxPercentage || '', taxAmount: item.taxAmount || ''}])];
    taxes.push({taxType: '', taxPercentage: '', taxAmount: ''});
    newItems[itemIndex] = {...item, taxes};
    onChange({items: newItems});
  };

  const removeItemTax = (itemIndex: number, taxIndex: number) => {
    const newItems = [...(value.items || [])];
    const item = newItems[itemIndex];
    const taxes = item?.taxes?.length ? item.taxes : (item?.taxType ? [{taxType: item.taxType, taxPercentage: item.taxPercentage || '', taxAmount: item.taxAmount || ''}] : []);
    if (!item || taxes.length <= 1) return;
    const taxesFiltered = taxes.filter((_, i) => i !== taxIndex);
    if (onDeleteItemTax) {
      onDeleteItemTax(itemIndex, taxIndex);
      return;
    }
    // Web currently calculates tax on the item subtotal before discount.
    const itemSubTotalForRemove = parseFloat(item.total) || 0;

    taxesFiltered.forEach((t, i) => {
      const pct = parseFloat(t.taxPercentage || '0') || 0;
      taxesFiltered[i] = {...t, taxAmount: roundToTwo((itemSubTotalForRemove * pct) / 100).toFixed(2)};
    });
    newItems[itemIndex] = {...item, taxes: taxesFiltered, taxAmount: roundToTwo(taxesFiltered.reduce((s, t) => s + (parseFloat(t.taxAmount || '0') || 0), 0)).toFixed(2)};
    onChange({items: newItems});
  };

  const addMoreItems = () => {
    const newItems = [...(value.items || []), {
      itemName: '', 
      description: '',
      quantity: '', 
      unit: '', 
      pricePerQuantity: '', 
      total: '',
      discountType: '',
      discountValue: '',
      discountAmount: '',
      taxType: '',
      taxPercentage: '',
      taxAmount: '',
      taxes: [{taxType: '', taxPercentage: '', taxAmount: ''}],
    }];
    onChange({items: newItems});
  };

  const removeItem = (index: number) => {
    if (onDeleteItem) {
      onDeleteItem(index);
      return;
    }
    const newItems = [...(value.items || [])];
    newItems.splice(index, 1);
    onChange({items: newItems});
  };

  const items = value.items || [];

  return (
    <View style={styles.container}>
      <View
        pointerEvents={ocrLoading ? 'none' : 'auto'}
        style={ocrLoading ? styles.ocrLockedContent : undefined}>
      {/* Party Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {isDealerFinance ? entityInvoiceLabel : 'Vendor Invoice'}
        </Text>
        <View style={styles.row}>
          <View style={styles.dealerNameWidth}>
            {mode === 'edit' ? (
              <View style={styles.readOnlyFieldContainer}>
                <Text style={styles.label}>{`${entityNameLabel} *`}</Text>
                <View style={[styles.dropdownContainer, styles.readOnlyBox]}>
                  <Text style={styles.readOnlyText} numberOfLines={2}>
                    {value.dealer || '-'}
                  </Text>
                </View>
              </View>
            ) : (
              <CustomDropdown
                label={`${entityNameLabel} *`}
                data={dealerData}
                value={value.dealer}
                onChange={set('dealer')}
                placeholder={`Select ${entityLabel}`}
                containerStyle={styles.dropdownContainer}
              />
            )}
            {errors.dealer && <Text style={styles.errorText}>{errors.dealer}</Text>}
          </View>
          <View style={styles.dealerCodeWidth}>
            {mode === 'edit' ? (
              <View style={styles.readOnlyFieldContainer}>
                <Text style={styles.label}>{`${entityCodeLabel} *`}</Text>
                <View style={[styles.dropdownContainer, styles.readOnlyBox]}>
                  <Text style={styles.emphasisValueText} numberOfLines={1}>
                    {value.dealerCode || '-'}
                  </Text>
                </View>
              </View>
            ) : (
              <CustomDropdown
                label={`${entityCodeLabel} *`}
                data={dealerOptions && value.dealerCode ? [{label: value.dealerCode, value: value.dealerCode}] : []}
                value={value.dealerCode}
                onChange={set('dealerCode')}
                placeholder={entityCodeLabel}
                selectedTextStyle={styles.emphasisValueText}
                containerStyle={styles.dropdownContainer}
                editable={!dealerOptions || !dealerOptions.length}
              />
            )}
            {errors.dealerCode && <Text style={styles.errorText}>{errors.dealerCode}</Text>}
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>{entityODLabel}</Text>
          {mode === 'edit' ? (
            <View style={styles.readOnlyFieldContainer}>
              <Text style={styles.label}>{entityODLabel}</Text>
              <View style={[styles.dropdownContainer, styles.readOnlyBox]}>
                <Text style={styles.emphasisValueText} numberOfLines={1}>
                  {value.odAccountNumber || '-'}
                </Text>
              </View>
            </View>
          ) : (
            <CustomDropdown
              label=""
              data={dealerOptions && value.odAccountNumber ? [{label: value.odAccountNumber, value: value.odAccountNumber}] : []}
              value={value.odAccountNumber}
              onChange={set('odAccountNumber')}
              placeholder="Select Acc. No"
              selectedTextStyle={styles.emphasisValueText}
              containerStyle={styles.dropdownContainer}
              editable={!dealerOptions || !dealerOptions.length}
            />
          )}
        </View>
      </View>

      {/* Invoice Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invoice Details</Text>
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Invoice / Unique Ref. No *</Text>
            <TouchableOpacity
              onPress={() => setShowInvoiceNumberTooltip(true)}
              style={styles.infoButton}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <View style={styles.infoIconContainer}>
                <Text style={styles.infoIconText}>i</Text>
              </View>
            </TouchableOpacity>
          </View>
          {mode === 'edit' ? (
            <View style={[styles.input, styles.readOnlyBox, styles.invoiceRefBoxEdit]}>
              <Text style={styles.readOnlyText}>{value.invoiceNumber}</Text>
            </View>
          ) : (
            <TextInput 
              style={[styles.input, errors.invoiceNumber && styles.inputError]} 
              value={value.invoiceNumber} 
              onChangeText={set('invoiceNumber')} 
              placeholder="Value" 
            />
          )}
          {errors.invoiceNumber && <Text style={styles.errorText}>{errors.invoiceNumber}</Text>}
        </View>
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <View style={styles.fieldInRow}>
              <L label="PO.Ref. No(Optional)">
                <TextInput
                  style={styles.input}
                  value={value.associatedPO}
                  onChangeText={set('associatedPO')}
                  placeholder="Value"
                />
              </L>
            </View>
          </View>
          <View style={styles.halfWidth}>
            <View style={styles.fieldInRow}>
              <DateNTimePicker
                label="Invoice Date *"
                value={parseDateValue(value.invoiceDate)}
                onConfirm={(date) => {
                  const dateStr = formatDateForStorage(date);
                  onChange({invoiceDate: dateStr});
                  // Validate invoice date
                  const validationError = validateInvoiceDate(dateStr);
                  if (validationError) {
                    // Show warning but allow (or you can prevent if needed)
                    console.warn('Invoice Date Validation:', validationError);
                  }
                }}
                placeholder="DD-MM-YYYY"
                mode="date"
                datePickerProps={{
                  date: value.invoiceDate ? moment(value.invoiceDate, ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true).toDate() : new Date(),
                  mode: 'date',
                  ...(isHistoricalInvoiceMode
                    ? {}
                    : {
                        minimumDate: moment().subtract(staleInvoicePeriodDays, 'days').toDate(),
                        maximumDate: new Date(),
                      }),
                }}
                containerStyle={styles.datePickerContainer}
              />
              {errors.invoiceDate && <Text style={styles.errorText}>{errors.invoiceDate}</Text>}
              {value.invoiceDate && !isHistoricalInvoiceMode && validateInvoiceDate(value.invoiceDate) && (
                <Text style={styles.warningText}>{validateInvoiceDate(value.invoiceDate)}</Text>
              )}
            </View>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <View style={styles.fieldInRow}>
              <CustomDropdown
                label="Tenor *"
                data={tenorOptions ?? []}
                value={value.tenor}
                onChange={set('tenor')}
                placeholder="Select tenor"
                containerStyle={styles.dropdownContainer}
                dropdownStyle={styles.tenorDropdownField}
                showSearch={false}
                maxHeight={scaleHeight(280)}
              />
              {errors.tenor ? (
                <Text style={styles.errorText}>{errors.tenor}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.halfWidth} />
        </View>
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <View style={styles.fieldInRow}>
              <DateNTimePicker
                label="Payment Date (Optional)"
                value={parseDateValue(value.paymentDate)}
                onConfirm={(date) => {
                  const dateStr = formatDateForStorage(date);
                  onChange({paymentDate: dateStr});
                  // Validate payment date
                  const validationError = validatePaymentDate(dateStr, value.invoiceDate);
                  if (validationError) {
                    console.warn('Payment Date Validation:', validationError);
                  }
                }}
                placeholder="DD-MM-YYYY"
                mode="date"
                datePickerProps={{
                  date: value.paymentDate ? moment(value.paymentDate, ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true).toDate() : new Date(),
                  mode: 'date',
                  ...(isHistoricalInvoiceMode ? {} : {minimumDate: new Date()}),
                }}
                containerStyle={styles.datePickerContainer}
              />
              {value.paymentDate && !isHistoricalInvoiceMode && validatePaymentDate(value.paymentDate, value.invoiceDate) && (
                <Text style={styles.warningText}>{validatePaymentDate(value.paymentDate, value.invoiceDate)}</Text>
              )}
            </View>
          </View>
          <View style={styles.halfWidth}>
            <View style={[styles.fieldInRow, styles.invoiceDueDateField]}>
              <DateNTimePicker
                label="Invoice Due Date *"
                value={parseDateValue(value.invoiceDueDate)}
                onConfirm={(date) => {
                  const dateStr = formatDateForStorage(date);
                  onChange({invoiceDueDate: dateStr});
                }}
                placeholder="DD-MM-YYYY"
                mode="date"
                datePickerProps={{
                  date: value.invoiceDueDate ? moment(value.invoiceDueDate, ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true).toDate() : new Date(),
                  mode: 'date',
                  ...(isHistoricalInvoiceMode
                    ? {}
                    : {
                        minimumDate: new Date(),
                        maximumDate: moment()
                          .add(tenureDaysForDueDate, 'days')
                          .toDate(),
                      }),
                }}
                containerStyle={styles.datePickerContainer}
              />
              {errors.invoiceDueDate && <Text style={styles.errorText}>{errors.invoiceDueDate}</Text>}
              {value.invoiceDueDate && !isHistoricalInvoiceMode && validateInvoiceDueDate(value.invoiceDueDate) && (
                <Text style={styles.warningText}>{validateInvoiceDueDate(value.invoiceDueDate)}</Text>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Additional Invoice Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Invoice Information</Text>
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Early Payment Discount (%) (Optional)</Text>
            <TouchableOpacity
              onPress={() => setShowDiscountTooltip(true)}
              style={styles.infoButton}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <View style={styles.infoIconContainer}>
                <Text style={styles.infoIconText}>i</Text>
              </View>
            </TouchableOpacity>
          </View>
          <TextInput style={styles.input} value={value.earlyPaymentDiscount} onChangeText={set('earlyPaymentDiscount')} placeholder="Value" keyboardType="decimal-pad" />
        </View>
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <View style={styles.creditToField}>
              {mode === 'edit' ? (
                <View style={styles.readOnlyFieldContainer}>
                  <Text style={styles.label}>Credit To *</Text>
                  <View style={[styles.dropdownContainer, styles.readOnlyBox]}>
                    <Text style={styles.readOnlyText} numberOfLines={1}>
                      {value.creditTo || 'Select credit to'}
                    </Text>
                  </View>
                </View>
              ) : (
                <CustomDropdown
                  label="Credit To *"
                  data={creditToData}
                  value={value.creditTo}
                  onChange={(accountNumber) => {
                    const selected = creditToData.find(opt => {
                      const optValue = (opt.value || '').trim();
                      const optLabel = (opt.label || '').trim();
                      const raw = String(accountNumber || '').trim();
                      return (
                        optValue === raw ||
                        optLabel === raw ||
                        opt.accountId === raw
                      );
                    });
                    onChange({
                      creditTo: selected?.value || accountNumber,
                      // Prefer UUID from the matched option (DF + VF alike).
                      creditToAccountId: selected?.accountId || undefined,
                    });
                  }}
                  placeholder="Select credit to"
                  containerStyle={styles.dropdownContainer}
                />
              )}
              {errors.creditTo && <Text style={styles.errorText}>{errors.creditTo}</Text>}
            </View>
          </View>
        </View>
        <L label="Remark (Optional)">
          <TextInput
            style={styles.input}
            value={value.remark}
            onChangeText={set('remark')}
            placeholder="Value"
            multiline
            numberOfLines={3}
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={Keyboard.dismiss}
          />
        </L>
      </View>

      {/* Add Details Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Add Details</Text>
          {!isOcrMode && (
            <TouchableOpacity style={styles.addButton} onPress={addMoreItems}>
              <Text style={styles.addButtonText}>+ Add more Items</Text>
            </TouchableOpacity>
          )}
        </View>

        {items.length === 0 && (
          <>
            {!isOcrMode ? (
              <TouchableOpacity style={styles.addFirstItem} onPress={addMoreItems}>
                <Text style={styles.addFirstItemText}>Click to add first item</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.addFirstItemText}>Items are filled from OCR scan</Text>
            )}
            {errors.items && <Text style={styles.errorText}>{errors.items}</Text>}
          </>
        )}

        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemIndex}>Item {index + 1}</Text>
              {!isOcrMode && (
                <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeButton}>
                  <FontAwesome6 name="trash" iconStyle="solid" color="#dc3545" size={16} />
                </TouchableOpacity>
              )}
            </View>
            <L label="Item Name *">
              <TextInput 
                style={[styles.input, errors.items && errors.items.includes(`Item ${index + 1}`) && errors.items.includes('Item Name') && styles.inputError]} 
                value={item.itemName} 
                onChangeText={(text) => updateItem(index, 'itemName', text)} 
                placeholder="Value" 
              />
            </L>
            <L label="Description (Optional)">
              <TextInput 
                style={styles.input} 
                value={item.description || ''} 
                onChangeText={(text) => updateItem(index, 'description', text)} 
                placeholder="Value" 
              />
            </L>
            <View style={styles.row}>
              <View style={styles.thirdWidth}>
                <L label="Quantity *">
                  <TextInput 
                    style={[styles.input, errors.items && errors.items.includes(`Item ${index + 1}`) && errors.items.includes('Quantity') && styles.inputError]} 
                    value={formatIndianAmountInput(item.quantity)} 
                    onChangeText={(text) => updateItem(index, 'quantity', text)} 
                    placeholder="Value" 
                    keyboardType="decimal-pad" 
                  />
                </L>
              </View>
              <View style={styles.thirdWidth}>
                <L label="Unit *">
                  <TextInput
                    style={[styles.input, errors.items && errors.items.includes(`Item ${index + 1}`) && errors.items.includes('Unit') && styles.inputError]}
                    value={item.unit}
                    onChangeText={(text) => updateItem(index, 'unit', text)}
                    placeholder="e.g. PCS, BOX"
                  />
                </L>
              </View>
              <View style={styles.thirdWidth}>
                <L label="Price *">
                  <TextInput 
                    style={[styles.input, errors.items && errors.items.includes(`Item ${index + 1}`) && errors.items.includes('Price') && styles.inputError]} 
                    value={formatIndianAmountInput(item.pricePerQuantity)} 
                    onChangeText={(text) => updateItem(index, 'pricePerQuantity', text)} 
                    placeholder="Value" 
                    keyboardType="decimal-pad" 
                  />
                </L>
              </View>
            </View>
            {errors.items && errors.items.includes(`Item ${index + 1}`) && (
              <Text style={styles.errorText}>{errors.items}</Text>
            )}
            <L label="Total">
              <TextInput style={[styles.input, styles.autoCalculated]} value={item.total ? formatIndianAmountInput(item.total) : ''} editable={false} placeholder="Auto Calculated" />
            </L>
            
            {/* Item-level Discount */}
            <View
              style={[
                styles.itemDiscountTaxContainer,
                isOcrMode && styles.ocrDisabledDiscountTax,
              ]}
              pointerEvents={isOcrMode ? 'none' : 'auto'}>
              <Text style={[styles.itemDiscountTaxLabelText, isOcrMode && styles.ocrDisabledLabel]}>
                Discount (Optional)
              </Text>
              <View style={styles.itemDiscountTaxVertical}>
                <View style={styles.discountTaxDropdownVertical}>
                  <CustomDropdown
                    label=""
                    data={[
                      {label: 'None', value: ''},
                      {label: 'Percentage', value: 'percentage'},
                      {label: 'Absolute', value: 'value'},
                    ]}
                    value={item.discountType || ''}
                    onChange={(val) => updateItem(index, 'discountType', val)}
                    placeholder="Select"
                    containerStyle={styles.itemDropdownContainer}
                    showSearch={false}
                    editable={!isOcrMode}
                  />
                </View>
                {item.discountType && (
                  <View style={styles.itemDiscountTaxInputsVertical}>
                    <TextInput
                      style={[styles.itemDiscountTaxInputVertical, isOcrMode && styles.ocrDisabledInput]}
                      value={formatIndianAmountInput(item.discountValue || '')}
                      onChangeText={(text) => updateItem(index, 'discountValue', text)}
                      placeholder="Value"
                      keyboardType="decimal-pad"
                      editable={!isOcrMode}
                    />
                    <TextInput
                      style={[styles.itemDiscountTaxInputVertical, styles.autoCalculated]}
                      value={formatIndianAmountInput(item.discountAmount || '0.00')}
                      editable={false}
                      placeholder="0.00"
                    />
                  </View>
                )}
              </View>
            </View>
            
            {/* Item-level Tax (multiple) */}
            <View
              style={[
                styles.itemDiscountTaxContainer,
                isOcrMode && styles.ocrDisabledDiscountTax,
              ]}
              pointerEvents={isOcrMode ? 'none' : 'auto'}>
              <Text style={[styles.itemDiscountTaxLabelText, isOcrMode && styles.ocrDisabledLabel]}>
                Tax
              </Text>
              {((item.taxes && item.taxes.length > 0) ? item.taxes : [{taxType: item.taxType || '', taxPercentage: item.taxPercentage || '', taxAmount: item.taxAmount || ''}]).map((tax, taxIdx) => (
                <View key={taxIdx} style={styles.taxRowWithActions}>
                  <View style={[styles.itemDiscountTaxVertical, styles.taxContentWrapper]}>
                    <View style={styles.discountTaxDropdownVertical}>
                      <CustomDropdown
                        label=""
                        data={taxTypeDropdownData}
                        value={tax.taxType || ''}
                        onChange={(val) => handleTaxTypeSelect(index, taxIdx, val)}
                        placeholder="Select"
                        containerStyle={styles.itemDropdownContainer}
                        showSearch={false}
                        editable={!isOcrMode}
                      />
                    </View>
                    {tax.taxType && (
                      <View style={styles.itemDiscountTaxInputsVertical}>
                        <View style={styles.taxPercentInputRow}>
                          {isPartyConfiguredTax(tax.taxType) ? (
                            <TextInput
                              style={[
                                styles.itemDiscountTaxInputVertical,
                                styles.autoCalculated,
                              ]}
                              value={tax.taxPercentage || '0'}
                              editable={false}
                              placeholder="Value"
                            />
                          ) : (
                            <TextInput
                              style={[
                                styles.itemDiscountTaxInputVertical,
                                isOcrMode && styles.ocrDisabledInput,
                              ]}
                              value={tax.taxPercentage || ''}
                              onChangeText={(text) =>
                                updateItemTax(index, taxIdx, 'taxPercentage', text)
                              }
                              placeholder="Value"
                              keyboardType="decimal-pad"
                              editable={!isOcrMode}
                            />
                          )}
                          <Text style={styles.taxPercentSuffix}>%</Text>
                        </View>
                        <TextInput
                          style={[styles.itemDiscountTaxInputVertical, styles.autoCalculated]}
                          value={formatIndianAmountInput(tax.taxAmount || '0.00')}
                          editable={false}
                          placeholder="0.00"
                        />
                      </View>
                    )}
                  </View>
                  {!isOcrMode && (
                    <View style={styles.taxActionButtons}>
                      <TouchableOpacity onPress={() => addItemTax(index)} style={[styles.addTaxButton, {marginRight: 8}]}>
                        <FontAwesome6 name="plus" iconStyle="solid" size={14} color="#333" />
                      </TouchableOpacity>
                      {(((item.taxes && item.taxes.length > 0) ? item.taxes : [{taxType: item.taxType || '', taxPercentage: item.taxPercentage || '', taxAmount: item.taxAmount || ''}]).length > 1) && (
                        <TouchableOpacity onPress={() => removeItemTax(index, taxIdx)} style={styles.removeTaxButton}>
                          <FontAwesome6 name="trash" iconStyle="solid" size={14} color="#dc3545" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Footer: Summary Totals */}
        {items.length > 0 && (() => {
          // Calculate Sub Total (sum of all item line totals)
          const subTotal = items.reduce((sum, item) => {
            return sum + (parseFloat(item.total) || 0);
          }, 0);
          
          // Calculate Discount Total (sum of all item-level discounts)
          const discountTotal = items.reduce((sum, item) => {
            return sum + (parseFloat(item.discountAmount || '0') || 0);
          }, 0);
          
          // Calculate Tax Total (sum of all item-level taxes - from taxes array or legacy taxAmount)
          const itemTaxSum = items.reduce((sum, item) => {
            if (item.taxes?.length) {
              return sum + item.taxes.reduce((s, t) => s + (parseFloat(t.taxAmount || '0') || 0), 0);
            }
            return sum + (parseFloat(item.taxAmount || '0') || 0);
          }, 0);
          const ocrTaxFallback =
            (parseFloat(value.cgst || '0') || 0) +
            (parseFloat(value.sgst || '0') || 0) +
            (parseFloat(value.taxTotal || '0') || 0);
          const taxTotal = itemTaxSum > 0 ? itemTaxSum : ocrTaxFallback;
          
          const tdsAmount = parseFloat(value.tdsAmount || '0') || 0;
          const aiAmount = showAdvanceInterest ? advanceInterest : 0;
          const total = computeInvoiceNetTotal(
            subTotal,
            discountTotal,
            taxTotal,
            tdsAmount,
            aiAmount,
          );

          return (
            <View style={styles.summaryWrap}>
              <InvoiceAccountingSummary
                basicAmount={subTotal}
                discount={discountTotal}
                gstAmount={taxTotal}
                tdsAmount={tdsAmount}
                advanceInterest={aiAmount}
                netDisbursementAmount={total}
                showAdvanceInterest={showAdvanceInterest}
                onInvoiceAmountInfoPress={() =>
                  setShowInvoiceAmountFormula(true)
                }
                onDisbursementRequestedInfoPress={() =>
                  setShowDisbursementRequestedFormula(true)
                }
                onAdvanceInterestInfoPress={() =>
                  setShowAdvanceInterestFormula(true)
                }
                onNetDisbursementInfoPress={() =>
                  setShowNetDisbursementFormula(true)
                }
                amountPrefix="₹"
              />
            </View>
          );
        })()}
      </View>

      <AdvanceInterestFormulaModal
        visible={showAdvanceInterestFormula}
        onClose={() => setShowAdvanceInterestFormula(false)}
        amounts={advanceInterestFormulaAmounts}
      />
      <InvoiceAmountFormulaModal
        visible={showInvoiceAmountFormula}
        onClose={() => setShowInvoiceAmountFormula(false)}
        amounts={advanceInterestFormulaAmounts}
      />
      <DisbursementRequestedFormulaModal
        visible={showDisbursementRequestedFormula}
        onClose={() => setShowDisbursementRequestedFormula(false)}
        amounts={advanceInterestFormulaAmounts}
      />
      <NetDisbursementFormulaModal
        visible={showNetDisbursementFormula}
        onClose={() => setShowNetDisbursementFormula(false)}
        amounts={advanceInterestFormulaAmounts}
      />

      {/* Invoice Number Tooltip Modal */}
      <Modal
        transparent
        visible={showInvoiceNumberTooltip}
        animationType="fade"
        onRequestClose={() => setShowInvoiceNumberTooltip(false)}>
        <TouchableWithoutFeedback onPress={() => setShowInvoiceNumberTooltip(false)}>
          <View style={styles.tooltipOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.tooltipContainer}>
                <View style={styles.tooltipHeader}>
                  <Text style={styles.tooltipTitle}>Invoice Number Format</Text>
                  <TouchableOpacity
                    onPress={() => setShowInvoiceNumberTooltip(false)}
                    style={styles.tooltipCloseButton}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <Text style={styles.tooltipCloseText}>×</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.tooltipContent}>
                  <Text style={styles.tooltipText}>
                    Invoice number एक unique reference number होना चाहिए जो invoice को identify करने के लिए use होता है।
                  </Text>
                  <Text style={styles.tooltipSubText}>
                    • Invoice number alphanumeric हो सकता है{'\n'}
                    • Special characters जैसे -, /, _ use कर सकते हैं{'\n'}
                    • Invoice number unique और identifiable होना चाहिए{'\n'}
                    • Example: INV-2024-001, 123101010, etc.
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* PO Ref. No. Tooltip Modal */}
      <Modal
        transparent
        visible={showPOTooltip}
        animationType="fade"
        onRequestClose={() => setShowPOTooltip(false)}>
        <TouchableWithoutFeedback onPress={() => setShowPOTooltip(false)}>
          <View style={styles.tooltipOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.tooltipContainer}>
                <View style={styles.tooltipHeader}>
                  <Text style={styles.tooltipTitle}>PO Ref. No. (Purchase Order Reference)</Text>
                  <TouchableOpacity
                    onPress={() => setShowPOTooltip(false)}
                    style={styles.tooltipCloseButton}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <Text style={styles.tooltipCloseText}>×</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.tooltipContent}>
                  <Text style={styles.tooltipText}>
                    PO Ref. No. (Purchase Order Reference) वह reference number है जो purchase order से related होता है।
                  </Text>
                  <Text style={styles.tooltipSubText}>
                    • यह invoice के साथ associated purchase order को identify करता है{'\n'}
                    • यह optional field है{'\n'}
                    • अगर invoice किसी specific purchase order से related है तो यह number enter करें{'\n'}
                    • Example: PO-2024-001, PO/2024/123, etc.
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Credit Account Number Tooltip Modal */}
      <Modal
        transparent
        visible={showCreditAccountTooltip}
        animationType="fade"
        onRequestClose={() => setShowCreditAccountTooltip(false)}>
        <TouchableWithoutFeedback onPress={() => setShowCreditAccountTooltip(false)}>
          <View style={styles.tooltipOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.tooltipContainer}>
                <View style={styles.tooltipHeader}>
                  <Text style={styles.tooltipTitle}>Credit Account Number</Text>
                  <TouchableOpacity
                    onPress={() => setShowCreditAccountTooltip(false)}
                    style={styles.tooltipCloseButton}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <Text style={styles.tooltipCloseText}>×</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.tooltipContent}>
                  <Text style={styles.tooltipText}>
                    Credit Account Number वह account number है जहाँ payment credit होगी या जहाँ से payment receive होगी।
                  </Text>
                  <Text style={styles.tooltipSubText}>
                    • यह account number payment processing के लिए use होता है{'\n'}
                    • यह optional field है{'\n'}
                    • Dealer या vendor के credit account को identify करने के लिए use होता है{'\n'}
                    • Dropdown से appropriate account number select करें
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Early Payment Discount Tooltip Modal */}
      <Modal
        transparent
        visible={showDiscountTooltip}
        animationType="fade"
        onRequestClose={() => setShowDiscountTooltip(false)}>
        <TouchableWithoutFeedback onPress={() => setShowDiscountTooltip(false)}>
          <View style={styles.tooltipOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.tooltipContainer}>
                <View style={styles.tooltipHeader}>
                  <Text style={styles.tooltipTitle}>Early Payment Discount</Text>
                  <TouchableOpacity
                    onPress={() => setShowDiscountTooltip(false)}
                    style={styles.tooltipCloseButton}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <Text style={styles.tooltipCloseText}>×</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.tooltipContent}>
                  <Text style={styles.tooltipText}>
                    Early Payment Discount वह discount percentage है जो early payment करने पर मिलता है।
                  </Text>
                  <Text style={styles.tooltipSubText}>
                    • यह percentage में enter करें (जैसे 2, 5, 10){'\n'}
                    • यह optional field है{'\n'}
                    • अगर invoice में early payment discount offer है तो percentage enter करें{'\n'}
                    • Example: 2% discount के लिए "2" enter करें
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Payment Request Date Tooltip Modal */}
      <Modal
        transparent
        visible={showPaymentDateTooltip}
        animationType="fade"
        onRequestClose={() => setShowPaymentDateTooltip(false)}>
        <TouchableWithoutFeedback onPress={() => setShowPaymentDateTooltip(false)}>
          <View style={styles.tooltipOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.tooltipContainer}>
                <View style={styles.tooltipHeader}>
                  <Text style={styles.tooltipTitle}>Payment Request Date</Text>
                  <TouchableOpacity
                    onPress={() => setShowPaymentDateTooltip(false)}
                    style={styles.tooltipCloseButton}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <Text style={styles.tooltipCloseText}>×</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.tooltipContent}>
                  <Text style={styles.tooltipText}>
                    Payment Request Date वह date है जब payment request की जाती है या payment due होती है।
                  </Text>
                  <Text style={styles.tooltipSubText}>
                    • यह optional field है{'\n'}
                    • Payment due date या payment request date select करें{'\n'}
                    • अगर invoice में payment terms mention हैं तो उसके अनुसार date select करें{'\n'}
                    • Format: DD-MM-YYYY
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* CGST Tooltip Modal */}
      <Modal
        transparent
        visible={showCGSTTooltip}
        animationType="fade"
        onRequestClose={() => setShowCGSTTooltip(false)}>
        <TouchableWithoutFeedback onPress={() => setShowCGSTTooltip(false)}>
          <View style={styles.tooltipOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.tooltipContainer}>
                <View style={styles.tooltipHeader}>
                  <Text style={styles.tooltipTitle}>CGST (Central Goods and Services Tax)</Text>
                  <TouchableOpacity
                    onPress={() => setShowCGSTTooltip(false)}
                    style={styles.tooltipCloseButton}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <Text style={styles.tooltipCloseText}>×</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.tooltipContent}>
                  <Text style={styles.tooltipText}>
                    CGST (Central GST) central government द्वारा लगाया जाने वाला tax है जो inter-state transactions पर apply होता है।
                  </Text>
                  <Text style={styles.tooltipSubText}>
                    • CGST amount manually enter कर सकते हैं{'\n'}
                    • अगर empty छोड़ें तो automatically 2.5% calculate होगा{'\n'}
                    • Total amount में CGST add होता है{'\n'}
                    • Format: Numeric value (जैसे 100.50)
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* SGST Tooltip Modal */}
      <Modal
        transparent
        visible={showSGSTTooltip}
        animationType="fade"
        onRequestClose={() => setShowSGSTTooltip(false)}>
        <TouchableWithoutFeedback onPress={() => setShowSGSTTooltip(false)}>
          <View style={styles.tooltipOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.tooltipContainer}>
                <View style={styles.tooltipHeader}>
                  <Text style={styles.tooltipTitle}>SGST (State Goods and Services Tax)</Text>
                  <TouchableOpacity
                    onPress={() => setShowSGSTTooltip(false)}
                    style={styles.tooltipCloseButton}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <Text style={styles.tooltipCloseText}>×</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.tooltipContent}>
                  <Text style={styles.tooltipText}>
                    SGST (State GST) state government द्वारा लगाया जाने वाला tax है जो intra-state transactions पर apply होता है।
                  </Text>
                  <Text style={styles.tooltipSubText}>
                    • SGST amount manually enter कर सकते हैं{'\n'}
                    • अगर empty छोड़ें तो automatically 2.5% calculate होगा{'\n'}
                    • Total amount में SGST add होता है{'\n'}
                    • Format: Numeric value (जैसे 100.50)
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Add Attachment Section */}
      {canUploadFinal && (
        <View style={styles.addAttachmentContainer}>
           <Text style={styles.label}>Upload Invoice *</Text>
           
           {selectedAttachment ? (
             <View style={styles.selectedFilePreview}>
               <FontAwesome6 name="file-invoice" iconStyle="solid" size={20} color={Colors.primaryColor} />
               <Text style={styles.selectedFileText} numberOfLines={1}>
                 {selectedAttachment.name}
               </Text>
               <TouchableOpacity onPress={onAddAttachment} style={styles.changeFileButton}>
                 <Text style={styles.changeFileText}>Change</Text>
               </TouchableOpacity>
             </View>
           ) : (
             <TouchableOpacity 
               style={[styles.addAttachmentButton, errors.attachment && styles.inputError]} 
               onPress={onAddAttachment}
               activeOpacity={0.7}
             >
               <Text style={styles.addAttachmentButtonText}>Add Attachments +</Text>
             </TouchableOpacity>
           )}
           {errors.attachment && (
             <Text style={styles.errorText}>{errors.attachment}</Text>
           )}
        </View>
      )}

      </View>

      {/* Preview + Submit / Cancel */}
      <View style={styles.buttonContainer}>
        {!!onPreview && (
          <TouchableOpacity
            style={[
              styles.button,
              styles.previewButton,
              (loading || ocrLoading || previewButtonAppearsDisabled) &&
                styles.previewButtonDisabled,
            ]}
            onPress={() => {
              if (loading || ocrLoading) return;
              if (previewButtonAppearsDisabled) {
                Toast.show({
                  type: 'error',
                  text1:
                    previewDisabledReason ||
                    'Please fill Party, Invoice Date and at least one item to preview',
                  visibilityTime: 3000,
                });
                return;
              }
              onPreview();
            }}
            disabled={loading || ocrLoading}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.previewButtonText,
                previewButtonAppearsDisabled && styles.previewButtonTextDisabled,
              ]}>
              Invoice Preview
            </Text>
          </TouchableOpacity>
        )}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            disabled={loading}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.submitButton, (loading || ocrLoading || submitButtonAppearsDisabled) && styles.submitButtonDisabled]}
            disabled={loading || ocrLoading}
            onPress={() => {
              console.log('[InvoiceForm] Submit pressed, disabledInternally:', submitButtonAppearsDisabled);
              if (submitButtonAppearsDisabled) {
                // Show a specific reason so the user knows exactly what to fix
                const reason =
                  submitDisabledReason ||
                  (!value.invoiceNumber?.trim()
                    ? 'Invoice / Unique Ref. No is required'
                    : !value.dealer?.trim()
                    ? 'Dealer Name is required'
                    : !value.dealerCode?.trim()
                    ? 'Dealer Code is required'
                    : !value.invoiceDate?.trim()
                    ? 'Invoice Date is required'
                    : mode !== 'edit' &&
                      !value.creditTo?.trim()
                    ? 'Credit To is required'
                    : mode !== 'edit' &&
                      value.creditTo?.trim() &&
                      !value.creditToAccountId?.trim()
                    ? 'Please select a valid Credit To account from the list'
                    : !value.items || value.items.length === 0
                    ? 'Please add at least one item'
                    : 'Please fill all required fields before submitting');
                Toast.show({
                  type: 'error',
                  text1: reason,
                  visibilityTime: 3000,
                });
                return;
              }
              console.log('[InvoiceForm] Calling onSubmit props');
              onSubmit?.();
            }}>
            {loading ? (
              <Text style={styles.submitButtonText}>Submitting...</Text>
            ) : ocrLoading ? (
              <Text style={styles.submitButtonText}>Extracting OCR...</Text>
            ) : (
              <Text style={styles.submitButtonText}>{mode === 'edit' ? 'Update Invoice' : 'Submit'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Attachments Section (Edit Mode) */}
      {mode === 'edit' && value.attachments && value.attachments.length > 0 && (
        <View
          pointerEvents={ocrLoading ? 'none' : 'auto'}
          style={[styles.attachmentSection, ocrLoading && styles.ocrLockedContent]}>
          <Text style={styles.attachmentSectionTitle}>Attachments</Text>
          {value.attachments.map((att, idx) => {
            const fileName = att.attachment_url?.split('/').pop() || `Attachment ${idx + 1}`;
            const isPdf = fileName.toLowerCase().endsWith('.pdf');
            const fullUrl = att.attachment_url.startsWith('http') 
              ? att.attachment_url 
              : `${storageBaseUrl.replace(/\/$/, '')}/${att.attachment_url.replace(/^\//, '')}`;
            
            return (
              <View key={att.id} style={styles.attachmentWrapper}>
                <TouchableOpacity
                  style={styles.attachmentPreview}
                  onPress={async () => {
                    try {
                      await Linking.openURL(fullUrl);
                    } catch (e: any) {
                      Toast.show({ type: 'error', text1: 'Error', text2: (e as any)?.message || 'Failed to open attachment' });
                    }
                  }}
                  activeOpacity={0.7}>
                  <View style={[styles.attachmentIcon, isPdf && styles.attachmentIconPdf]}>
                    <Text style={styles.attachmentIconText}>{isPdf ? 'PDF' : 'FILE'}</Text>
                  </View>
                  <View style={styles.attachmentInfo}>
                    <Text style={styles.attachmentLabel} numberOfLines={1} ellipsizeMode="middle">
                      {fileName}
                    </Text>
                    <Text style={styles.attachmentMeta}>Tap to view</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteAttachmentButton}
                  onPress={() => {
                      onDeleteAttachment?.(att.id);
                  }}>
                  <FontAwesome6 name="trash" iconStyle="solid" size={16} color="#DC3545" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const L: React.FC<{label: string; children: React.ReactNode}> = ({label, children}) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ocrLockedContent: {
    opacity: 0.65,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  halfWidth: {
    flex: 1,
    minWidth: 0,
  },
  dealerNameWidth: {
    flex: 2,
    minWidth: 0,
  },
  dealerCodeWidth: {
    flex: 1,
    minWidth: 0,
  },
  thirdWidth: {
    flex: 1,
  },
  rowField: {
    alignSelf: 'stretch',
  },
  field: {
    gap: 6,
    marginBottom: 8,
  },
  fieldInRow: {
    gap: 6,
    marginBottom: 0,
    alignItems: 'stretch',
    width: '100%',
  },
  datePickerContainer: {
    marginBottom: 0,
    width: '100%',
  },
  invoiceDueDateField: {
    marginTop: 0,
  },
  creditToField: {
    marginTop: 8,
  },
  label: {
    fontWeight: '600',
    fontSize: 12,
    color: '#555',
    minHeight: 20,
    lineHeight: 20,
  },
  emphasisValueText: {
    fontWeight: '700',
    color: Colors.darkblack,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 13,
    height: 42, // Fixed height to match currencyDisplay
  },
  inputError: {
    borderColor: '#dc3545',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 11,
    marginTop: 4,
    marginBottom: 4,
    fontWeight: '500',
  },
  warningText: {
    color: '#ff9800',
    fontSize: 10,
    marginTop: 4,
    marginBottom: 4,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  calculatedInfoText: {
    color: '#666',
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
  dropdownContainer: {
    marginBottom: 0,
    width: '100%',
  },
  dropdownHeight: {
    height: 42,
  },
  tenorDropdownField: {
    minHeight: scaleHeight(44),
  },
  addButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  addFirstItem: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
  },
  addFirstItemText: {
    color: '#666',
    fontSize: 14,
  },
  itemRow: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemIndex: {
    fontWeight: '600',
    fontSize: 13,
    color: '#333',
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#dc3545',
    fontSize: 11,
    fontWeight: '600',
  },
  autoCalculated: {
    backgroundColor: '#f5f5f5',
    color: '#333',
    flex: 1,
  },
  autoCalculatedLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  currencyDisplay: {
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    height: 44, // Exact match with input field height
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  itemDiscountTaxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  itemDiscountTaxLabel: {
    width: 80,
  },
  itemDiscountTaxInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  discountTaxDropdown: {
    width: 130,
    flexShrink: 0,
  },
  itemDiscountTaxInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    fontSize: 14,
    minWidth: 60,
    maxWidth: 100,
    flexShrink: 1,
  },
  itemDiscountTaxContainer: {
    marginTop: 12,
    gap: 6,
  },
  itemDiscountTaxLabelText: {
    fontWeight: '600',
    fontSize: 12,
    color: '#555',
  },
  ocrDisabledDiscountTax: {
    opacity: 0.42,
    backgroundColor: '#ececec',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  ocrDisabledLabel: {
    color: '#999',
  },
  ocrDisabledInput: {
    backgroundColor: '#e8e8e8',
    color: '#888',
  },
  itemDiscountTaxVertical: {
    gap: 8,
  },
  discountTaxDropdownVertical: {
    width: '100%',
  },
  itemDiscountTaxInputsVertical: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  itemDiscountTaxInputVertical: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    fontSize: 12,
    height: 38,
  },
  taxPercentInputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taxPercentSuffix: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  itemDropdownContainer: {
    marginBottom: 0,
  },
  taxRowWithActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taxContentWrapper: {
    flex: 1,
    minWidth: 0,
  },
  taxActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  addTaxButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeTaxButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFE9E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryWrap: {
    marginTop: 16,
    width: '100%',
  },
  financingSection: {
    width: '100%',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  financingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  financingNote: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },
  currencyText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  footerContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  footerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  footerInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    fontSize: 14,
    width: 120,
    textAlign: 'right',
  },
  footerTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 12,
    marginTop: 4,
  },
  footerTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  footerTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc3545',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoButton: {
    padding: 4,
  },
  infoIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#808080',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#808080',
  },
  infoIconText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  tooltipCloseButton: {
    padding: 4,
  },
  tooltipCloseText: {
    fontSize: 24,
    color: '#666',
    lineHeight: 24,
  },
  tooltipContent: {
    padding: 16,
  },
  tooltipText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  tooltipSubText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: Colors.primaryColor,
  },
  previewButtonDisabled: {
    opacity: 0.55,
    borderColor: '#ccc',
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryColor,
  },
  previewButtonTextDisabled: {
    color: '#999',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#dc3545',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  discountDropdownContainer: {
    width: 150,
  },
  discountDropdown: {
    marginBottom: 0,
  },
  readOnlyFieldContainer: {
    flex: 1,
  },
  readOnlyBox: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'System',
  },
  invoiceRefBoxEdit: {
    height: 52,
    justifyContent: 'center',
  },
  readOnlyPlaceholder: {
    fontSize: 14,
    color: '#BBBBBB',
    fontFamily: 'System',
  },
  attachmentSection: {
    marginTop: scaleHeight(24),
    paddingHorizontal: 16,
    paddingBottom: scaleHeight(32),
  },
  attachmentSectionTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroyBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(12),
  },
  attachmentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(12),
  },
  attachmentPreview: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: scaleWidth(12),
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(8),
  },
  attachmentIcon: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(12),
  },
  attachmentIconText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyBold,
    color: Colors.darkblack,
  },
  attachmentIconPdf: {
    backgroundColor: '#E8F4FD',
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentLabel: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(4),
  },
  attachmentMeta: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyRegular,
    color: Colors.graybase,
  },
  deleteAttachmentButton: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    borderRadius: scaleWidth(8),
  },
  addAttachmentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  addAttachmentLabel: {
    fontSize: 13,
    color: '#dc3545',
    marginBottom: 8,
    fontWeight: '500',
  },
  addAttachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    backgroundColor: '#fff',
    gap: 8,
    width: '55%',
  },
  addAttachmentButtonText: {
    fontSize: 14,
    color: '#337ab7',
    fontWeight: '500',
  },
  selectedFilePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 10,
  },
  selectedFileText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  changeFileButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changeFileText: {
    fontSize: 12,
    color: '#337ab7',
    fontWeight: '600',
  },
});