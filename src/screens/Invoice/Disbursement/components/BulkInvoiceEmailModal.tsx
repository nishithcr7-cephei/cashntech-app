import React, {useState, useEffect, useCallback} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
  Dimensions,
  ListRenderItem,
} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import Toast from 'react-native-toast-message';

export type BulkEmailInvoiceItem = {
  id: string;
  invoiceNo: string;
  programName: string;
  primaryParty: string;
  invoiceDate: string;
  dueDate: string;
  invoiceAmount: number;
};

type BulkInvoiceEmailModalProps = {
  visible: boolean;
  onClose: () => void;
  isLoading?: boolean;
  invoices: BulkEmailInvoiceItem[];
  onSubmit: (invoiceIds: string[]) => void | Promise<void>;
};

const WINDOW_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = WINDOW_HEIGHT * 0.96;

const formatAmount = (amount: number) =>
  amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});

export const BulkInvoiceEmailModal: React.FC<BulkInvoiceEmailModalProps> = ({
  visible,
  onClose,
  isLoading = false,
  invoices,
  onSubmit,
}) => {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible && invoices.length > 0) {
      setCheckedIds(new Set(invoices.map(inv => inv.id)));
    } else if (!visible) {
      setCheckedIds(new Set());
    }
  }, [visible, invoices]);

  const toggleChecked = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allChecked = invoices.length > 0 && invoices.every(inv => checkedIds.has(inv.id));

  const handleToggleSelectAll = () => {
    if (allChecked) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(invoices.map(inv => inv.id)));
    }
  };

  const checkedCount = invoices.filter(inv => checkedIds.has(inv.id)).length;
  const checkedTotal = invoices
    .filter(inv => checkedIds.has(inv.id))
    .reduce((sum, inv) => sum + inv.invoiceAmount, 0);

  const handleSubmit = async () => {
    if (isLoading) return;
    const ids = invoices.filter(inv => checkedIds.has(inv.id)).map(inv => inv.id);
    if (ids.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'Select at least one invoice to send mail',
      });
      return;
    }
    await onSubmit(ids);
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const renderInfoRow = (label: string, value: string) => (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value || '-'}
      </Text>
    </View>
  );

  const renderInvoiceItem: ListRenderItem<BulkEmailInvoiceItem> = useCallback(
    ({item: inv, index}) => {
      const isChecked = checkedIds.has(inv.id);
      return (
        <View style={[styles.card, !isChecked && styles.cardUnchecked]}>
          <TouchableOpacity
            style={styles.cardHeader}
            activeOpacity={0.8}
            onPress={() => toggleChecked(inv.id)}>
            <View style={[styles.checkbox, isChecked && styles.checkboxSelected]}>
              {isChecked && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {inv.invoiceNo}
            </Text>
          </TouchableOpacity>

          {!isChecked ? (
            <Text style={styles.uncheckedHint}>
              Excluded — tap checkbox to include in email
            </Text>
          ) : (
            <View style={styles.infoGrid}>
              {renderInfoRow('Program Name', inv.programName)}
              {renderInfoRow('Primary Party', inv.primaryParty)}
              <View style={styles.infoRowSplit}>
                <View style={styles.infoItemHalf}>
                  {renderInfoRow('Invoice Date', inv.invoiceDate)}
                </View>
                <View style={styles.infoItemHalf}>
                  {renderInfoRow('Due Date', inv.dueDate)}
                </View>
              </View>
              {renderInfoRow('Invoice Amount', formatAmount(inv.invoiceAmount))}
            </View>
          )}
        </View>
      );
    },
    [checkedIds],
  );

  const keyExtractor = useCallback((item: BulkEmailInvoiceItem) => item.id, []);

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Bulk Invoice Email</Text>
              <Text style={styles.subtitle}>
                Send invoice emails to multiple customers at once.
              </Text>
              <Text style={styles.countLine}>
                {checkedCount} of {invoices.length} selected · Total ₹ {formatAmount(checkedTotal)}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
              <FontAwesome6 name="xmark" iconStyle="solid" size={18} color={Colors.graybase} />
            </TouchableOpacity>
          </View>

          {invoices.length > 1 && (
            <TouchableOpacity
              style={styles.selectAllRow}
              activeOpacity={0.8}
              onPress={handleToggleSelectAll}>
              <View style={[styles.checkbox, allChecked && styles.checkboxSelected]}>
                {allChecked && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <Text style={styles.selectAllText}>Select all</Text>
            </TouchableOpacity>
          )}

          <View style={styles.listWrapper}>
            <FlatList
              data={invoices}
              keyExtractor={keyExtractor}
              renderItem={renderInvoiceItem}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              initialNumToRender={6}
              maxToRenderPerBatch={8}
              windowSize={7}
              ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No invoices to send</Text>
                </View>
              }
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerBtn, styles.cancelBtn]}
              onPress={handleClose}
              disabled={isLoading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.footerBtn,
                styles.submitBtn,
                (isLoading || checkedCount === 0) && styles.submitDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading || checkedCount === 0}>
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Send Mail To Bank</Text>
                  <FontAwesome6 name="check" iconStyle="solid" size={14} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: scaleWidth(16),
    borderTopRightRadius: scaleWidth(16),
    height: SHEET_HEIGHT,
    maxHeight: SHEET_HEIGHT,
    width: '100%',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(16),
    paddingBottom: scaleHeight(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: scaleWidth(8),
  },
  title: {
    fontSize: scaleFont(18),
    fontFamily: Fonts.GilroyBold,
    color: Colors.darkblack,
  },
  subtitle: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginTop: scaleHeight(4),
  },
  countLine: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
    marginTop: scaleHeight(6),
  },
  closeBtn: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    gap: scaleWidth(10),
  },
  selectAllText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  checkbox: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(4),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  checkboxCheck: {
    color: Colors.white,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyBold,
    lineHeight: scaleFont(12),
  },
  listWrapper: {
    flex: 1,
    minHeight: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: scaleWidth(16),
    paddingBottom: scaleHeight(16),
  },
  listSeparator: {
    height: scaleHeight(12),
  },
  emptyWrap: {
    paddingVertical: scaleHeight(32),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: scaleWidth(14),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardUnchecked: {
    opacity: 0.65,
    backgroundColor: '#F9FAFB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(10),
    gap: scaleWidth(10),
  },
  indexBadge: {
    width: scaleWidth(28),
    height: scaleWidth(28),
    borderRadius: scaleWidth(14),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyBold,
    color: Colors.primaryColor,
  },
  cardTitle: {
    flex: 1,
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  uncheckedHint: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    fontStyle: 'italic',
  },
  infoGrid: {
    gap: scaleHeight(8),
  },
  infoItem: {
    marginBottom: scaleHeight(4),
  },
  infoRowSplit: {
    flexDirection: 'row',
    gap: scaleWidth(10),
  },
  infoItemHalf: {
    flex: 1,
  },
  infoLabel: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(2),
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(14),
    paddingBottom: Platform.OS === 'ios' ? scaleHeight(28) : scaleHeight(16),
    gap: scaleWidth(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    backgroundColor: Colors.white,
  },
  footerBtn: {
    flex: 1,
    height: scaleHeight(48),
    borderRadius: scaleWidth(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(8),
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: Colors.white,
  },
  cancelBtnText: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  submitBtn: {
    backgroundColor: Colors.green,
  },
  submitDisabled: {
    backgroundColor: Colors.graybase,
  },
  submitBtnText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
});
