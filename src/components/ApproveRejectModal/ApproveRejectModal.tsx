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

type ApproveRejectModalProps = {
  visible: boolean;
  onClose: () => void;
  invoiceId?: string | null;
  invoiceNo?: string | null;
  invoiceDetails?: {
    subTotal?: string;
    withholdingTaxesPercent?: string;
    withholdingAmount?: string;
    finalPayableAmount?: string;
    finalDueDate?: string;
  };
  onApprove?: (invoiceId: string, remarks?: string) => void;
  onReject?: (invoiceId: string, remarks?: string) => void;
};

export const ApproveRejectModal: React.FC<ApproveRejectModalProps> = ({
  visible,
  onClose,
  invoiceId,
  invoiceNo,
  invoiceDetails,
  onApprove,
  onReject,
}) => {
  const [remarks, setRemarks] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  // Default invoice details if not provided
  const details = invoiceDetails || {
    subTotal: '10,80,025/-',
    withholdingTaxesPercent: '0.00/-',
    withholdingAmount: '0.00/-',
    finalPayableAmount: '10,80,025/-',
    finalDueDate: 'dd-mm-yyyy',
  };

  const handleApprove = () => {
    if (invoiceId && onApprove) {
      onApprove(invoiceId, remarks.trim() || undefined);
    }
    handleClose();
  };

  const handleReject = () => {
    if (invoiceId && onReject) {
      onReject(invoiceId, remarks.trim() || undefined);
    }
    handleClose();
  };

  const handleClose = () => {
    setRemarks('');
    setActionType(null);
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
                <Text style={styles.modalTitle}>Approval or reject popup</Text>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.modalContent}>
                {/* Confirmation Message */}
                <Text style={styles.confirmationText}>
                  Are you sure, you want to approve or reject this{' '}
                  <Text style={styles.invoiceNoBold}>
                    Invoice / Unique Ref. No - {invoiceNo || invoiceId || 'N/A'}
                  </Text>
                  ?
                </Text>

                {/* Invoice Details Table */}
                <View style={styles.detailsTable}>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Sub Total:</Text>
                    <Text style={styles.tableValue}>{details.subTotal}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Withholding Taxes (%):</Text>
                    <Text style={styles.tableValue}>{details.withholdingTaxesPercent}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Withholding Amount:</Text>
                    <Text style={styles.tableValue}>{details.withholdingAmount}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Final Payable Amount:</Text>
                    <Text style={styles.tableValue}>{details.finalPayableAmount}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Final Due Date:</Text>
                    <Text style={styles.tableValue}>{details.finalDueDate}</Text>
                  </View>
                </View>

                {/* Remarks Input */}
                <View style={styles.remarksContainer}>
                  <Text style={styles.remarksLabel}>Remark :</Text>
                  <TextInput
                    style={styles.remarksInput}
                    placeholder="Enter remarks..."
                    placeholderTextColor={Colors.graybase}
                    value={remarks}
                    onChangeText={setRemarks}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={handleReject}>
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={handleApprove}>
                    <Text style={styles.approveButtonText}>Approve</Text>
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
    width: '85%',
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
  confirmationText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    marginBottom: scaleHeight(16),
    lineHeight: scaleHeight(20),
  },
  invoiceNoBold: {
    fontFamily: Fonts.GilroySemiBold,
    fontWeight: '600',
  },
  detailsTable: {
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(8),
    padding: scaleWidth(12),
    marginBottom: scaleHeight(16),
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleHeight(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  tableLabel: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    flex: 1,
  },
  tableValue: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    flex: 1,
    textAlign: 'right',
  },
  remarksContainer: {
    marginBottom: scaleHeight(20),
  },
  remarksLabel: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(8),
  },
  remarksInput: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(10),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    minHeight: scaleHeight(100),
    backgroundColor: '#F7F8FB',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: scaleWidth(12),
  },
  actionButton: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: Colors.green,
  },
  rejectButton: {
    backgroundColor: '#9E9E9E', // Gray color as shown in screenshot
  },
  approveButtonText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
  rejectButtonText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
});
