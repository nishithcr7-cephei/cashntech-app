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
import {decryptValue} from '@utils/decrypt';

type MarkAsDisbursedModalProps = {
  visible: boolean;
  onClose: () => void;
  invoiceId?: string;
  invoiceAmount?: string;
  invoiceNo?: string;
  programName?: string;
  onSubmit?: (data: {
    debitFrom: string;
    creditTo: string;
    disbursedAmount: string;
    status: string;
    date: string;
    utrNo: string;
    remark: string;
    transactionNo: string;
    rejectionReason?: string;
    holdCategory?: string;
    expectedReleaseDate?: string;
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

const holdCategoryOptions = [
  {label: 'Verification Pending', value: 'Verification Pending'},
  {label: 'Insufficient Funds', value: 'Insufficient Funds'},
  {label: 'KYC Issue', value: 'KYC Issue'},
  {label: 'Other', value: 'Other'},
];

export const MarkAsDisbursedModal: React.FC<MarkAsDisbursedModalProps> = ({
  visible,
  onClose,
  invoiceId,
  invoiceAmount = '15,556',
  invoiceNo,
  programName,
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
  const [rejectionReason, setRejectionReason] = useState('');
  const [holdCategory, setHoldCategory] = useState('');
  const [expectedReleaseDate, setExpectedReleaseDate] = useState('');

  useEffect(() => {
    if (visible) {
      setDebitFrom('');
      setCreditTo('');
      setDisbursedAmount(invoiceAmount || '0.00');
      setStatus('');
      setDate('');
      setUtrNo('');
      setRemark('');
      setTransactionNo('');
      setRejectionReason('');
      setHoldCategory('');
      setExpectedReleaseDate('');
    }
  }, [visible, invoiceAmount]);

  useEffect(() => {
    // Clear specific fields when swapping statuses to avoid dirty data
    if (status !== 'Disbursed') {
      setUtrNo('');
      setTransactionNo('');
      setDate('');
    }
    if (status !== 'Hold') {
      setHoldCategory('');
      setExpectedReleaseDate('');
    }
    if (status === 'Disbursed') {
      setRejectionReason('');
      setHoldCategory('');
    }
  }, [status]);

  useEffect(() => {
    if (visible && invoiceId) {
      setAccountsLoading(true);
      invoiceApi
        .getBankAccountsForDisbursement(invoiceId)
        .then((data: any) => {
          const d = data?.data ?? data;
          const opts: {label: string; value: string}[] = [];
          const apm = d?.anchorParticipantMapping ?? d?.anchor_participant_mapping;
          const apmObj = Array.isArray(apm) ? apm[0] : apm;
          const odAccount = apmObj?.od_account_no ?? apmObj?.odAccountNo ?? '';
          const entityName = apmObj?.party?.entity_name ?? apmObj?.Party?.entityName ?? '';

          if (odAccount) {
            // Debit From remains the OD account according to previous roll-back
            const decryptedOd = decryptValue(odAccount);
            const displayDebitLabel = entityName ? `${decryptedOd} (${entityName})` : decryptedOd;
            setDebitFrom(displayDebitLabel);
          }

          const program = d?.program ?? d?.Program;
          const apiProgramName = program?.program_name ?? program?.programName ?? '';
          const finalProgName = programName || apiProgramName; // Prioritize prop from list
          const programBankDetails = program?.bank_details ?? [];
          const programAcc = Array.isArray(programBankDetails) && programBankDetails.length > 0 
                             ? programBankDetails[0]?.account_number ?? programBankDetails[0]?.accountNumber ?? '' 
                             : '';

          if (programAcc) {
            // Credit To is now based on Program details
            const decryptedPg = decryptValue(programAcc);
            const displayCreditLabel = finalProgName ? `${decryptedPg} (${finalProgName})` : decryptedPg;
            setCreditTo(displayCreditLabel);
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
    if (status === 'Disbursed') {
      if (!date) {
        Toast.show({type: 'error', text1: 'Date is required'});
        return;
      }
      if (!utrNo.trim()) {
        Toast.show({type: 'error', text1: 'UTR No is required'});
        return;
      }
      if (!transactionNo.trim()) {
        Toast.show({type: 'error', text1: 'Transaction No is required'});
        return;
      }
    }

    if (status === 'Hold') {
      if (!holdCategory) {
        Toast.show({type: 'error', text1: 'Hold Category is required'});
        return;
      }
      if (!expectedReleaseDate) {
        Toast.show({type: 'error', text1: 'Expected Release Date is required'});
        return;
      }
    }
    if (onSubmit) {
      await onSubmit({
        debitFrom,
        creditTo,
        disbursedAmount: disbursedAmount.trim(),
        status,
        date: status === 'Disbursed' ? date : status === 'Hold' ? expectedReleaseDate : '',
        utrNo: status === 'Disbursed' ? utrNo.trim() : '',
        remark: (status === 'Hold' || status === 'Disbursed' || status === 'Reject') ? remark.trim() : '',
        transactionNo: status === 'Disbursed' ? transactionNo.trim() : '',
        rejectionReason: status === 'Reject' ? remark.trim() : '',
        holdCategory,
        expectedReleaseDate,
      });
    }
    handleClose();
  };

  const getSubmitButtonStyle = () => {
    if (!status) return {backgroundColor: Colors.graybase, opacity: 0.5};
    
    // Check missing mandatory fields per status
    let isMissing = false;
    if (status === 'Disbursed') {
      if (!date || !utrNo.trim() || !transactionNo.trim() || !debitFrom) isMissing = true;
    } else if (status === 'Reject') {
      if (!remark.trim()) isMissing = true;
    } else if (status === 'Hold') {
      if (!holdCategory || !expectedReleaseDate) isMissing = true;
    }

    const baseColor = status === 'Disbursed' ? Colors.green : 
                     status === 'Reject' ? Colors.red : 
                     status === 'Hold' ? Colors.Yellow : Colors.graybase;

    return {
      backgroundColor: isMissing ? Colors.graybase : baseColor,
      opacity: isMissing ? 0.6 : 1
    };
  };

  const isSubmitDisabled =
    !status ||
    (status === 'Disbursed' &&
      (!date || !utrNo.trim() || !transactionNo.trim() || !disbursedAmount));

  const handleClose = () => {
    setDebitFrom('');
    setCreditTo('');
    setDisbursedAmount('0.00');
    setStatus('');
    setDate('');
    setUtrNo('');
    setRemark('');
    setTransactionNo('');
    setRejectionReason('');
    setHoldCategory('');
    setExpectedReleaseDate('');
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

                  {/* Debit From - Decoded Label */}
                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Debit From</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <Text style={styles.infoValueText}>{decryptValue(debitFrom) || '-'}</Text>
                    </View>
                  </View>

                  {/* Credit To - Combined String (Already Decrypted) */}
                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Credit To</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <Text style={styles.infoValueText}>{creditTo || '-'}</Text>
                    </View>
                  </View>

                  {/* Status Selection */}
                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Status</Text>
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
                </View>

                {/* Disbursement Specific Details */}
                {status === 'Disbursed' && (
                  <>
                    <View style={[styles.sectionHeader, {marginTop: scaleHeight(16)}]}>
                      <Text style={styles.sectionHeaderText}>Disbursement Details</Text>
                    </View>
                    <View style={styles.tableContainer}>
                      <View style={styles.tableRow}>
                        <View style={styles.detailColumn}>
                          <Text style={styles.detailLabel}>Disburse Amount <Text style={styles.required}>*</Text></Text>
                        </View>
                        <View style={styles.amountColumn}>
                          <TextInput
                            style={styles.input}
                            value={disbursedAmount}
                            onChangeText={setDisbursedAmount}
                            keyboardType="numeric"
                            placeholder="0.00"
                            placeholderTextColor={Colors.graybase}
                          />
                        </View>
                      </View>
                      <View style={styles.tableRow}>
                        <View style={styles.detailColumn}>
                          <Text style={styles.detailLabel}>Disburse Date <Text style={styles.required}>*</Text></Text>
                        </View>
                        <View style={styles.amountColumn}>
                          <DateNTimePicker
                            label=""
                            mode="date"
                            value={date}
                            datePickerProps={{maximumDate: new Date()}} // Restricted to Today or Past
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
                      <View style={styles.tableRow}>
                        <View style={styles.detailColumn}>
                          <Text style={styles.detailLabel}>Enter UTR No <Text style={styles.required}>*</Text></Text>
                        </View>
                        <View style={styles.amountColumn}>
                          <TextInput
                            style={styles.input}
                            value={utrNo}
                            onChangeText={setUtrNo}
                            placeholder="Bank Ref No"
                            placeholderTextColor={Colors.graybase}
                          />
                        </View>
                      </View>
                      <View style={styles.tableRow}>
                        <View style={styles.detailColumn}>
                          <Text style={styles.detailLabel}>Enter Transaction No <Text style={styles.required}>*</Text></Text>
                        </View>
                        <View style={styles.amountColumn}>
                          <TextInput
                            style={styles.input}
                            value={transactionNo}
                            onChangeText={setTransactionNo}
                            placeholder="Internal Ref No"
                            placeholderTextColor={Colors.graybase}
                          />
                        </View>
                      </View>
                    </View>
                  </>
                )}

                {/* Remarks Field - Very Bottom Placement */}
                {(status === 'Disbursed' || status === 'Hold' || status === 'Reject') && (
                  <>
                    <View style={[styles.sectionHeader, {marginTop: scaleHeight(16)}]}>
                      <Text style={styles.sectionHeaderText}>Final Remarks</Text>
                    </View>
                    <View style={styles.tableContainer}>
                      <View style={[styles.tableRow, {borderBottomWidth: 0}]}>
                        <View style={styles.detailColumn}>
                          <Text style={styles.detailLabel}>Remarks</Text>
                        </View>
                        <View style={styles.amountColumn}>
                          <TextInput
                            style={[styles.input, {height: scaleHeight(80), textAlignVertical: 'top'}]}
                            value={remark}
                            onChangeText={setRemark}
                            placeholder="Enter any final comments..."
                            placeholderTextColor={Colors.graybase}
                            multiline
                          />
                        </View>
                      </View>
                    </View>
                  </>
                )}
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.submitButton, getSubmitButtonStyle()]}
                  disabled={isSubmitDisabled}
                  onPress={handleSubmit}>
                  <Text style={styles.submitButtonText}>
                    {status === 'Reject' ? 'Reject' : status === 'Hold' ? 'Hold Transaction' : 'Submit'}
                  </Text>
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
  infoValueText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
});
