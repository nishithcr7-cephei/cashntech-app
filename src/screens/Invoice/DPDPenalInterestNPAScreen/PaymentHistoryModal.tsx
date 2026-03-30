import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  FlatList,
} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

export type PaymentHistoryRow = {
  id?: string;
  paymentDate: string;
  paymentAmount: string;
  paymentMode: string;
  refNo: string;
  receivedPenalAmount: string;
  principalAmount: string;
  receivedInterest: string;
  totalPayable: string;
  totalOutstandingAmount: string;
  status: string;
};

type PaymentHistoryModalProps = {
  visible: boolean;
  onClose: () => void;
  accountNo?: string;
  /** List data from API; when provided, this is used instead of default mock */
  data?: PaymentHistoryRow[];
  loading?: boolean;
};

const defaultMockData: PaymentHistoryRow[] = [
  { id: '1', paymentDate: '01-01-2025', paymentAmount: '15,000/-', paymentMode: 'Invoice Level', refNo: '123456', receivedPenalAmount: '500/-', principalAmount: '-', receivedInterest: '2,000/-', totalPayable: '22,000/-', totalOutstandingAmount: '22,000/-', status: 'Closed' },
  { id: '2', paymentDate: '15-12-2024', paymentAmount: '10,000/-', paymentMode: 'Account Level', refNo: '123455', receivedPenalAmount: '300/-', principalAmount: '8,000/-', receivedInterest: '1,700/-', totalPayable: '18,000/-', totalOutstandingAmount: '18,000/-', status: 'Closed' },
  { id: '3', paymentDate: '28-11-2024', paymentAmount: '12,500/-', paymentMode: 'Invoice Level', refNo: '123454', receivedPenalAmount: '400/-', principalAmount: '2,000/-', receivedInterest: '10,100/-', totalPayable: '20,000/-', totalOutstandingAmount: '25,000/-', status: 'Open' },
];

function RowLabelValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.labelValueRow}>
      <Text style={styles.labelText}>{label}</Text>
      <Text style={styles.valueText}>{value}</Text>
    </View>
  );
}

export const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({
  visible,
  onClose,
  data: dataProp,
  loading = false,
  accountNo,
}) => {
  const listData = dataProp && dataProp.length > 0 ? dataProp : defaultMockData;

  const renderCard = ({ item, index }: { item: PaymentHistoryRow; index: number }) => (
    <View style={[styles.card, index > 0 && styles.cardSpacer]}>
      <RowLabelValue label="Payment Date" value={item.paymentDate} />
      <RowLabelValue label="Payment Amount" value={item.paymentAmount} />
      <RowLabelValue label="Payment Mode" value={item.paymentMode} />
      <RowLabelValue label="Ref. No" value={item.refNo} />
      <RowLabelValue label="Received Penal Amount" value={item.receivedPenalAmount} />
      <RowLabelValue label="Principal Amount" value={item.principalAmount} />
      <RowLabelValue label="Received Interest" value={item.receivedInterest} />
      <RowLabelValue label="Total Payable" value={item.totalPayable} />
      <RowLabelValue label="Total Outstanding Amount" value={item.totalOutstandingAmount} />
      <View style={styles.labelValueRow}>
        <Text style={styles.labelText}>Status</Text>
        <Text
          style={[
            styles.valueText,
            item.status === 'Closed' ? styles.statusTextClosed : styles.statusTextOpen,
          ]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  const keyExtractor = (item: PaymentHistoryRow) => item.id ?? item.refNo ?? String(Math.random());

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {accountNo ? `Invoice No: ${accountNo}` : 'Payment History'}
                </Text>
              </View>

              <View style={styles.modalContent}>
                {loading ? (
                  <View style={styles.loadingRow}>
                    <Text style={styles.loadingText}>Loading...</Text>
                  </View>
                ) : (
                  <>
                    <FlatList
                      data={listData}
                      renderItem={renderCard}
                      keyExtractor={keyExtractor}
                      style={styles.listContainer}
                      showsVerticalScrollIndicator={true}
                      persistentScrollbar={true}
                      contentContainerStyle={styles.listContent}
                      ListEmptyComponent={
                        <View style={styles.emptyRow}>
                          <Text style={styles.emptyText}>No payment history</Text>
                        </View>
                      }
                    />
                    {listData.length > 1 ? (
                      <View style={styles.scrollHint}>
                        <Text style={styles.scrollHintText}>↓ Scroll for more</Text>
                      </View>
                    ) : null}
                  </>
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
    minHeight: scaleHeight(380),
    maxHeight: '90%',
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
    width: scaleWidth(36),
    height: scaleWidth(36),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -scaleWidth(4), // Slightly pull it in or align it, but give it a larger touch surface
  },
  closeButtonText: {
    fontSize: scaleFont(28),
    color: '#666',
    fontWeight: '400',
  },
  modalContent: {
    padding: scaleWidth(16),
    flex: 1,
    minHeight: scaleHeight(320),
    maxHeight: scaleHeight(520),
  },
  listContainer: {
    flex: 1,
    minHeight: scaleHeight(280),
  },
  listContent: {
    paddingBottom: scaleHeight(40),
    flexGrow: 1,
  },
  scrollHint: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(16),
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E6E6',
  },
  scrollHintText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
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
  },
  statusClosed: { backgroundColor: '#E8F5E9' },
  statusOpen: { backgroundColor: '#FFEBEE' },
  statusText: { fontSize: scaleFont(12), fontFamily: Fonts.GilroySemiBold },
  statusTextClosed: { color: Colors.green },
  statusTextOpen: { color: Colors.red },
  loadingRow: { padding: scaleHeight(24), alignItems: 'center' },
  loadingText: { fontSize: scaleFont(14), color: Colors.graybase },
  emptyRow: { padding: scaleHeight(24), alignItems: 'center' },
  emptyText: { fontSize: scaleFont(14), color: Colors.graybase },
});
