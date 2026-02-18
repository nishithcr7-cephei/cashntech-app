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

type MarkAsDisbursedModalProps = {
  visible: boolean;
  onClose: () => void;
  invoiceAmount?: string;
  invoiceNo?: string;
  userId?: string;
  utrRefNo?: string;
  onSubmit?: (data: {
    debitFrom: string;
    disbursedAmount: string;
    status: string;
    date: string;
  }) => void;
};

// Mock data for dropdowns - replace with actual data from API/store
const accountOptions = [
  {label: 'Account 1', value: 'acc1'},
  {label: 'Account 2', value: 'acc2'},
  {label: 'Account 3', value: 'acc3'},
];

const statusOptions = [
  {label: 'Disbursed', value: 'disbursed'},
  {label: 'Pending', value: 'pending'},
  {label: 'Completed', value: 'completed'},
];

export const MarkAsDisbursedModal: React.FC<MarkAsDisbursedModalProps> = ({
  visible,
  onClose,
  invoiceAmount = '15,556',
  invoiceNo,
  userId = 'Value',
  utrRefNo = 'Value',
  onSubmit,
}) => {
  const [debitFrom, setDebitFrom] = useState('');
  const [disbursedAmount, setDisbursedAmount] = useState('10,000');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setDebitFrom('');
      setDisbursedAmount('10,000');
      setStatus('');
      setDate('');
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!debitFrom || !disbursedAmount.trim() || !status || !date) {
      // TODO: Show validation error
      return;
    }

    if (onSubmit) {
      onSubmit({
        debitFrom,
        disbursedAmount: disbursedAmount.trim(),
        status,
        date,
      });
    }
    handleClose();
  };

  const handleClose = () => {
    setDebitFrom('');
    setDisbursedAmount('10,000');
    setStatus('');
    setDate('');
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
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalSubTitle}>Are you sure, you want to</Text>
                <Text style={styles.modalTitle}>Disburs Amount?</Text>
              </View>

              {/* Content */}
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled>
                {/* Table-like structure */}
                <View style={styles.tableContainer}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>Detail</Text>
                    <Text style={styles.tableHeaderText}>Amount</Text>
                  </View>

                  {/* Invoice Amount */}
                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Invoice Amount</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <TextInput
                        style={[styles.input, styles.readOnlyInput]}
                        value={`Rs.: ${invoiceAmount}`}
                        editable={false}
                        placeholderTextColor={Colors.graybase}
                      />
                    </View>
                  </View>

                  {/* Debit From */}
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

                  {/* Disbursed Amount */}
                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Disbursed Amount</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <TextInput
                        style={styles.input}
                        value={`Rs.: ${disbursedAmount}`}
                        onChangeText={text => {
                          // Remove "Rs.: " prefix if present
                          const amount = text.replace(/^Rs\.:\s*/, '');
                          setDisbursedAmount(amount);
                        }}
                        placeholder="Rs.: 0"
                        placeholderTextColor={Colors.graybase}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  {/* Status */}
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
                        placeholder="Select Status"
                        containerStyle={styles.dropdownContainer}
                        showSearch={false}
                      />
                    </View>
                  </View>

                  {/* Date */}
                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>Date</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <DateNTimePicker
                        label=""
                        mode="date"
                        value={date}
                        onConfirm={(selectedDate: Date) => {
                          // Format date as DD-MM-YYYY
                          const day = String(selectedDate.getDate()).padStart(2, '0');
                          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                          const year = selectedDate.getFullYear();
                          setDate(`${day}-${month}-${year}`);
                        }}
                        placeholder="Select Date"
                        containerStyle={styles.datePickerContainer}
                      />
                    </View>
                  </View>

                  {/* User ID */}
                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>User ID</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <TextInput
                        style={[styles.input, styles.readOnlyInput]}
                        value={userId}
                        editable={false}
                        placeholderTextColor={Colors.graybase}
                      />
                    </View>
                  </View>

                  {/* UTR / Ref. No */}
                  <View style={styles.tableRow}>
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>UTR / Ref. No</Text>
                    </View>
                    <View style={styles.amountColumn}>
                      <TextInput
                        style={[styles.input, styles.readOnlyInput]}
                        value={utrRefNo}
                        editable={false}
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
  modalSubTitle: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    textAlign: 'center',
    marginBottom: scaleHeight(2),
  },
  modalTitle: {
    fontSize: scaleFont(17),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    textAlign: 'center',
  },
  scrollView: {
    flexShrink: 1,
  },
  scrollContent: {
    padding: scaleWidth(16),
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
