import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {SafeText as Text} from '@components/SafeText';
import {DateNTimePicker} from '@components/DateNTimePicker/DateNTimePicker';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {
  cloneFilterSheetValue,
  filterOptions,
  FilterSheetGroup,
  FilterSheetMultiGroup,
  FilterSheetSingleGroup,
  FilterSheetValue,
  isAllSelected,
  isoToDisplayDate,
  parseIsoDate,
  singleSelectionLabel,
  toggleSelectAll,
  toggleValue,
  toggleWholeGroup,
  toIsoDate,
} from './filterSheet.utils';

export * from './filterSheet.utils';

type Props = {
  visible: boolean;
  title?: string;
  groups: FilterSheetGroup[];
  /** Applied selection; copied into a draft each time the sheet opens. */
  value: FilterSheetValue;
  onClose: () => void;
  onApply: (draft: FilterSheetValue) => void;
  onClearAll: () => void;
};

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

const Radio: React.FC<{checked: boolean}> = ({checked}) => (
  <View style={[styles.radio, checked && styles.radioOn]}>
    {checked ? <View style={styles.radioDot} /> : null}
  </View>
);

const Chevron = () => (
  <FontAwesome6
    name="chevron-right"
    iconStyle="solid"
    size={scaleFont(12)}
    color={Colors.graybase}
  />
);

/**
 * Bottom-sheet filter: main list of groups → tap a group to edit its options.
 * Edits stay in a draft until Apply; reopening the sheet discards them.
 */
export const FilterSheet: React.FC<Props> = ({
  visible,
  title = 'Filters',
  groups,
  value,
  onClose,
  onApply,
  onClearAll,
}) => {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<FilterSheetValue>(() =>
    cloneFilterSheetValue(value),
  );
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) {
      setActiveKey(null);
      setQuery('');
      setDraft(cloneFilterSheetValue(value));
    }
    // Reset only when the sheet opens; `value` is read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const activeGroup = useMemo(
    () => groups.find(group => group.key === activeKey) ?? null,
    [groups, activeKey],
  );

  const selectedOf = (key: string) => draft[key] ?? [];
  const setGroup = (key: string, values: string[]) =>
    setDraft(prev => ({...prev, [key]: values}));

  const openGroup = (key: string) => {
    setQuery('');
    setActiveKey(key);
  };

  const renderMultiRow = (group: FilterSheetMultiGroup) => {
    const count = selectedOf(group.key).length;
    return (
      <View key={group.key} style={styles.row}>
        <TouchableOpacity
          style={styles.checkboxHit}
          onPress={() =>
            setGroup(group.key, toggleWholeGroup(group.options, selectedOf(group.key)))
          }
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{checked: count > 0}}
          accessibilityLabel={`${group.title}, select all`}>
          <Checkbox checked={count > 0} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rowMain}
          activeOpacity={0.7}
          onPress={() => openGroup(group.key)}
          accessibilityRole="button"
          accessibilityLabel={`${group.title}${count ? `, ${count} selected` : ''}`}>
          <Text style={styles.rowText}>{group.title}</Text>
          {count ? (
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{count}</Text>
            </View>
          ) : null}
          <Chevron />
        </TouchableOpacity>
      </View>
    );
  };

  const renderSingleRow = (group: FilterSheetSingleGroup) => {
    const label = singleSelectionLabel(group, selectedOf(group.key));
    const hasValue = !!selectedOf(group.key).length;
    return (
      <TouchableOpacity
        key={group.key}
        style={[styles.row, group.disabled && styles.rowDisabled]}
        activeOpacity={0.7}
        disabled={group.disabled}
        onPress={() => openGroup(group.key)}
        accessibilityRole="button"
        accessibilityState={{disabled: !!group.disabled}}
        accessibilityLabel={`${group.title}: ${label}`}>
        <Text style={[styles.rowText, styles.rowTextNoIndent]}>{group.title}</Text>
        <Text
          style={[styles.valueText, hasValue && styles.valueTextOn]}
          numberOfLines={1}>
          {label}
        </Text>
        {group.disabled ? null : <Chevron />}
      </TouchableOpacity>
    );
  };

  const renderDateRow = (group: FilterSheetGroup) => {
    const iso = selectedOf(group.key)[0] ?? '';
    return (
      <View key={group.key} style={styles.dateRow}>
        <DateNTimePicker
          label={group.title}
          mode="date"
          placeholder="DD-MM-YYYY"
          value={isoToDisplayDate(iso)}
          datePickerProps={{date: parseIsoDate(iso) ?? new Date(), maximumDate: new Date()}}
          onConfirm={date => setGroup(group.key, [toIsoDate(date)])}
        />
        {iso ? (
          <TouchableOpacity
            style={styles.dateClear}
            onPress={() => setGroup(group.key, [])}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Clear ${group.title}`}>
            <Text style={styles.linkText}>Clear date</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const renderGroupList = () =>
    groups.map(group => {
      if (group.type === 'multi') {
        return renderMultiRow(group);
      }
      if (group.type === 'single') {
        return renderSingleRow(group);
      }
      return renderDateRow(group);
    });

  const renderMultiOptions = (group: FilterSheetMultiGroup) => {
    const selected = selectedOf(group.key);
    const allOn = isAllSelected(group.options, selected);
    return (
      <>
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
          onPress={() => setGroup(group.key, toggleSelectAll(group.options, selected))}
          accessibilityRole="checkbox"
          accessibilityState={{checked: allOn}}>
          <Checkbox checked={allOn} />
          <Text style={[styles.rowText, styles.boldText]}>Select all</Text>
        </TouchableOpacity>
        {group.options.length === 0 ? (
          <Text style={styles.emptyText}>No options available</Text>
        ) : (
          group.options.map(option => {
            const isOn = selected.includes(option.value);
            return (
              <TouchableOpacity
                key={option.value}
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => setGroup(group.key, toggleValue(selected, option.value))}
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

  const renderSingleOptions = (group: FilterSheetSingleGroup) => {
    const selectedValue = selectedOf(group.key)[0] ?? '';
    const visibleOptions = filterOptions(group.options, query);
    const choose = (next: string) => {
      setGroup(group.key, next ? [next] : []);
      setActiveKey(null);
    };
    return (
      <>
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
          onPress={() => choose('')}
          accessibilityRole="radio"
          accessibilityState={{checked: !selectedValue}}>
          <Radio checked={!selectedValue} />
          <Text style={[styles.rowText, styles.boldText]}>{group.allLabel}</Text>
        </TouchableOpacity>
        {group.loading && !group.options.length ? (
          <ActivityIndicator
            style={styles.loader}
            size="small"
            color={Colors.primaryColor}
          />
        ) : null}
        {!group.loading && !visibleOptions.length ? (
          <Text style={styles.emptyText}>
            {query ? 'No match found' : 'No options available'}
          </Text>
        ) : null}
        {visibleOptions.map(option => {
          const isOn = option.value === selectedValue;
          return (
            <TouchableOpacity
              key={option.value}
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => choose(option.value)}
              accessibilityRole="radio"
              accessibilityState={{checked: isOn}}>
              <Radio checked={isOn} />
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionText}>{option.label}</Text>
                {option.caption ? (
                  <Text style={styles.optionCaption}>{option.caption}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </>
    );
  };

  const showSearch =
    activeGroup?.type === 'single' && !!activeGroup.searchable;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => (activeKey ? setActiveKey(null) : onClose())}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            {activeGroup ? (
              <TouchableOpacity
                onPress={() => setActiveKey(null)}
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
            <Text style={styles.title}>{activeGroup ? activeGroup.title : title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {showSearch ? (
            <View style={styles.searchBox}>
              <FontAwesome6
                name="magnifying-glass"
                iconStyle="solid"
                size={scaleFont(12)}
                color={Colors.graybase}
              />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder={
                  (activeGroup as FilterSheetSingleGroup).searchPlaceholder ?? 'Search'
                }
                placeholderTextColor={Colors.graybase}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ) : null}

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {activeGroup?.type === 'multi'
              ? renderMultiOptions(activeGroup)
              : activeGroup?.type === 'single'
                ? renderSingleOptions(activeGroup)
                : renderGroupList()}
          </ScrollView>

          <View style={styles.actions}>
            {activeGroup ? (
              <>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => setGroup(activeGroup.key, [])}>
                  <Text style={styles.linkText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  activeOpacity={0.7}
                  onPress={() => setActiveKey(null)}>
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
                  onPress={() => onApply(draft)}>
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleHeight(40),
    paddingHorizontal: scaleWidth(12),
    borderRadius: scaleWidth(10),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: Colors.white,
    marginBottom: scaleHeight(4),
  },
  searchInput: {
    flex: 1,
    marginLeft: scaleWidth(8),
    paddingVertical: 0,
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEEEE',
  },
  rowDisabled: {
    opacity: 0.6,
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
  rowTextNoIndent: {
    marginLeft: 0,
  },
  boldText: {
    fontFamily: Fonts.GilroySemiBold,
  },
  valueText: {
    maxWidth: '55%',
    marginRight: scaleWidth(10),
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  valueTextOn: {
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  optionTextWrap: {
    flex: 1,
    marginLeft: scaleWidth(12),
  },
  optionText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  optionCaption: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  dateRow: {
    paddingBottom: scaleHeight(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEEEE',
  },
  dateClear: {
    alignSelf: 'flex-end',
    paddingTop: scaleHeight(4),
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
  radio: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(10),
    borderWidth: 1.5,
    borderColor: '#9AA0A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: Colors.primaryColor,
  },
  radioDot: {
    width: scaleWidth(10),
    height: scaleWidth(10),
    borderRadius: scaleWidth(5),
    backgroundColor: Colors.primaryColor,
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
  loader: {
    marginVertical: scaleHeight(16),
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
