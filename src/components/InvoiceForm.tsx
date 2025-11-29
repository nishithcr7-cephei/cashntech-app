import React from 'react';
import {View, TextInput, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import type {InvoiceFields, InvoiceLineItem} from '@type/Invoice';

type Props = {
  value: InvoiceFields;
  onChange: (patch: Partial<InvoiceFields>) => void;
};

export const InvoiceForm: React.FC<Props> = ({value, onChange}) => {
  const set = (key: keyof InvoiceFields) => (text: string) => {
    onChange({[key]: text});
  };

  const updateItem = (index: number, field: keyof InvoiceLineItem, text: string) => {
    const newItems = [...(value.items || [])];
    if (!newItems[index]) {
      newItems[index] = {itemName: '', quantity: '', unit: '', pricePerQuantity: '', total: ''};
    }
    newItems[index] = {...newItems[index], [field]: text};
    
    // Auto-calculate total
    const qty = parseFloat(newItems[index].quantity) || 0;
    const price = parseFloat(newItems[index].pricePerQuantity) || 0;
    newItems[index].total = (qty * price).toFixed(2);
    
    onChange({items: newItems});
  };

  const addMoreItems = () => {
    const newItems = [...(value.items || []), {itemName: '', quantity: '', unit: '', pricePerQuantity: '', total: ''}];
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
      {/* Dealer Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dealer Information</Text>
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <L label="Dealer">
              <TextInput style={styles.input} value={value.dealer} onChangeText={set('dealer')} placeholder="Source of Lead" />
            </L>
          </View>
          <View style={styles.halfWidth}>
            <L label="Dealer Code">
              <TextInput style={styles.input} value={value.dealerCode} onChangeText={set('dealerCode')} placeholder="Select City" />
            </L>
          </View>
        </View>
        <L label="OD Account Number">
          <TextInput style={styles.input} value={value.odAccountNumber} onChangeText={set('odAccountNumber')} placeholder="Select City" />
        </L>
      </View>

      {/* Invoice Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invoice Details</Text>
        <L label="Invoice / Unique Ref. No">
          <TextInput style={styles.input} value={value.invoiceNumber} onChangeText={set('invoiceNumber')} placeholder="Value" />
        </L>
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <L label="Associated PO">
              <TextInput style={styles.input} value={value.associatedPO} onChangeText={set('associatedPO')} placeholder="File By" />
            </L>
          </View>
          <View style={styles.halfWidth}>
            <L label="Invoice Date">
              <TextInput style={styles.input} value={value.invoiceDate} onChangeText={set('invoiceDate')} placeholder="File By" />
            </L>
          </View>
        </View>
        <L label="Invoice Due Date">
          <TextInput style={styles.input} value={value.invoiceDueDate} onChangeText={set('invoiceDueDate')} placeholder="File By" />
        </L>
      </View>

      {/* Additional Invoice Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Invoice Information</Text>
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <L label="Early Payment Discount (%)">
              <TextInput style={styles.input} value={value.earlyPaymentDiscount} onChangeText={set('earlyPaymentDiscount')} placeholder="Value" keyboardType="decimal-pad" />
            </L>
          </View>
          <View style={styles.halfWidth}>
            <L label="Currency">
              <TextInput style={styles.input} value={value.currency} onChangeText={set('currency')} placeholder="File By" />
            </L>
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
          <TouchableOpacity style={styles.addFirstItem} onPress={addMoreItems}>
            <Text style={styles.addFirstItemText}>Click to add first item</Text>
          </TouchableOpacity>
        )}

        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemIndex}>Item {index + 1}</Text>
              {items.length > 1 && (
                <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <L label="Item Name">
              <TextInput style={styles.input} value={item.itemName} onChangeText={(text) => updateItem(index, 'itemName', text)} placeholder="Value" />
            </L>
            <View style={styles.row}>
              <View style={styles.thirdWidth}>
                <L label="Quantity">
                  <TextInput style={styles.input} value={item.quantity} onChangeText={(text) => updateItem(index, 'quantity', text)} placeholder="Value" keyboardType="decimal-pad" />
                </L>
              </View>
              <View style={styles.thirdWidth}>
                <L label="Unit">
                  <TextInput style={styles.input} value={item.unit} onChangeText={(text) => updateItem(index, 'unit', text)} placeholder="Value" />
                </L>
              </View>
              <View style={styles.thirdWidth}>
                <L label="Price per Quantity">
                  <TextInput style={styles.input} value={item.pricePerQuantity} onChangeText={(text) => updateItem(index, 'pricePerQuantity', text)} placeholder="Value" keyboardType="decimal-pad" />
                </L>
              </View>
            </View>
            <L label="Total">
              <TextInput style={[styles.input, styles.autoCalculated]} value={item.total} editable={false} placeholder="Auto Calculated" />
            </L>
          </View>
        ))}
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
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  thirdWidth: {
    flex: 1,
  },
  field: {
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
    fontSize: 14,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 14,
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
    fontSize: 14,
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
    fontSize: 14,
    color: '#333',
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeButtonText: {
    color: '#dc3545',
    fontSize: 12,
    fontWeight: '600',
  },
  autoCalculated: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
});