import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

export type CheckerApprovalEntry = {
  id: string;
  approvedBy: string;
  approvalDate: string;
  status: 'Approved' | 'Rejected';
};

type CheckerApprovalModalProps = {
  visible: boolean;
  onClose: () => void;
  approvalEntries?: CheckerApprovalEntry[];
};

export const CheckerApprovalModal: React.FC<CheckerApprovalModalProps> = ({
  visible,
  onClose,
  approvalEntries = [
    {
      id: '1',
      approvedBy: 'Company Name_Checker',
      approvalDate: 'dd-mm-yyyy',
      status: 'Approved',
    },
  ],
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
                  <Text style={[styles.headerText, styles.headerTextLeft]}>
                    Approved by
                  </Text>
                  <Text style={[styles.headerText, styles.headerTextCenter]}>
                    Status
                  </Text>
                  <Text style={[styles.headerText, styles.headerTextRight]}>
                    Approval Date
                  </Text>
                </View>

                {/* Scrollable List */}
                <ScrollView
                  style={styles.listContainer}
                  showsVerticalScrollIndicator={true}>
                  {approvalEntries.map((entry, index) => (
                    <View
                      key={entry.id}
                      style={[
                        styles.detailsRow,
                        index < approvalEntries.length - 1 && styles.detailsRowBorder,
                      ]}>
                      <Text style={[styles.detailText, styles.detailTextLeft]}>
                        {entry.approvedBy}
                      </Text>
                      <View style={styles.statusContainer}>
                        <View
                          style={[
                            styles.statusBadge,
                            entry.status === 'Approved'
                              ? styles.statusApproved
                              : styles.statusRejected,
                          ]}>
                          <Text
                            style={[
                              styles.statusText,
                              entry.status === 'Approved'
                                ? styles.statusTextApproved
                                : styles.statusTextRejected,
                            ]}>
                            {entry.status}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.detailText, styles.detailTextRight]}>
                        {entry.approvalDate}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
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
    maxHeight: scaleHeight(400),
  },
  headerBar: {
    flexDirection: 'row',
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
    flex: 1,
  },
  headerTextLeft: {
    textAlign: 'left',
  },
  headerTextCenter: {
    textAlign: 'center',
  },
  headerTextRight: {
    textAlign: 'right',
  },
  listContainer: {
    maxHeight: scaleHeight(300),
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(12),
  },
  detailsRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  detailText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: '#808080',
    flex: 1,
  },
  detailTextLeft: {
    textAlign: 'left',
  },
  detailTextRight: {
    textAlign: 'right',
  },
  statusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(12),
    minWidth: scaleWidth(80),
    alignItems: 'center',
  },
  statusApproved: {
    backgroundColor: '#E8F5E9',
  },
  statusRejected: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
  },
  statusTextApproved: {
    color: Colors.green,
  },
  statusTextRejected: {
    color: Colors.red,
  },
});

