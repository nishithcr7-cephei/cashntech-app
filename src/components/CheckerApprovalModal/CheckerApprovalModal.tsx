import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

export type CheckerApprovalEntry = {
  id: string;
  approvedBy: string;
  approvalDate: string;
  status: 'Approved' | 'Rejected';
  role?: string;
  approvalLevel?: string;
  action?: string;
  remark?: string;
  rejectionReason?: string;
};

type CheckerApprovalModalProps = {
  visible: boolean;
  onClose: () => void;
  approvalEntries?: CheckerApprovalEntry[];
  loading?: boolean;
  invoiceNo?: string;
};

function RowLabelValue({
  label,
  value,
  valueNumberOfLines,
  multiline = false,
}: {
  label: string;
  value: string;
  valueNumberOfLines?: number;
  multiline?: boolean;
}) {
  return (
    <View style={[styles.labelValueRow, multiline && styles.labelValueRowTop]}>
      <Text style={styles.labelText}>{label}</Text>
      <Text style={styles.valueText} numberOfLines={valueNumberOfLines}>
        {value}
      </Text>
    </View>
  );
}

export const CheckerApprovalModal: React.FC<CheckerApprovalModalProps> = ({
  visible,
  onClose,
  approvalEntries = [],
  loading = false,
  invoiceNo,
}) => {
  const renderCard = ({ item, index }: { item: CheckerApprovalEntry; index: number }) => (
    <View style={[styles.card, index > 0 && styles.cardSpacer]}>
      <RowLabelValue
        label="User Name"
        value={item.approvedBy}
        valueNumberOfLines={2}
        multiline
      />
      <RowLabelValue label="Role" value={item.role || '-'} />
      <RowLabelValue label="Approval Level" value={item.approvalLevel ?? '-'} />
      <RowLabelValue label="Action" value={item.action || item.status} />
      <RowLabelValue
        label="Remark"
        value={item.remark || '-'}
        valueNumberOfLines={3}
        multiline
      />
      <RowLabelValue
        label="Rejection Reason"
        value={item.rejectionReason || '-'}
        valueNumberOfLines={3}
        multiline
      />
      <RowLabelValue label="Date" value={item.approvalDate} />
    </View>
  );

  const keyExtractor = (item: CheckerApprovalEntry) => item.id;

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
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {invoiceNo ? `Invoice No: ${invoiceNo}` : 'Approval History'}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="large" color={Colors.primaryColor} />
                    <Text style={styles.loadingText}>Loading approval history...</Text>
                  </View>
                ) : (
                  <FlatList
                    data={approvalEntries}
                    renderItem={renderCard}
                    keyExtractor={keyExtractor}
                    style={styles.listContainer}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                      <View style={styles.emptyRow}>
                        <Text style={styles.emptyText}>No approval history</Text>
                      </View>
                    }
                  />
                )}
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
    maxHeight: '85%',
    minHeight: scaleHeight(220),
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
    minHeight: scaleHeight(140),
    maxHeight: scaleHeight(450),
  },
  listContainer: {
    maxHeight: scaleHeight(360),
  },
  listContent: {
    paddingBottom: scaleHeight(16),
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(10),
    padding: scaleWidth(14),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
  },
  cardSpacer: {
    marginTop: scaleHeight(12),
  },
  labelValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleHeight(6),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  labelValueRowTop: {
    alignItems: 'flex-start',
  },
  labelText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    flex: 1,
    marginRight: scaleWidth(8),
  },
  valueText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    flex: 1,
    textAlign: 'right',
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(12),
    alignSelf: 'flex-end',
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
  emptyRow: {
    flex: 1,
    minHeight: scaleHeight(100),
    padding: scaleHeight(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
  },
  loadingRow: {
    padding: scaleHeight(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: scaleHeight(12),
    fontSize: scaleFont(14),
    color: Colors.graybase,
  },
});
