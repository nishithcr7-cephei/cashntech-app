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
  ActivityIndicator,
  Alert,
} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {DateNTimePicker, CustomDropdown} from '@components/index';
import {invoiceApi} from '@services/api/invoice.api';
import Toast from 'react-native-toast-message';

type MarkAsDisbursedModalProps = {
  visible: boolean;
  onClose: () => void;
  invoiceId?: string;
  invoiceAmount?: string;
  invoiceNo?: string;
  onSubmit?: (data: {
    debitFrom: string;
    creditTo: string;
    disbursedAmount: string;
    status: string;
    date: string;
    utrNo: string;
    remark: string;
    transactionNo: string;
  }) => void | Promise<void>;
};

const accountOptionsFallback = [
  {label: 'Select Account No', value: ''},
];

const statusOptions = [
  {label: 'Disbursed', value: 'Disbursed'},
  {label: 'Hold', value: 'Hold'},
  {label: 'Reject', value: 'Reject'},
];

export const MarkAsDisbursedModal: React.FC<MarkAsDisbursedModalProps> = ({
  visible,
  onClose,
  invoiceId,
  invoiceAmount = '15,556',
  invoiceNo,
  onSubmit,
}) => {
  const [accountOptions, setAccountOptions] = useState<{label: string; value: string}[]>(accountOptionsFallback);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [debitFrom, setDebitFrom] = useState('');
  const [creditTo, setCreditTo] = useState('');
  const [disbursedAmount, setDisbursedAmount] = useState(invoiceAmount || '10,000');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [utrNo, setUtrNo] = useState('');
  const [remark, setRemark] = useState('');
  const [transactionNo, setTransactionNo] = useState('');

  useEffect(() => {
    if (visible) {
      setDebitFrom('');
      setCreditTo('');
      setDisbursedAmount(invoiceAmount || '10,000');
      setStatus('');
      setDate('');
      setUtrNo('');
      setRemark('');
      setTransactionNo('');
    }
  }, [visible, invoiceAmount]);

  useEffect(() => {
    if (visible && invoiceId) {
      setAccountsLoading(true);
      invoiceApi
        .getBankAccountsForDisbursement(invoiceId)
        .then((data: any) => {
          const d = data?.data ?? data;
          const opts: {label: string; value: string}[] = [];
          const party = d?.party ?? d?.Party;
          const bankDetails = party?.party_bank_details ?? party?.partyBankDetails ?? [];
          if (Array.isArray(bankDetails)) {
            bankDetails.forEach((b: any) => {
              const acc = b?.account_number ?? b?.accountNumber ?? '';
              const name = b?.name_as_per_bank ?? b?.nameAsPerBank ?? '';
              if (acc) opts.push({label: name ? `${acc} - ${name}` : acc, value: acc});
            });
          }
          const apm = d?.anchorParticipantMapping ?? d?.anchor_participant_mapping;
          const apmObj = Array.isArray(apm) ? apm[0] : apm;
          const odAccount = apmObj?.od_account_no ?? apmObj?.odAccountNo ?? '';
          if (odAccount) {
            opts.push({label: `OD Account - ${odAccount}`, value: odAccount});
          }
          setAccountOptions(opts.length ? opts : accountOptionsFallback);
          if (opts.length > 0) {
            setDebitFrom(opts[0].value);
          }
          if (odAccount) {
            setCreditTo(odAccount);
          }
        })
        .catch((err: any) => {
          setAccountOptions(accountOptionsFallback);
          Alert.alert(
            'Bank accounts not found',
            err?.message || 'Bank accounts not found for this invoice. Please configure party bank details / OD account in backend.',
          );
        })
        .finally(() => setAccountsLoading(false));
    }
  }, [visible, invoiceId]);

  const handleSubmit = async () => {
    const amount = (disbursedAmount || '').replace(/[,\s₹]/g, '').trim();
    if (!debitFrom) {
      Toast.show({type: 'error', text1: 'Debit From is required'});
      return;
    }
    if (!amount) {
      Toast.show({type: 'error', text1: 'Disbursed Amount is required'});
      return;
    }
    if (!status) {
      Toast.show({type: 'error', text1: 'Status is required'});
      return;
    }
    if (!date) {
      Toast.show({type: 'error', text1: 'Date is required'});
      return;
    }
    if (!utrNo.trim()) {
      Toast.show({type: 'error', text1: 'UTR No is required'});
      return;
    }
    if (!remark.trim()) {
      Toast.show({type: 'error', text1: 'Remark is required'});
      return;
    }
    if (!transactionNo.trim()) {
      Toast.show({type: 'error', text1: 'Transaction No is required'});
      return;
    }
    if (onSubmit) {
      await onSubmit({
        debitFrom,
        creditTo,
        disbursedAmount: disbursedAmount.trim(),
        status,
        date,
        utrNo: utrNo.trim(),
        remark: remark.trim(),
        transactionNo: transactionNo.trim(),
      });
    }
    handleClose();
  };

  const handleClose = () => {
    setDebitFrom('');
    setCreditTo('');
    setDisbursedAmount('10,000');
    setStatus('');
    setDate('');
    setUtrNo('');
    setRemark('');
    setTransactionNo('');
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              {/* Header - Invoice No */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitleBold}>Invoice No: {invoiceNo || '-'}</Text>
              </View>

              {/* Content */}
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled>
                {/* Details Section - First view */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>Details</Text>
                </View>
                <View style={styles.tableContainer}>
                  {/* Invoice Amount - read-only */}
                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Invoice Amount</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <TextInput
                        style={[styles.input, styles.readOnlyInput]}
                        value={invoiceAmount ? `₹ ${invoiceAmount}` : ''}
                        editable={false}
                        placeholderTextColor={Colors.graybase}
                      />
                    </View>
                  </View>

                  {/* Debit From */}
                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Debit From <Text style={styles.required}>*</Text></Text>
                    </View>
                    <View style={styles.amountColumn}>
                      {accountsLoading ? (
                        <ActivityIndicator size="small" color={Colors.primaryColor} />
                      ) : (
                        <CustomDropdown
                          label=""
                          data={accountOptions}
                          value={debitFrom}
                          onChange={setDebitFrom}
                          placeholder="Value"
                          containerStyle={styles.dropdownContainer}
                          showSearch={false}
                        />
                      )}
                    </View>
                  </View>

                  {/* Credit To */}
                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Credit To</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <TextInput
                        style={[styles.input, styles.readOnlyInput]}
                        value={creditTo}
                        editable={false}
                        placeholder="Value"
                        placeholderTextColor={Colors.graybase}
                      />
                    </View>
                  </View>

                  {/* Disbursed Amount */}
                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Disbursed Amount <Text style={styles.required}>*</Text></Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <TextInput
                        style={styles.input}
                        value={disbursedAmount ? `₹ ${disbursedAmount}` : ''}
                        onChangeText={text => {
                          const amount = text.replace(/^₹\s*/, '').trim();
                          setDisbursedAmount(amount);
                        }}
                        placeholder="Value"
                        placeholderTextColor={Colors.graybase}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  {/* Status */}
                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Status <Text style={styles.required}>*</Text></Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <CustomDropdown
                        label=""
                        data={statusOptions}
                        value={status}
                        onChange={setStatus}
                        placeholder="Select status"
                        containerStyle={styles.dropdownContainer}
                        showSearch={false}
                      />
                    </View>
                  </View>

                  {/* Date */}
                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Date <Text style={styles.required}>*</Text></Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <DateNTimePicker
                        label=""
                        mode="date"
                        value={date}
                        onConfirm={(selectedDate: Date) => {
                          const day = String(selectedDate.getDate()).padStart(2, '0');
                          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                          const year = selectedDate.getFullYear();
                          setDate(`${day}-${month}-${year}`);
                        }}
                        placeholder="DD-MM-YYYY"
                        containerStyle={styles.datePickerContainer}
                      />
                    </View>
                  </View>
                </View>

                {/* Transaction Details Section - Second view */}
                <View style={[styles.sectionHeader, {marginTop: scaleHeight(16)}]}>
                  <Text style={styles.sectionHeaderText}>Transaction Details</Text>
                </View>
                <View style={styles.tableContainer}>
                  {/* UTR No */}
                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>UTR No</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <TextInput
                        style={styles.input}
                        value={utrNo}
                        onChangeText={setUtrNo}
                        placeholder="Value"
                        placeholderTextColor={Colors.graybase}
                      />
                    </View>
                  </View>

                  {/* Remark */}
                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Remark <Text style={styles.required}>*</Text></Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <TextInput
                        style={styles.input}
                        value={remark}
                        onChangeText={setRemark}
                        placeholder="Value"
                        placeholderTextColor={Colors.graybase}
                      />
                    </View>
                  </View>

                  {/* Transaction No */}
                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Transaction No <Text style={styles.required}>*</Text></Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <TextInput
                        style={styles.input}
                        value={transactionNo}
                        onChangeText={setTransactionNo}
                        placeholder="Value"
                        placeholderTextColor={Colors.graybase}
                      />
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.submitButton]}
                  onPress={handleSubmit}>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
    flexDirection: 'column',
  },
  modalHeader: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(16),
    paddingBottom: scaleHeight(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
    alignItems: 'center',
  },
  modalTitleWrap: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    textAlign: 'center',
  },
  modalTitleBold: {
    fontFamily: Fonts.GilroySemiBold,
  },
  scrollView: {
    flexShrink: 1,
  },
  scrollContent: {
    padding: scaleWidth(16),
  },
  sectionHeader: {
    backgroundColor: '#E6E6E6',
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(12),
    marginBottom: scaleHeight(4),
    borderRadius: scaleWidth(6),
  },
  sectionHeaderText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: scaleWidth(8),
    backgroundColor: '#F7F8FB',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E6E6E6',
    borderBottomWidth: 1,
    borderBottomColor: '#D0D0D0',
  },
  tableHeaderText: {
    flex: 1,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(12),
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
    minHeight: scaleHeight(50),
  },
  detailColumn: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#E6E6E6',
    backgroundColor: Colors.white,
  },
  amountColumn: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
  },
  detailLabel: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  required: {
    color: Colors.red,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: scaleWidth(6),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(8),
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    backgroundColor: Colors.white,
    minHeight: scaleHeight(36),
  },
  readOnlyInput: {
    backgroundColor: '#F5F5F5',
    color: Colors.graybase,
  },
  dropdownContainer: {
    marginBottom: 0,
  },
  datePickerContainer: {
    marginBottom: 0,
    marginTop: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: scaleWidth(12),
    padding: scaleWidth(16),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E6E6',
  },
  actionButton: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  submitButton: {
    backgroundColor: Colors.green,
  },
  cancelButtonText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  submitButtonText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
});
