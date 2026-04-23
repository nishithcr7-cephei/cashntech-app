import React, {useState, useEffect} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {NA_AD} from './types';
import type {InvoiceRow} from './types';

export type BulkActionType = 'approve' | 'reject' | 'verify' | 'cancel';

const BULK_ACTIONS: {value: BulkActionType; label: string}[] = [
  {value: 'approve', label: 'Approve'},
  {value: 'reject', label: 'Reject'},
  {value: 'verify', label: 'Verify'},
  {value: 'cancel', label: 'Cancel'},
];

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedRows: InvoiceRow[];
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onApply: (action: BulkActionType) => void;
};

export const SendForApprovalModal: React.FC<Props> = ({
  visible,
  onClose,
  selectedRows,
  selectedIds,
  onToggleSelection,
  onApply,
}) => {
  const [selectedAction, setSelectedAction] = useState<BulkActionType>('approve');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedAction('approve');
      setDropdownOpen(false);
    }
  }, [visible]);

  const handleApply = () => {
    onApply(selectedAction);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={e => e.stopPropagation()}>
          <Text style={styles.title}>Bulk Action</Text>
          <Text style={styles.subtitle}>
            Choose an action and apply to selected invoices. Uncheck to remove from selection.
          </Text>

          <Text style={styles.dropdownLabel}>Action</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setDropdownOpen(prev => !prev)}
            activeOpacity={0.8}>
            <Text style={styles.dropdownText}>
              {BULK_ACTIONS.find(a => a.value === selectedAction)?.label ?? 'Select action'}
            </Text>
            <Text style={styles.dropdownArrow}>{dropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {dropdownOpen && (
            <View style={styles.dropdownList}>
              {BULK_ACTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.dropdownItem, selectedAction === opt.value && styles.dropdownItemSelected]}
                  onPress={() => {
                    setSelectedAction(opt.value);
                    setDropdownOpen(false);
                  }}
                  activeOpacity={0.7}>
                  <Text style={[styles.dropdownItemText, selectedAction === opt.value && styles.dropdownItemTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.thCheck]} />
              <Text style={[styles.th, styles.thInvoice]}>Invoice No</Text>
              <Text style={[styles.th, styles.thParty]}>Party Name</Text>
              <Text style={[styles.th, styles.thAmount]}>Amount</Text>
            </View>
            {selectedRows.map(row => {
              const isSelected = selectedIds.includes(row.id);
              return (
                <TouchableOpacity
                  key={row.id}
                  activeOpacity={0.8}
                  style={styles.row}
                  onPress={() => onToggleSelection(row.id)}>
                  <View style={styles.checkWrap}>
                    <View
                      style={[
                        styles.checkboxBox,
                        isSelected && styles.checkboxBoxSelected,
                      ]}>
                      {isSelected && (
                        <Text style={styles.checkboxTick}>✓</Text>
                      )}
                    </View>
                  </View>
                  <Text
                    style={[styles.cell, styles.cellInvoice]}
                    numberOfLines={1}>
                    {row.invoiceNo}
                  </Text>
                  <Text
                    style={[styles.cell, styles.cellParty]}
                    numberOfLines={1}>
                    {row.dealerName}
                  </Text>
                  <Text style={[styles.cell, styles.cellAmount]}>{NA_AD}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.applyBtn,
                selectedIds.length === 0 && styles.btnDisabled,
              ]}
              disabled={selectedIds.length === 0}
              onPress={handleApply}>
              <Text style={styles.applyBtnText}>
                Apply {BULK_ACTIONS.find(a => a.value === selectedAction)?.label ?? selectedAction} to {selectedIds.length} invoice{selectedIds.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: scaleWidth(20),
  },
  content: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    maxHeight: '80%',
    padding: scaleWidth(16),
  },
  title: {
    fontSize: scaleFont(18),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(4),
  },
  subtitle: {
    fontSize: scaleFont(13),
    color: Colors.graybase,
    marginBottom: scaleHeight(12),
  },
  dropdownLabel: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(6),
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scaleWidth(8),
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(12),
    marginBottom: scaleHeight(12),
    backgroundColor: Colors.white,
  },
  dropdownText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  dropdownArrow: {
    fontSize: scaleFont(10),
    color: Colors.graybase,
  },
  dropdownList: {
    marginBottom: scaleHeight(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scaleWidth(8),
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  dropdownItemSelected: {
    backgroundColor: '#FFF5F5',
  },
  dropdownItemText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  dropdownItemTextSelected: {
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  scroll: {
    maxHeight: scaleHeight(280),
  },
  scrollContent: {
    paddingBottom: scaleHeight(12),
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: scaleHeight(8),
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
    marginBottom: scaleHeight(4),
  },
  th: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.graybase,
  },
  thCheck: { width: scaleWidth(28) },
  thInvoice: { flex: 1, maxWidth: scaleWidth(90) },
  thParty: { flex: 1, maxWidth: scaleWidth(100) },
  thAmount: { width: scaleWidth(60) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  checkWrap: {
    width: scaleWidth(28),
    alignItems: 'flex-start',
  },
  checkboxBox: {
    width: scaleWidth(18),
    height: scaleWidth(18),
    borderWidth: 1,
    borderColor: Colors.graybase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxSelected: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  checkboxTick: {
    color: Colors.white,
    fontSize: scaleFont(12),
    lineHeight: scaleFont(12),
  },
  cell: {
    fontSize: scaleFont(13),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
  },
  cellInvoice: {
    flex: 1,
    maxWidth: scaleWidth(90),
    marginRight: scaleWidth(6),
  },
  cellParty: {
    flex: 1,
    maxWidth: scaleWidth(100),
    marginRight: scaleWidth(6),
  },
  cellAmount: { width: scaleWidth(60) },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scaleWidth(8),
    marginTop: scaleHeight(16),
    paddingTop: scaleHeight(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E6E6',
  },
  applyBtn: {
    flex: 1,
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(12),
    borderRadius: scaleWidth(8),
    backgroundColor: Colors.green,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
  closeBtn: {
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(20),
    borderRadius: scaleWidth(8),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
