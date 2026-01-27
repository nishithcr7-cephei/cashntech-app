import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

type CheckerApprovalModalProps = {
  visible: boolean;
  onClose: () => void;
  approvedBy?: string;
  approvalDate?: string;
};

export const CheckerApprovalModal: React.FC<CheckerApprovalModalProps> = ({
  visible,
  onClose,
  approvedBy = 'Company Name_Checker',
  approvalDate = 'dd-mm-yyyy',
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              {/* Header with Title and Close Button */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Checker Approval Detail</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.modalContent}>
                {/* Gray Header Bar */}
                <View style={styles.headerBar}>
                  <Text style={styles.headerText}>Approved by</Text>
                  <Text style={styles.headerText}>Approval Date</Text>
                </View>

                {/* Details Row */}
                <View style={styles.detailsRow}>
                  <Text style={styles.detailText}>{approvedBy}</Text>
                  <Text style={styles.detailText}>{approvalDate}</Text>
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#808080',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(4),
    marginBottom: scaleHeight(8),
  },
  headerText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
  },
  detailText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: '#808080',
  },
});

