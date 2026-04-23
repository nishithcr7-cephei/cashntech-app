import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';

export type BulkInvoiceItem = {
  id: string;
  invoiceNo: string;
  dealerName: string;
  amount: string;
  dueDate?: string;
};

type BulkReviewModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedInvoices: BulkInvoiceItem[];
  action: 'Verify' | 'Reject' | 'On Hold';
  onSubmit: (payload: {
    action: 'Verify' | 'Reject' | 'On Hold';
    invoices: {
      invoiceId: string;
      action: string;
      remark: string;
      approvalRemark?: string;
    }[];
  }) => void;
  loading?: boolean;
};

export const BulkReviewModal: React.FC<BulkReviewModalProps> = ({
  visible,
  onClose,
  selectedInvoices,
  action,
  onSubmit,
  loading = false,
}) => {
  const insets = useSafeAreaInsets();
  const [individualRemarks, setIndividualRemarks] = useState<Record<string, string>>({});
  const [activeInvoices, setActiveInvoices] = useState<Set<string>>(new Set());
  const [showConfirmUI, setShowConfirmUI] = useState(false);

  useEffect(() => {
    if (visible) {
      setActiveInvoices(new Set(selectedInvoices.map(inv => inv.id)));
      setShowConfirmUI(false);
    }
  }, [visible, selectedInvoices]);

  if (!visible) return null;

  const modalTitle = `${action} Invoices`;
  
  const toggleInvoiceActive = (id: string) => {
    if (showConfirmUI) return;
    setActiveInvoices(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleIndividualRemarkChange = (id: string, text: string) => {
    setIndividualRemarks(prev => ({...prev, [id]: text}));
  };

  const handleFinalSubmit = () => {
    const invoicesToProcess = selectedInvoices.filter(inv => activeInvoices.has(inv.id));
    const payloadInvoices = invoicesToProcess.map(inv => {
      const remark = individualRemarks[inv.id] || '';
      return {
        invoiceId: inv.id,
        action: action,
        remark: (action === 'Reject' || action === 'On Hold') ? remark : '-',
        approvalRemark: action === 'Verify' ? remark : undefined,
      };
    });

    onSubmit({
      action,
      invoices: payloadInvoices,
    });
    setShowConfirmUI(false);
  };

  const handleClose = () => {
    setIndividualRemarks({});
    setShowConfirmUI(false);
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={handleClose} 
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <View style={[styles.modalContainer, {maxHeight: '90%', paddingBottom: insets.bottom || scaleHeight(20)}]}>
          
          {showConfirmUI ? (
            <View style={styles.confirmContainer}>
              <View style={styles.confirmIconCircle}>
                <FontAwesome6 name="circle-question" iconStyle="solid" size={40} color={Colors.primaryColor} />
              </View>
              <Text style={styles.confirmTitle}>Confirm Submission</Text>
              <Text style={styles.confirmMessage}>
                Are you sure you want to {action.toLowerCase()} the selected {activeInvoices.size} invoices?
              </Text>
              <View style={styles.confirmActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton, {flex: 1}]}
                  onPress={() => setShowConfirmUI(false)}>
                  <Text style={styles.cancelButtonText}>Back to Review</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    action === 'Verify' ? styles.verifyButton : action === 'Reject' ? styles.rejectButton : styles.holdButton,
                    {flex: 1.2}
                  ]}
                  onPress={handleFinalSubmit}>
                  <Text style={styles.actionButtonText}>Yes, {action} Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.modalHeader}>
                <View style={{flex: 1}}>
                  <Text style={styles.modalTitle}>{modalTitle}</Text>
                  <Text style={styles.modalSubtitle}>Double check and confirm {activeInvoices.size} invoices below.</Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <FontAwesome6 name="circle-xmark" iconStyle="solid" size={26} color={Colors.graybase} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={true}>
                <View style={styles.invoiceList}>
                  {selectedInvoices.map((item) => {
                    const isActive = activeInvoices.has(item.id);
                    return (
                      <TouchableOpacity 
                        key={item.id} 
                        activeOpacity={0.9}
                        onPress={() => toggleInvoiceActive(item.id)}
                        style={[styles.invoiceCard, !isActive && styles.invoiceCardInactive]}
                      >
                        <View style={styles.cardHeader}>
                          <View style={styles.headerLeft}>
                            <View style={[styles.checkbox, isActive && styles.checkboxActive]}>
                              {isActive && <Text style={styles.checkboxTick}>✓</Text>}
                            </View>
                            <View style={styles.invoiceInfoPill}>
                              <Text style={styles.invoiceNoText}>{item.invoiceNo}</Text>
                            </View>
                          </View>
                          <Text style={styles.amountText}>{item.amount}</Text>
                        </View>

                        <View style={styles.detailsGrid}>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Due Date</Text>
                            <Text style={styles.detailValue}>{item.dueDate || '-'}</Text>
                          </View>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Dealer</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>{item.dealerName}</Text>
                          </View>
                        </View>

                        <View style={styles.remarkContainer}>
                          <View style={styles.remarkHeader}>
                            <Text style={styles.remarkLabel}>Remark</Text>
                            <Text style={styles.optionalLabel}>(Optional)</Text>
                          </View>
                          <TextInput
                            style={styles.individualInput}
                            placeholder="Enter your remark here..."
                            placeholderTextColor="#A0AEC0"
                            value={individualRemarks[item.id] || ''}
                            onChangeText={(text) => handleIndividualRemarkChange(item.id, text)}
                            multiline
                            textAlignVertical="top"
                            editable={isActive}
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton, 
                    action === 'Verify' ? styles.verifyButton : action === 'Reject' ? styles.rejectButton : styles.holdButton,
                    (loading || activeInvoices.size === 0) && styles.disabledButton
                  ]}
                  onPress={() => setShowConfirmUI(true)}
                  disabled={loading || activeInvoices.size === 0}>
                  {loading ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <View style={styles.submitBtnContent}>
                      <Text style={styles.actionButtonText}>Submit ({activeInvoices.size})</Text>
                      <FontAwesome6 name="check" iconStyle="solid" size={14} color={Colors.white} style={{marginLeft: 8}} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20000,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  keyboardView: {
    width: '100%',
    zIndex: 20001,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: scaleWidth(24),
    borderTopRightRadius: scaleWidth(24),
    paddingTop: scaleHeight(20),
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: scaleWidth(20),
    paddingBottom: scaleHeight(15),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: scaleFont(20),
    fontFamily: Fonts.GilroyBold,
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: '#64748B',
    marginTop: scaleHeight(4),
  },
  closeButton: {
    padding: scaleWidth(5),
  },
  modalContent: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(16),
  },
  confirmContainer: {
    padding: scaleWidth(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmIconCircle: {
    width: scaleWidth(80),
    height: scaleWidth(80),
    borderRadius: scaleWidth(40),
    backgroundColor: '#FFF1F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleHeight(20),
  },
  confirmTitle: {
    fontSize: scaleFont(22),
    fontFamily: Fonts.GilroyBold,
    color: '#1E293B',
    marginBottom: scaleHeight(12),
  },
  confirmMessage: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroyMedium,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: scaleHeight(22),
    marginBottom: scaleHeight(30),
  },
  confirmActions: {
    flexDirection: 'row',
    gap: scaleWidth(16),
    width: '100%',
  },
  invoiceList: {
    paddingBottom: scaleHeight(20),
  },
  invoiceCard: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(16),
    padding: scaleWidth(16),
    marginBottom: scaleHeight(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  invoiceCardInactive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
  },
  checkbox: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(4),
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  checkboxTick: {
    color: Colors.white,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyBold,
    lineHeight: scaleFont(14),
  },
  invoiceInfoPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(8),
  },
  invoiceNoText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyBold,
    color: '#334155',
  },
  amountText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroyBold,
    color: Colors.primaryColor,
  },
  detailsGrid: {
    flexDirection: 'row',
    marginBottom: scaleHeight(16),
    gap: scaleWidth(20),
    paddingLeft: scaleWidth(32),
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: '#475569',
  },
  remarkContainer: {
    marginTop: scaleHeight(4),
    paddingLeft: scaleWidth(32),
  },
  remarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(6),
  },
  remarkLabel: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: '#475569',
  },
  optionalLabel: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: '#94A3B8',
    marginLeft: 4,
  },
  individualInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: scaleWidth(10),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(10),
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    minHeight: scaleHeight(40),
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(16),
    gap: scaleWidth(12),
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionButton: {
    flex: 1,
    height: scaleHeight(48),
    borderRadius: scaleWidth(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: '#64748B',
  },
  verifyButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  holdButton: {
    backgroundColor: '#F59E0B',
  },
  actionButtonText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroyBold,
    color: Colors.white,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
