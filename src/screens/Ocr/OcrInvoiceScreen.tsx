import React, {useMemo, useState} from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, StyleSheet, Modal} from 'react-native';
import {ensureCameraPermission, ensurePhotoPermission} from '@services/permissions';
import {runOcrFromPath, runGSTInvoiceExtractionWithAI} from '@services/ocr';
import {InvoiceForm} from '@components/InvoiceForm';
import {InvoiceCamera} from '@components/InvoiceCamera';
import type {InvoiceFields} from '../../types/Invoice';
import type {GSTInvoiceJSON} from '@services/gstInvoiceExtractor';
import {launchImageLibrary} from 'react-native-image-picker';

const emptyFields: InvoiceFields = {
  // Dealer Information
  dealer: '',
  dealerCode: '',
  odAccountNumber: '',
  // Invoice Details
  invoiceNumber: '',
  associatedPO: '',
  tenor: '',
  invoiceDate: '',
  invoiceDueDate: '',
  paymentDate: '',
  grnDate: '',
  // Additional Invoice Information
  earlyPaymentDiscount: '',
  currency: '',
  creditTo: '',
  remark: '',
  // Line Items
  items: [],
  // Discount Fields
  discountType: '',
  discountValue: '',
  // Tax Summary
  cgst: '',
  sgst: '',
  grandTotal: '',
};

export const OcrInvoiceScreen: React.FC = () => {
  const [fields, setFields] = useState<InvoiceFields>(emptyFields);
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState<string>('');
  const [gstInvoiceJSON, setGstInvoiceJSON] = useState<GSTInvoiceJSON | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [extractionMode, setExtractionMode] = useState<'free' | 'ai'>('free');
  const [extractionMethod, setExtractionMethod] = useState<'gemini' | 'mlkit'>('mlkit');
  const disabled = useMemo(() => loading, [loading]);
  const applyPatch = (patch: Partial<InvoiceFields>) => setFields(prev => ({...prev, ...patch}));

  const handleImagePath = async (uriOrPath: string | null) => {
    if (!uriOrPath) return;
    try {
      setLoading(true);
      
      // Hybrid approach: Use Gemini if selected, otherwise ML Kit
      const useGemini = extractionMode === 'ai';
      const {rawText, gstInvoice, method} = await runGSTInvoiceExtractionWithAI(uriOrPath, useGemini);
      
      setRawText(rawText);
      setGstInvoiceJSON(gstInvoice);
      setExtractionMethod(method);
      
      // Also populate the form fields for backward compatibility
      const {fields: parsed} = await runOcrFromPath(uriOrPath);
      setFields(prev => {
        const merged = {...prev, ...parsed};
        if (parsed.items && parsed.items.length > 0) {
          merged.items = parsed.items;
        }
        return merged;
      });
    } catch (e: any) {
      Alert.alert('OCR failed', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const openCamera = async () => {
    const ok = await ensureCameraPermission();
    if (!ok) return Alert.alert('Permission required', 'Camera permission is needed to capture invoices.');
    setShowCamera(true);
  };

  const openGallery = async () => {
    const ok = await ensurePhotoPermission();
    if (!ok) return Alert.alert('Permission required', 'Photo permission is needed to select invoices.');
    const res = await launchImageLibrary({mediaType: 'photo', selectionLimit: 1});
    const uri = res?.assets?.[0]?.uri ?? null;
    handleImagePath(uri);
  };

  const clearAll = () => {
    setFields(emptyFields);
    setRawText('');
    setGstInvoiceJSON(null);
  };

  return (
    <View style={{flex: 1}}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>OCR Invoice Auto-fill</Text>

        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity 
            style={[styles.modeBtn, extractionMode === 'free' && styles.activeMode]}
            onPress={() => setExtractionMode('free')}
            disabled={disabled}
          >
            <Text style={styles.modeBtnText}>🚀 Quick Scan (Free)</Text>
            <Text style={styles.modeDesc}>Works Offline • Fast</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modeBtn, extractionMode === 'ai' && styles.activeMode]}
            onPress={() => setExtractionMode('ai')}
            disabled={disabled}
          >
            <Text style={styles.modeBtnText}>✨ AI Scan (Premium)</Text>
            <Text style={styles.modeDesc}>High Accuracy • Needs Internet</Text>
          </TouchableOpacity>
        </View>

        {/* Show which method was used */}
        {extractionMethod === 'gemini' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✨ AI-Powered Extraction</Text>
          </View>
        )}

        <View style={styles.row}>
          <TouchableOpacity style={[styles.btn, styles.primary]} onPress={openCamera} disabled={disabled}><Text style={styles.btnText}>Capture</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={openGallery} disabled={disabled}><Text style={styles.btnText}>Pick Image</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={clearAll} disabled={disabled}><Text style={styles.btnText}>Clear</Text></TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator />
            <Text>Extracting structured data…</Text>
          </View>
        )}

        {!!gstInvoiceJSON && (
          <>
            <View style={styles.readableBox}>
              <Text style={styles.readableTitle}>📄 Extracted GST Invoice Data</Text>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Invoice Header</Text>
                <Text style={styles.dataRow}>Invoice No: <Text style={styles.dataValue}>{gstInvoiceJSON.invoice_header.invoice_number}</Text></Text>
                <Text style={styles.dataRow}>Date: <Text style={styles.dataValue}>{gstInvoiceJSON.invoice_header.invoice_date}</Text></Text>
                <Text style={styles.dataRow}>Order No: <Text style={styles.dataValue}>{gstInvoiceJSON.invoice_header.order_no || 'N/A'}</Text></Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Seller Details</Text>
                <Text style={styles.dataRow}>Name: <Text style={styles.dataValue}>{gstInvoiceJSON.invoice_header.seller_name}</Text></Text>
                <Text style={styles.dataRow}>GSTIN: <Text style={styles.dataValue}>{gstInvoiceJSON.invoice_header.seller_gstin}</Text></Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Buyer Details</Text>
                <Text style={styles.dataRow}>Name: <Text style={styles.dataValue}>{gstInvoiceJSON.invoice_header.buyer_name}</Text></Text>
                <Text style={styles.dataRow}>GSTIN: <Text style={styles.dataValue}>{gstInvoiceJSON.invoice_header.buyer_gstin}</Text></Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Line Items ({gstInvoiceJSON.line_items.length})</Text>
                {gstInvoiceJSON.line_items.map((item, idx) => (
                  <View key={idx} style={styles.itemBox}>
                    <Text style={styles.itemDesc}>{item.description}</Text>
                    <Text style={styles.itemDetail}>HSN: {item.hsn_code} | Qty: {item.quantity} | Rate: ₹{item.rate_per_unit.toFixed(2)}</Text>
                    <Text style={styles.itemAmount}>Amount: ₹{item.taxable_amount.toFixed(2)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Financial Summary</Text>
                <Text style={styles.dataRow}>Subtotal (Taxable): <Text style={styles.dataValue}>₹{gstInvoiceJSON.financial_summary.sub_total_taxable_value.toFixed(2)}</Text></Text>
                <Text style={styles.dataRow}>CGST: <Text style={styles.dataValue}>₹{gstInvoiceJSON.financial_summary.total_cgst_amount.toFixed(2)}</Text></Text>
                <Text style={styles.dataRow}>SGST: <Text style={styles.dataValue}>₹{gstInvoiceJSON.financial_summary.total_sgst_amount.toFixed(2)}</Text></Text>
                <Text style={[styles.dataRow, styles.grandTotal]}>Grand Total: <Text style={styles.grandTotalValue}>₹{gstInvoiceJSON.financial_summary.grand_total_amount.toFixed(2)}</Text></Text>
                <Text style={styles.amountWords}>{gstInvoiceJSON.financial_summary.total_in_words}</Text>
              </View>
            </View>

            <View style={styles.jsonBox}>
              <Text style={styles.jsonTitle}>📋 Raw JSON Output</Text>
              <ScrollView style={styles.jsonScroll} nestedScrollEnabled>
                <Text style={styles.jsonText}>{JSON.stringify(gstInvoiceJSON, null, 2)}</Text>
              </ScrollView>
            </View>
          </>
        )}

        <InvoiceForm value={fields} onChange={applyPatch} />

        {!!rawText && (
          <View style={styles.rawBox}>
            <Text style={styles.rawTitle}>Raw OCR Text</Text>
            <Text style={styles.rawText}>{rawText}</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showCamera} animationType="slide">
        <InvoiceCamera
          onCaptured={(path) => {
            setShowCamera(false);
            handleImagePath('file://' + path);
          }}
          onClose={() => setShowCamera(false)}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16, gap: 16},
  title: {fontSize: 20, fontWeight: '700'},
  row: {flexDirection: 'row', gap: 12},
  btn: {backgroundColor: '#444', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8},
  primary: {backgroundColor: '#0a84ff'},
  btnText: {color: '#fff', fontWeight: '600'},
  loading: {flexDirection: 'row', alignItems: 'center', gap: 8},
  
  // Readable structured data display
  readableBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196f3',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  readableTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1976d2',
  },
  section: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  dataRow: {
    fontSize: 14,
    marginBottom: 4,
    color: '#555',
  },
  dataValue: {
    fontWeight: '600',
    color: '#000',
  },
  itemBox: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#2196f3',
  },
  itemDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  itemAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1976d2',
  },
  grandTotal: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    color: '#000',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4caf50',
  },
  amountWords: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 4,
  },
  
  // JSON display
  jsonBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  jsonTitle: {fontWeight: '700', marginBottom: 6, color: '#2e7d32', fontSize: 16},
  jsonScroll: {maxHeight: 300},
  jsonText: {color: '#1b5e20', fontFamily: 'monospace', fontSize: 12},
  
  rawBox: {marginTop: 16, padding: 12, backgroundColor: '#f6f6f6', borderRadius: 8},
  rawTitle: {fontWeight: '700', marginBottom: 6},
  rawText: {color: '#333'},
  
  // Mode Selector Styles
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  activeMode: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  modeDesc: {
    fontSize: 11,
    color: '#666',
  },
  badge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});


