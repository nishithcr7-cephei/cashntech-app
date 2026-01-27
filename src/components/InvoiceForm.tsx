import React, {useState, useEffect} from 'react';
import {View, TextInput, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TouchableWithoutFeedback} from 'react-native';
import type {InvoiceFields, InvoiceLineItem} from '@type/Invoice';
import {DateNTimePicker, CustomDropdown} from '@components/index';
import moment from 'moment';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {
  dealerNameOptions,
  dealerCodeOptions,
  creditAccountOptions,
  unitOptions,
} from '@constants/invoiceDropdowns';

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

interface ValidationErrors {
  invoiceNumber?: string;
  dealer?: string;
  dealerCode?: string;
  invoiceDate?: string;
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
};

export const InvoiceForm: React.FC<Props> = ({
  value,
  onChange,
  onSubmit,
  onCancel,
  loading = false,
  errors = {},
  isFormValid = false,
  productType = 'dealer_finance',
}) => {
  const [showInvoiceNumberTooltip, setShowInvoiceNumberTooltip] = useState(false);
  const [showPOTooltip, setShowPOTooltip] = useState(false);
  const [showCreditAccountTooltip, setShowCreditAccountTooltip] = useState(false);
  const [showDiscountTooltip, setShowDiscountTooltip] = useState(false);
  const [showCGSTTooltip, setShowCGSTTooltip] = useState(false);
  const [showSGSTTooltip, setShowSGSTTooltip] = useState(false);
  const [showPaymentDateTooltip, setShowPaymentDateTooltip] = useState(false);

  const isDealerFinance = productType !== 'vendor_finance';

  // Mock tenure days - will be replaced by API value later
  // TODO: Replace with API value from program/dealer details
  const TENURE_DAYS = 60; // Default 60 days, will come from API

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

  // Auto-calculate Invoice Due Date when Invoice Date or GRN Date changes
  useEffect(() => {
    if (value.invoiceDate) {
      const calculatedDueDate = calculateInvoiceDueDate(
        value.invoiceDate,
        value.grnDate || '',
        TENURE_DAYS
      );
      
      // Only update if calculated value is different from current value
      if (calculatedDueDate && calculatedDueDate !== value.invoiceDueDate) {
        onChange({invoiceDueDate: calculatedDueDate});
      }
    } else if (!value.invoiceDate && value.invoiceDueDate) {
      // Clear due date if invoice date is cleared
      onChange({invoiceDueDate: ''});
    }
  }, [value.invoiceDate, value.grnDate]);

  // Validate Invoice Date (should be current or past date, check for stale invoice)
  const validateInvoiceDate = (dateStr: string): string | undefined => {
    if (!dateStr) return undefined;
    
    const invoiceDate = moment(dateStr, ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true);
    if (!invoiceDate.isValid()) {
      return 'Invalid date format';
    }

    const today = moment().startOf('day');
    const daysDiff = today.diff(invoiceDate, 'days');

    // Check if date is in future (not allowed)
    if (daysDiff < 0) {
      return 'Invoice date cannot be in the future';
    }

    // Check for stale invoice (older than 90 days - configurable)
    const STALE_DAYS_THRESHOLD = 90;
    if (daysDiff > STALE_DAYS_THRESHOLD) {
      return `Invoice is stale (older than ${STALE_DAYS_THRESHOLD} days)`;
    }

    return undefined;
  };

  // Validate Payment Date (should be future date, 7/21 days as per terms)
  const validatePaymentDate = (dateStr: string, invoiceDateStr?: string): string | undefined => {
    if (!dateStr) return undefined;
    
    const paymentDate = moment(dateStr, ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true);
    if (!paymentDate.isValid()) {
      return 'Invalid date format';
    }

    const today = moment().startOf('day');
    const daysDiff = paymentDate.diff(today, 'days');

    // Payment date should be in future
    if (daysDiff < 0) {
      return 'Payment date must be in the future';
    }

    // If invoice date is available, check if payment date is reasonable (7 or 21 days as per terms)
    if (invoiceDateStr) {
      const invoiceDate = moment(invoiceDateStr, ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true);
      if (invoiceDate.isValid()) {
        const daysFromInvoice = paymentDate.diff(invoiceDate, 'days');
        // Payment date should be at least 7 days from invoice date (as per terms)
        if (daysFromInvoice < 7) {
          return 'Payment date should be at least 7 days from invoice date';
        }
      }
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

  const updateItem = (index: number, field: keyof InvoiceLineItem, text: string) => {
    const newItems = [...(value.items || [])];
    if (!newItems[index]) {
      newItems[index] = {
        itemName: '', 
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
      };
    }
    newItems[index] = {...newItems[index], [field]: text};
    
    // Auto-calculate line total (qty * price)
    const qty = parseFloat(newItems[index].quantity) || 0;
    const price = parseFloat(newItems[index].pricePerQuantity) || 0;
    const lineTotal = qty * price;
    newItems[index].total = lineTotal.toFixed(2);
    
    // Auto-calculate item-level discount
    const discountType = newItems[index].discountType || '';
    const discountValue = parseFloat(newItems[index].discountValue || '0') || 0;
    let discountAmount = 0;
    
    if (discountType === 'percentage' && discountValue > 0) {
      discountAmount = (lineTotal * discountValue) / 100;
    } else if (discountType === 'value' && discountValue > 0) {
      discountAmount = discountValue;
    }
    newItems[index].discountAmount = discountAmount.toFixed(2);
    
    // Auto-calculate item-level tax (on amount after discount)
    const afterDiscount = Math.max(0, lineTotal - discountAmount);
    const taxPercentage = parseFloat(newItems[index].taxPercentage || '0') || 0;
    const taxAmount = (afterDiscount * taxPercentage) / 100;
    newItems[index].taxAmount = taxAmount.toFixed(2);
    
    onChange({items: newItems});
  };

  const addMoreItems = () => {
    const newItems = [...(value.items || []), {
      itemName: '', 
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
    }];
    onChange({items: newItems});
  };

  const removeItem = (index: number) => {
    const newItems = [...(value.items || [])];
    newItems.splice(index, 1);
    onChange({items: newItems});
  };

  const items = value.items || [];

  return (
    <ScrollView style={styles.container}>
      {/* Party Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {isDealerFinance ? 'Dealer Invoice' : 'Vendor Invoice'}
        </Text>
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <CustomDropdown
              label={isDealerFinance ? 'Dealer Name *' : 'Anchor Name *'}
              data={dealerNameOptions}
              value={value.dealer}
              onChange={set('dealer')}
              placeholder={isDealerFinance ? 'Select Dealer' : 'Select Anchor'}
              containerStyle={styles.dropdownContainer}
            />
            {errors.dealer && <Text style={styles.errorText}>{errors.dealer}</Text>}
          </View>
          <View style={styles.halfWidth}>
            <CustomDropdown
              label={isDealerFinance ? 'Dealer Code *' : 'Anchor Code *'}
              data={dealerCodeOptions}
              value={value.dealerCode}
              onChange={set('dealerCode')}
              placeholder={isDealerFinance ? 'Select Code' : 'Select Anchor Code'}
              containerStyle={styles.dropdownContainer}
            />
            {errors.dealerCode && <Text style={styles.errorText}>{errors.dealerCode}</Text>}
          </View>
        </View>
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              {isDealerFinance ? 'Dealer OD Account' : 'Anchor Loan Account for Vendor'}
            </Text>
            <TouchableOpacity
              onPress={() => setShowCreditAccountTooltip(true)}
              style={styles.infoButton}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <View style={styles.infoIconContainer}>
                <Text style={styles.infoIconText}>i</Text>
              </View>
            </TouchableOpacity>
          </View>
          <CustomDropdown
            label=""
            data={creditAccountOptions}
            value={value.odAccountNumber}
            onChange={set('odAccountNumber')}
            placeholder="Select Acc. No"
            containerStyle={styles.dropdownContainer}
          />
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
          <TextInput 
            style={[styles.input, errors.invoiceNumber && styles.inputError]} 
            value={value.invoiceNumber} 
            onChangeText={set('invoiceNumber')} 
            placeholder="Value" 
          />
          {errors.invoiceNumber && <Text style={styles.errorText}>{errors.invoiceNumber}</Text>}
        </View>
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <View style={styles.fieldInRow}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Associated PO</Text>
                <TouchableOpacity
                  onPress={() => setShowPOTooltip(true)}
                  style={styles.infoButton}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <View style={styles.infoIconContainer}>
                    <Text style={styles.infoIconText}>i</Text>
                  </View>
                </TouchableOpacity>
              </View>
              <CustomDropdown
                label=""
                data={[
                  {label: 'PO-2024-001', value: 'PO-2024-001'},
                  {label: 'PO-2024-002', value: 'PO-2024-002'},
                  {label: 'PO-2024-003', value: 'PO-2024-003'},
                ]}
                value={value.associatedPO}
                onChange={set('associatedPO')}
                placeholder="Please Select"
                containerStyle={styles.dropdownContainer}
                dropdownStyle={styles.dropdownHeight}
              />
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
                  maximumDate: new Date(), // Only allow current or past dates
                }}
                containerStyle={styles.datePickerContainer}
              />
              {errors.invoiceDate && <Text style={styles.errorText}>{errors.invoiceDate}</Text>}
              {value.invoiceDate && validateInvoiceDate(value.invoiceDate) && (
                <Text style={styles.warningText}>{validateInvoiceDate(value.invoiceDate)}</Text>
              )}
            </View>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <View style={styles.fieldInRow}>
              <DateNTimePicker
                label="Payment Date"
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
                  minimumDate: new Date(), // Only allow future dates
                }}
                containerStyle={styles.datePickerContainer}
              />
              {value.paymentDate && validatePaymentDate(value.paymentDate, value.invoiceDate) && (
                <Text style={styles.warningText}>{validatePaymentDate(value.paymentDate, value.invoiceDate)}</Text>
              )}
            </View>
          </View>
          <View style={styles.halfWidth}>
            <View style={[styles.fieldInRow, styles.invoiceDueDateField]}>
              <Text style={styles.label}>Invoice Due Date</Text>
              <TextInput
                style={[styles.input, styles.autoCalculated]}
                value={value.invoiceDueDate || ''}
                editable={false}
                placeholder="Auto Due Date"
                placeholderTextColor="#999"
              />
              {value.invoiceDueDate && (
                <Text style={styles.calculatedInfoText}>
                  Calculated: {value.grnDate ? 'GRN Date' : 'Invoice Date'} + {TENURE_DAYS} days
                </Text>
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
            <Text style={styles.label}>Early Payment Discount (%)</Text>
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
            <DateNTimePicker
              label="GRN Date (Optional)"
              value={parseDateValue(value.grnDate)}
              onConfirm={(date) => {
                const dateStr = formatDateForStorage(date);
                onChange({grnDate: dateStr});
                // Invoice Due Date will be auto-recalculated via useEffect
              }}
              placeholder="DD-MM-YYYY"
              mode="date"
              datePickerProps={{
                date: value.grnDate ? moment(value.grnDate, ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true).toDate() : new Date(),
                mode: 'date',
                maximumDate: new Date(), // GRN Date should be current or past
              }}
            />
          </View>
          <View style={styles.halfWidth}>
            <View style={styles.creditToField}>
              <CustomDropdown
                label="Credit To"
                data={creditAccountOptions}
                value={value.creditTo}
                onChange={set('creditTo')}
                placeholder="Select credit to"
                containerStyle={styles.dropdownContainer}
              />
            </View>
          </View>
        </View>
        <L label="Remark">
          <TextInput style={styles.input} value={value.remark} onChangeText={set('remark')} placeholder="Value" multiline numberOfLines={3} />
        </L>
      </View>

      {/* Add Details Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Add Details</Text>
          <TouchableOpacity style={styles.addButton} onPress={addMoreItems}>
            <Text style={styles.addButtonText}>+ Add more Items</Text>
          </TouchableOpacity>
        </View>

        {items.length === 0 && (
          <>
            <TouchableOpacity style={styles.addFirstItem} onPress={addMoreItems}>
              <Text style={styles.addFirstItemText}>Click to add first item</Text>
            </TouchableOpacity>
            {errors.items && <Text style={styles.errorText}>{errors.items}</Text>}
          </>
        )}

        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemIndex}>Item {index + 1}</Text>
              <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeButton}>
                <FontAwesome6 name="trash" iconStyle="solid" color="#dc3545" size={16} />
              </TouchableOpacity>
            </View>
            <L label="Item Name *">
              <TextInput 
                style={[styles.input, errors.items && errors.items.includes(`Item ${index + 1}`) && errors.items.includes('Item Name') && styles.inputError]} 
                value={item.itemName} 
                onChangeText={(text) => updateItem(index, 'itemName', text)} 
                placeholder="Value" 
              />
            </L>
            <View style={styles.row}>
              <View style={styles.thirdWidth}>
                <L label="Quantity *">
                  <TextInput 
                    style={[styles.input, errors.items && errors.items.includes(`Item ${index + 1}`) && errors.items.includes('Quantity') && styles.inputError]} 
                    value={item.quantity} 
                    onChangeText={(text) => updateItem(index, 'quantity', text)} 
                    placeholder="Value" 
                    keyboardType="decimal-pad" 
                  />
                </L>
              </View>
              <View style={styles.thirdWidth}>
                <CustomDropdown
                  label="Unit *"
                  data={unitOptions}
                  value={item.unit}
                  onChange={(text) => updateItem(index, 'unit', text)}
                  placeholder="Unit"
                  containerStyle={styles.dropdownContainer}
                />
              </View>
              <View style={styles.thirdWidth}>
                <L label="Price *">
                  <TextInput 
                    style={[styles.input, errors.items && errors.items.includes(`Item ${index + 1}`) && errors.items.includes('Price') && styles.inputError]} 
                    value={item.pricePerQuantity} 
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
              <TextInput style={[styles.input, styles.autoCalculated]} value={item.total} editable={false} placeholder="Auto Calculated" />
            </L>
            
            {/* Item-level Discount */}
            <View style={styles.itemDiscountTaxContainer}>
              <Text style={styles.itemDiscountTaxLabelText}>Discount</Text>
              <View style={styles.itemDiscountTaxVertical}>
                <View style={styles.discountTaxDropdownVertical}>
                  <CustomDropdown
                    label=""
                    data={[
                      {label: 'None', value: ''},
                      {label: 'Percentage', value: 'percentage'},
                      {label: 'Value', value: 'value'},
                    ]}
                    value={item.discountType || ''}
                    onChange={(val) => updateItem(index, 'discountType', val)}
                    placeholder="Select"
                    containerStyle={styles.itemDropdownContainer}
                    showSearch={false}
                  />
                </View>
                {item.discountType && (
                  <View style={styles.itemDiscountTaxInputsVertical}>
                    <TextInput
                      style={styles.itemDiscountTaxInputVertical}
                      value={item.discountValue || ''}
                      onChangeText={(text) => updateItem(index, 'discountValue', text)}
                      placeholder="Value"
                      keyboardType="decimal-pad"
                    />
                    <TextInput
                      style={[styles.itemDiscountTaxInputVertical, styles.autoCalculated]}
                      value={item.discountAmount || '0.00'}
                      editable={false}
                      placeholder="0.00"
                    />
                  </View>
                )}
              </View>
            </View>
            
            {/* Item-level Tax */}
            <View style={styles.itemDiscountTaxContainer}>
              <Text style={styles.itemDiscountTaxLabelText}>Tax</Text>
              <View style={styles.itemDiscountTaxVertical}>
                <View style={styles.discountTaxDropdownVertical}>
                  <CustomDropdown
                    label=""
                    data={[
                      {label: 'Select', value: ''},
                      {label: 'GST', value: 'GST'},
                      {label: 'CST', value: 'CST'},
                      {label: 'IGST', value: 'IGST'},
                    ]}
                    value={item.taxType || ''}
                    onChange={(val) => updateItem(index, 'taxType', val)}
                    placeholder="Select"
                    containerStyle={styles.itemDropdownContainer}
                    showSearch={false}
                  />
                </View>
                {item.taxType && (
                  <View style={styles.itemDiscountTaxInputsVertical}>
                    <TextInput
                      style={styles.itemDiscountTaxInputVertical}
                      value={item.taxPercentage || ''}
                      onChangeText={(text) => updateItem(index, 'taxPercentage', text)}
                      placeholder="Tax %"
                      keyboardType="decimal-pad"
                    />
                    <TextInput
                      style={[styles.itemDiscountTaxInputVertical, styles.autoCalculated]}
                      value={item.taxAmount || '0.00'}
                      editable={false}
                      placeholder="0.00"
                    />
                  </View>
                )}
              </View>
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
          
          // Calculate Tax Total (sum of all item-level taxes)
          const taxTotal = items.reduce((sum, item) => {
            return sum + (parseFloat(item.taxAmount || '0') || 0);
          }, 0);
          
          // Calculate Final Total (Sub Total - Discount Total + Tax Total)
          const total = Math.max(0, subTotal - discountTotal + taxTotal);

          return (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sub Total</Text>
                <Text style={styles.summaryValue}>₹{subTotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount Total</Text>
                <Text style={styles.summaryValue}>₹{discountTotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax Total</Text>
                <Text style={styles.summaryValue}>₹{taxTotal.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>₹{total.toFixed(2)}</Text>
              </View>
            </View>
          );
        })()}
      </View>

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

      {/* Submit and Cancel Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
          disabled={loading}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.submitButton, (loading || !isFormValid) && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={loading || !isFormValid}>
          {loading ? (
            <Text style={styles.submitButtonText}>Submitting...</Text>
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    alignItems: 'flex-start',
  },
  halfWidth: {
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
    marginTop: 8,
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
  itemDropdownContainer: {
    marginBottom: 0,
  },
  summaryContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 100,
    textAlign: 'right',
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 12,
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc3545',
    minWidth: 100,
    textAlign: 'right',
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
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
});