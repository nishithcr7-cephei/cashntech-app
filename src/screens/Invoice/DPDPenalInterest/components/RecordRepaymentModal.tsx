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
import {DateNTimePicker, CustomDropdown} from '@components/index';
import {dismissKeyboardOrClose} from '@utils/modalRequestClose';

type RecordRepaymentModalProps = {
  visible: boolean;
  onClose: () => void;
  accountNo?: string;
  totalOutstanding?: string;
  /**
   * When false (default), Submit is hidden — mobile has no repayment posting
   * flow (PR7 read-only parity for DF + VF alike).
   */
  submitEnabled?: boolean;
  onSubmit?: (data: {
    repaymentMode: string;
    invoicesList: string;
    repaymentAmount: string;
    debitFrom: string;
    creditTo: string;
    paymentReceiveDate: string;
    utrRefNo: string;
  }) => void;
};

const repaymentModeOptions = [
  {label: 'Invoice Level', value: 'invoice_level'},
  {label: 'Account Level', value: 'account_level'},
];

const invoicesListOptions = [
  {label: 'All Invoices', value: 'all'},
  {label: 'Select Invoices', value: 'select'},
];

const accountOptions = [
  {label: 'Account 1', value: 'acc1'},
  {label: 'Account 2', value: 'acc2'},
  {label: 'Account 3', value: 'acc3'},
];

export const RecordRepaymentModal: React.FC<RecordRepaymentModalProps> = ({
  visible,
  onClose,
  accountNo = '(Account No.)',
  totalOutstanding = '25,10,556',
  submitEnabled = false,
  onSubmit,
}) => {
  const [repaymentMode, setRepaymentMode] = useState('invoice_level');
  const [invoicesList, setInvoicesList] = useState('all');
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [debitFrom, setDebitFrom] = useState('');
  const [creditTo, setCreditTo] = useState('');
  const [paymentReceiveDate, setPaymentReceiveDate] = useState('');
  const [utrRefNo, setUtrRefNo] = useState('');

  useEffect(() => {
    if (visible) {
      setRepaymentMode('invoice_level');
      setInvoicesList('all');
      setRepaymentAmount('');
      setDebitFrom('');
      setCreditTo('');
      setPaymentReceiveDate('');
      setUtrRefNo('');
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!submitEnabled) {
      return;
    }
    if (!repaymentAmount.trim() || !debitFrom || !creditTo || !paymentReceiveDate) return;
    if (onSubmit) {
      onSubmit({
        repaymentMode,
        invoicesList,
        repaymentAmount: repaymentAmount.trim(),
        debitFrom,
        creditTo,
        paymentReceiveDate,
        utrRefNo: utrRefNo.trim(),
      });
    }
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => dismissKeyboardOrClose(onClose)}>
      <TouchableWithoutFeedback
        onPress={() => dismissKeyboardOrClose(onClose)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitleWrap}>
                  Are you sure, you want to Record this Repayment for{' '}
                  <Text style={styles.modalTitleBold}>{accountNo}</Text>?
                </Text>
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
                      <Text style={styles.detailLabel}>Repayment Mode</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <CustomDropdown
                        label=""
                        data={repaymentModeOptions}
                        value={repaymentMode}
                        onChange={setRepaymentMode}
                        placeholder="Invoice Level"
                        containerStyle={styles.dropdownContainer}
                        showSearch={false}
                      />
                    </View>
                  </View>

                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Invoices List</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <CustomDropdown
                        label=""
                        data={invoicesListOptions}
                        value={invoicesList}
                        onChange={setInvoicesList}
                        placeholder="All Invoices"
                        containerStyle={styles.dropdownContainer}
                        showSearch={false}
                      />
                    </View>
                  </View>

                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Total Outstanding</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <TextInput
                        style={[styles.input, styles.readOnlyInput]}
                        value={`Rs. : ${totalOutstanding}/-`}
                        editable={false}
                        placeholderTextColor={Colors.graybase}
                      />
                    </View>
                  </View>

                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Repayment Amount</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <TextInput
                        style={styles.input}
                        value={repaymentAmount}
                        onChangeText={setRepaymentAmount}
                        placeholder="Value"
                        placeholderTextColor={Colors.graybase}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Debit From :</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <CustomDropdown
                        label=""
                        data={accountOptions}
                        value={debitFrom}
                        onChange={setDebitFrom}
                        placeholder="Select Account No"
                        containerStyle={styles.dropdownContainer}
                        showSearch={false}
                      />
                    </View>
                  </View>

                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Credit To :</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <CustomDropdown
                        label=""
                        data={accountOptions}
                        value={creditTo}
                        onChange={setCreditTo}
                        placeholder="Select Account No"
                        containerStyle={styles.dropdownContainer}
                        showSearch={false}
                      />
                    </View>
                  </View>

                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Payment Receive Date</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <DateNTimePicker
                        label=""
                        mode="date"
                        value={paymentReceiveDate}
                        onConfirm={(selectedDate: Date) => {
                          const d = selectedDate;
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          setPaymentReceiveDate(`${day}-${month}-${year}`);
                        }}
                        placeholder="Select Date"
                        containerStyle={styles.datePickerContainer}
                      />
                    </View>
                  </View>

                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>UTR / Ref. No</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <TextInput
                        style={styles.input}
                        value={utrRefNo}
                        onChangeText={setUtrRefNo}
                        placeholder="Value"
                        placeholderTextColor={Colors.graybase}
                      />
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                {submitEnabled ? (
                  <TouchableOpacity style={[styles.actionButton, styles.submitButton]} onPress={handleSubmit}>
                    <Text style={styles.submitButtonText}>Submit</Text>
                  </TouchableOpacity>
                ) : null}
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
  modalTitleWrap: { fontSize: scaleFont(14), fontFamily: Fonts.GilroyMedium, color: Colors.darkblack, textAlign: 'center' },
  modalTitleBold: { fontFamily: Fonts.GilroySemiBold },
  scrollView: { flexShrink: 1 },
  scrollContent: { padding: scaleWidth(16) },
  tableContainer: { borderWidth: 1, borderColor: '#E6E6E6', borderRadius: scaleWidth(8), backgroundColor: '#F7F8FB', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#E6E6E6', borderBottomWidth: 1, borderBottomColor: '#D0D0D0' },
  tableHeaderText: { flex: 1, fontSize: scaleFont(14), fontFamily: Fonts.GilroySemiBold, color: Colors.darkblack, paddingVertical: scaleHeight(10), paddingHorizontal: scaleWidth(12), textAlign: 'center' },
  tableRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E6E6E6', minHeight: scaleHeight(50) },
  detailColumn: { flex: 1, justifyContent: 'center', paddingHorizontal: scaleWidth(12), paddingVertical: scaleHeight(8), borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: '#E6E6E6', backgroundColor: Colors.white },
  amountColumn: { flex: 1, justifyContent: 'center', paddingHorizontal: scaleWidth(12), paddingVertical: scaleHeight(8) },
  detailLabel: { fontSize: scaleFont(13), fontFamily: Fonts.GilroyMedium, color: Colors.darkblack },
  input: { borderWidth: 1, borderColor: '#E6E6E6', borderRadius: scaleWidth(6), paddingHorizontal: scaleWidth(10), paddingVertical: scaleHeight(8), fontSize: scaleFont(13), fontFamily: Fonts.GilroyMedium, color: Colors.darkblack, backgroundColor: Colors.white, minHeight: scaleHeight(36) },
  readOnlyInput: { backgroundColor: '#F5F5F5', color: Colors.graybase },
  dropdownContainer: { marginBottom: 0 },
  datePickerContainer: { marginBottom: 0, marginTop: 0 },
  buttonContainer: { flexDirection: 'row', gap: scaleWidth(12), padding: scaleWidth(16), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E6E6E6' },
  actionButton: { flex: 1, paddingVertical: scaleHeight(12), borderRadius: scaleWidth(8), alignItems: 'center', justifyContent: 'center' },
  cancelButton: { backgroundColor: Colors.white, borderWidth: 1, borderColor: '#D0D0D0' },
  submitButton: { backgroundColor: Colors.green },
  cancelButtonText: { fontSize: scaleFont(14), fontFamily: Fonts.GilroySemiBold, color: Colors.darkblack },
  submitButtonText: { fontSize: scaleFont(14), fontFamily: Fonts.GilroySemiBold, color: Colors.white },
});
