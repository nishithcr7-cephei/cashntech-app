import React, {useState, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {CustomDropdown} from '@components/index';

type RequestWaiverModalProps = {
  visible: boolean;
  onClose: () => void;
  loanRefNo?: string;
  outstandingAmount?: string;
  onSubmit?: (data: {
    loanRefNo: string;
    waiverType: string;
    waiverAmount: string;
    reason: string;
  }) => void;
};

const waiverTypeOptions = [
  {label: 'Penal Interest Waiver', value: 'penal_interest'},
  {label: 'Principal Waiver', value: 'principal'},
  {label: 'Other', value: 'other'},
];

export const RequestWaiverModal: React.FC<RequestWaiverModalProps> = ({
  visible,
  onClose,
  loanRefNo: loanRefNoProp = '',
  outstandingAmount = '15,556',
  onSubmit,
}) => {
  const [loanRefNo, setLoanRefNo] = useState(loanRefNoProp);
  const [waiverType, setWaiverType] = useState('');
  const [waiverAmount, setWaiverAmount] = useState('10,000');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (visible) {
      setLoanRefNo(loanRefNoProp);
      setWaiverType('');
      setWaiverAmount('10,000');
      setReason('');
    }
  }, [visible, loanRefNoProp]);

  const handleSubmit = () => {
    if (!waiverType || !waiverAmount.trim()) return;
    if (onSubmit) {
      onSubmit({
        loanRefNo: loanRefNo.trim(),
        waiverType,
        waiverAmount: waiverAmount.trim(),
        reason: reason.trim(),
      });
    }
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Request Waiver</Text>
              </View>

              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">
                <View style={styles.tableContainer}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>Detail</Text>
                    <Text style={styles.tableHeaderText}>Amount</Text>
                  </View>

                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Loan Ref. No :</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <TextInput
                        style={styles.input}
                        value={loanRefNo}
                        onChangeText={setLoanRefNo}
                        placeholder="Value"
                        placeholderTextColor={Colors.graybase}
                      />
                    </View>
                  </View>

                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Outstanding Amount :</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <TextInput
                        style={[styles.input, styles.readOnlyInput]}
                        value={`Rs.: ${outstandingAmount}`}
                        editable={false}
                        placeholderTextColor={Colors.graybase}
                      />
                    </View>
                  </View>

                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Waiver Type</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <CustomDropdown
                        label=""
                        data={waiverTypeOptions}
                        value={waiverType}
                        onChange={setWaiverType}
                        placeholder="Select Waiver Type"
                        containerStyle={styles.dropdownContainer}
                        showSearch={false}
                      />
                    </View>
                  </View>

                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Waiver Amount</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <TextInput
                        style={styles.input}
                        value={waiverAmount ? `Rs.: ${waiverAmount}` : ''}
                        onChangeText={text => {
                          const amt = text.replace(/^Rs\.:\s*/, '').trim();
                          setWaiverAmount(amt);
                        }}
                        placeholder="Rs.: 10,000"
                        placeholderTextColor={Colors.graybase}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={[styles.tableRow, styles.reasonRow]}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Reason</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <TextInput
                        style={[styles.input, styles.reasonInput]}
                        value={reason}
                        onChangeText={setReason}
                        placeholder="Reason"
                        placeholderTextColor={Colors.graybase}
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.submitButton]} onPress={handleSubmit}>
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '90%', maxHeight: '90%', backgroundColor: Colors.white, borderRadius: scaleWidth(12), overflow: 'hidden', flexDirection: 'column' },
  modalHeader: { paddingHorizontal: scaleWidth(16), paddingTop: scaleHeight(16), paddingBottom: scaleHeight(12), borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E6E6E6', alignItems: 'center' },
  modalTitle: { fontSize: scaleFont(17), fontFamily: Fonts.GilroySemiBold, color: Colors.darkblack },
  scrollView: { flexShrink: 1 },
  scrollContent: { padding: scaleWidth(16) },
  tableContainer: { borderWidth: 1, borderColor: '#E6E6E6', borderRadius: scaleWidth(8), backgroundColor: '#F7F8FB', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#E6E6E6', borderBottomWidth: 1, borderBottomColor: '#D0D0D0' },
  tableHeaderText: { flex: 1, fontSize: scaleFont(14), fontFamily: Fonts.GilroySemiBold, color: Colors.darkblack, paddingVertical: scaleHeight(10), paddingHorizontal: scaleWidth(12), textAlign: 'center' },
  tableRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E6E6E6', minHeight: scaleHeight(50) },
  reasonRow: { minHeight: scaleHeight(80) },
  detailColumn: { flex: 1, justifyContent: 'center', paddingHorizontal: scaleWidth(12), paddingVertical: scaleHeight(8), borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: '#E6E6E6', backgroundColor: Colors.white },
  amountColumn: { flex: 1, justifyContent: 'center', paddingHorizontal: scaleWidth(12), paddingVertical: scaleHeight(8) },
  detailLabel: { fontSize: scaleFont(13), fontFamily: Fonts.GilroyMedium, color: Colors.darkblack },
  input: { borderWidth: 1, borderColor: '#E6E6E6', borderRadius: scaleWidth(6), paddingHorizontal: scaleWidth(10), paddingVertical: scaleHeight(8), fontSize: scaleFont(13), fontFamily: Fonts.GilroyMedium, color: Colors.darkblack, backgroundColor: Colors.white, minHeight: scaleHeight(36) },
  readOnlyInput: { backgroundColor: '#F5F5F5', color: Colors.graybase },
  reasonInput: { minHeight: scaleHeight(64), textAlignVertical: 'top' },
  dropdownContainer: { marginBottom: 0 },
  buttonContainer: { flexDirection: 'row', gap: scaleWidth(12), padding: scaleWidth(16), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E6E6E6' },
  actionButton: { flex: 1, paddingVertical: scaleHeight(12), borderRadius: scaleWidth(8), alignItems: 'center', justifyContent: 'center' },
  cancelButton: { backgroundColor: Colors.white, borderWidth: 1, borderColor: '#D0D0D0' },
  submitButton: { backgroundColor: Colors.green },
  cancelButtonText: { fontSize: scaleFont(14), fontFamily: Fonts.GilroySemiBold, color: Colors.darkblack },
  submitButtonText: { fontSize: scaleFont(14), fontFamily: Fonts.GilroySemiBold, color: Colors.white },
});
