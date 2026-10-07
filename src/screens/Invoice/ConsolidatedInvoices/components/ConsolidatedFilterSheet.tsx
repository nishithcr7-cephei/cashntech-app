import React, {useEffect, useState} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {
  ADMIN_STATUS_OPTIONS,
  INVOICE_STATUS_OPTIONS,
} from '@constants/invoiceStatuses';
import type {ProductCode} from '@store/product/product.types';
import type {
  ConsolidatedProductOption,
  ConsolidatedStatusFilterDraft,
} from '../useConsolidatedInvoices';

type GroupKey = 'product' | 'invoice' | 'admin';

type Option = {value: string; label: string};

type Props = {
  visible: boolean;
  productOptions: ConsolidatedProductOption[];
  productCodes: ProductCode[];
  invoiceStatuses: string[];
  adminStatuses: string[];
  onClose: () => void;
  onApply: (draft: ConsolidatedStatusFilterDraft) => void;
  onClearAll: () => void;
};

const GROUP_TITLES: Record<GroupKey, string> = {
  product: 'Product',
  invoice: 'Invoice Status',
  admin: 'Admin Status',
};

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter(v => v !== value) : [...list, value];

const toOptions = (values: readonly string[]): Option[] =>
  values.map(value => ({value, label: value}));

const Checkbox: React.FC<{checked: boolean}> = ({checked}) => (
  <View style={[styles.checkbox, checked && styles.checkboxOn]}>
    {checked ? (
      <FontAwesome6
        name="check"
        iconStyle="solid"
        size={scaleFont(10)}
        color={Colors.white}
      />
    ) : null}
  </View>
);

export const ConsolidatedFilterSheet: React.FC<Props> = ({
  visible,
  productOptions,
  productCodes,
  invoiceStatuses,
  adminStatuses,
  onClose,
  onApply,
  onClearAll,
}) => {
  const [activeGroup, setActiveGroup] = useState<GroupKey | null>(null);
  const [draft, setDraft] = useState<Record<GroupKey, string[]>>({
    product: productCodes,
    invoice: invoiceStatuses,
    admin: adminStatuses,
  });

  // Discard unapplied edits each time the sheet reopens.
  useEffect(() => {
    if (visible) {
      setActiveGroup(null);
      setDraft({
        product: productCodes,
        invoice: invoiceStatuses,
        admin: adminStatuses,
      });
    }
  }, [visible, productCodes, invoiceStatuses, adminStatuses]);

  const groupOptions: Record<GroupKey, Option[]> = {
    product: productOptions.map(option => ({
      value: option.code,
      label: option.label,
    })),
    invoice: toOptions(INVOICE_STATUS_OPTIONS),
    admin: toOptions(ADMIN_STATUS_OPTIONS),
  };

  const setGroup = (group: GroupKey, values: string[]) =>
    setDraft(prev => ({...prev, [group]: values}));

  const isAllSelected = (group: GroupKey) =>
    groupOptions[group].length > 0 &&
    groupOptions[group].every(option => draft[group].includes(option.value));

  const toggleWholeGroup = (group: GroupKey) =>
    setGroup(
      group,
      draft[group].length ? [] : groupOptions[group].map(option => option.value),
    );

  const apply = () =>
    onApply({
      productCodes: draft.product as ProductCode[],
      invoiceStatuses: draft.invoice,
      adminStatuses: draft.admin,
    });

  const renderGroupList = () =>
    (Object.keys(GROUP_TITLES) as GroupKey[]).map(group => {
      const count = draft[group].length;
      return (
        <View key={group} style={styles.row}>
          <TouchableOpacity
            style={styles.checkboxHit}
            onPress={() => toggleWholeGroup(group)}
            hitSlop={8}
            accessibilityRole="checkbox"
            accessibilityState={{checked: count > 0}}
            accessibilityLabel={`${GROUP_TITLES[group]}, select all`}>
            <Checkbox checked={count > 0} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rowMain}
            activeOpacity={0.7}
            onPress={() => setActiveGroup(group)}
            accessibilityRole="button"
            accessibilityLabel={`${GROUP_TITLES[group]}${count ? `, ${count} selected` : ''}`}>
            <Text style={styles.rowText}>{GROUP_TITLES[group]}</Text>
            {count ? (
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{count}</Text>
              </View>
            ) : null}
            <FontAwesome6
              name="chevron-right"
              iconStyle="solid"
              size={scaleFont(12)}
              color={Colors.graybase}
            />
          </TouchableOpacity>
        </View>
      );
    });

  const renderGroupOptions = (group: GroupKey) => {
    const options = groupOptions[group];
    const allOn = isAllSelected(group);
    return (
      <>
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
          onPress={() =>
            setGroup(group, allOn ? [] : options.map(option => option.value))
          }
          accessibilityRole="checkbox"
          accessibilityState={{checked: allOn}}>
          <Checkbox checked={allOn} />
          <Text style={[styles.rowText, styles.selectAllText]}>Select all</Text>
        </TouchableOpacity>
        {options.length === 0 ? (
          <Text style={styles.emptyText}>No options available</Text>
        ) : (
          options.map(option => {
            const isOn = draft[group].includes(option.value);
            return (
              <TouchableOpacity
                key={option.value}
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => setGroup(group, toggle(draft[group], option.value))}
                accessibilityRole="checkbox"
                accessibilityState={{checked: isOn}}>
                <Checkbox checked={isOn} />
                <Text style={styles.rowText}>{option.label}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => (activeGroup ? setActiveGroup(null) : onClose())}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            {activeGroup ? (
              <TouchableOpacity
                onPress={() => setActiveGroup(null)}
                hitSlop={10}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Back to filters">
                <FontAwesome6
                  name="chevron-left"
                  iconStyle="solid"
                  size={scaleFont(14)}
                  color={Colors.darkblack}
                />
              </TouchableOpacity>
            ) : null}
            <Text style={styles.title}>
              {activeGroup ? GROUP_TITLES[activeGroup] : 'Filters'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {activeGroup ? renderGroupOptions(activeGroup) : renderGroupList()}
          </ScrollView>

          <View style={styles.actions}>
            {activeGroup ? (
              <>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => setGroup(activeGroup, [])}>
                  <Text style={styles.linkText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  activeOpacity={0.7}
                  onPress={() => setActiveGroup(null)}>
                  <Text style={styles.applyText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.linkButton} onPress={onClearAll}>
                  <Text style={styles.linkText}>Clear all</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  activeOpacity={0.7}
                  onPress={apply}>
                  <Text style={styles.applyText}>Apply</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: scaleWidth(16),
    borderTopRightRadius: scaleWidth(16),
    paddingTop: scaleHeight(10),
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(20),
    maxHeight: '80%',
  },
  handle: {
    alignSelf: 'center',
    width: scaleWidth(40),
    height: scaleHeight(4),
    borderRadius: scaleWidth(2),
    backgroundColor: '#E0E0E0',
    marginBottom: scaleHeight(12),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
  },
  backButton: {
    marginRight: scaleWidth(10),
  },
  title: {
    flex: 1,
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  close: {
    fontSize: scaleFont(16),
    color: Colors.graybase,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEEEE',
  },
  checkboxHit: {
    paddingRight: scaleWidth(2),
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
    marginLeft: scaleWidth(12),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  selectAllText: {
    fontFamily: Fonts.GilroySemiBold,
  },
  checkbox: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(4),
    borderWidth: 1.5,
    borderColor: '#9AA0A6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxOn: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  countPill: {
    minWidth: scaleWidth(20),
    paddingHorizontal: scaleWidth(6),
    paddingVertical: scaleHeight(1),
    marginRight: scaleWidth(10),
    borderRadius: scaleWidth(10),
    backgroundColor: '#FFE5E5',
    alignItems: 'center',
  },
  countPillText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  emptyText: {
    paddingVertical: scaleHeight(16),
    textAlign: 'center',
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scaleHeight(16),
  },
  linkButton: {
    paddingVertical: scaleHeight(10),
    paddingRight: scaleWidth(16),
  },
  linkText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
    textDecorationLine: 'underline',
  },
  applyButton: {
    minWidth: scaleWidth(120),
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(24),
    borderRadius: scaleWidth(10),
    backgroundColor: '#1E7B34',
    alignItems: 'center',
  },
  applyText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
});
