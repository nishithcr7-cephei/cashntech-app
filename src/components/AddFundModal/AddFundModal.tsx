import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  TextInput,
} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {DateNTimePicker} from '@components/index';

type AddFundModalProps = {
  visible: boolean;
  onClose: () => void;
  creditAccountNo?: string | null;
  onSubmit?: (data: {
    creditTo: string;
    creditDate: string;
    creditAmount: string;
    particulars: string;
    remark: string;
  }) => void;
};

export const AddFundModal: React.FC<AddFundModalProps> = ({
  visible,
  onClose,
  creditAccountNo,
  onSubmit,
}) => {
  const [creditTo, setCreditTo] = useState('');
  const [creditDate, setCreditDate] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [particulars, setParticulars] = useState('');
  const [remark, setRemark] = useState('');

  const handleSubmit = () => {
    if (!creditTo.trim() || !creditDate || !creditAmount.trim()) {
      // TODO: Show validation error
      return;
    }

    if (onSubmit) {
      onSubmit({
        creditTo: creditTo.trim(),
        creditDate,
        creditAmount: creditAmount.trim(),
        particulars: particulars.trim(),
        remark: remark.trim(),
      });
    }
    handleClose();
  };

  const handleClose = () => {
    setCreditTo('');
    setCreditDate('');
    setCreditAmount('');
    setParticulars('');
    setRemark('');
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
              {/* Header with Title and Close Button */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Fund</Text>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.modalContent}>
                {creditAccountNo && (
                  <Text style={styles.accountText}>
                    Are you sure, you want to add fund to this Credit Account No: {creditAccountNo}
                  </Text>
                )}

                {/* Credit To */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Credit to *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter credit to"
                    placeholderTextColor={Colors.graybase}
                    value={creditTo}
                    onChangeText={setCreditTo}
                  />
                </View>

                {/* Credit Date */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Credit Date *</Text>
                  <DateNTimePicker
                    mode="date"
                    value={creditDate}
                    onChange={(date) => setCreditDate(date)}
                    placeholder="Select credit date"
                  />
                </View>

                {/* Credit Amount */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Credit Amount *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter credit amount"
                    placeholderTextColor={Colors.graybase}
                    value={creditAmount}
                    onChangeText={setCreditAmount}
                    keyboardType="numeric"
                  />
                </View>

                {/* Particulars */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Particulars</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter particulars"
                    placeholderTextColor={Colors.graybase}
                    value={particulars}
                    onChangeText={setParticulars}
                  />
                </View>

                {/* Remark */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Remark</Text>
                  <TextInput
                    style={[styles.input, styles.remarkInput]}
                    placeholder="Enter remark"
                    placeholderTextColor={Colors.graybase}
                    value={remark}
                    onChangeText={setRemark}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

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
    maxHeight: '80%',
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  modalTitle: {
    fontSize: scaleFont(18),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  closeButton: {
    width: scaleWidth(24),
    height: scaleWidth(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: scaleFont(24),
    color: Colors.darkblack,
    fontWeight: '300',
  },
  modalContent: {
    padding: scaleWidth(16),
  },
  accountText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    marginBottom: scaleHeight(16),
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: scaleHeight(16),
  },
  label: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(8),
  },
  input: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(10),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    backgroundColor: '#F7F8FB',
  },
  remarkInput: {
    minHeight: scaleHeight(80),
    paddingTop: scaleHeight(10),
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: scaleWidth(12),
    marginTop: scaleHeight(8),
  },
  actionButton: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: Colors.primaryColor,
  },
  cancelButtonText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  submitButtonText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
});
