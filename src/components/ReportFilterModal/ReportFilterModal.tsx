import React, {useEffect, useMemo, useState} from 'react';
import {
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import moment from 'moment';
import {LeftChevron, Tick} from '@assets/Icons';
import {DateNTimePicker} from '@components/DateNTimePicker/DateNTimePicker';
import {Colors, Fonts} from '@constants/index';
import fontWeight from '@constants/FontWeight';
import {fetchUserScopeRequest} from '@store/programSelection/programSelection.slice';
import {selectScopeData, selectScopeLoading} from '@store/programSelection/programSelection.selector';
import {selectActiveProductCode} from '@store/product/product.selectors';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {
  EMPTY_REPORT_API_FILTER,
  formatReportApiDate,
  getPresetDateRange,
  parseReportApiDate,
  REPORT_RANGE_PRESET_LABELS,
  type ReportApiFilterState,
  type ReportRangePreset,
} from '@utils/reportFilterPayload';
import {
  getReportProgramOptions,
  type ReportProgramOption,
} from '@utils/reportProgramOptions';

type FilterCategory = 'range' | 'program';

type ReportFilterModalProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: ReportApiFilterState) => void;
  onClearAll?: () => void;
  appliedFilters: ReportApiFilterState;
};

const RANGE_PRESETS: ReportRangePreset[] = [
  'last_1_month',
  'last_3_months',
  'last_6_months',
  'last_1_year',
  'custom',
];

export const ReportFilterModal: React.FC<ReportFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  onClearAll,
  appliedFilters,
}) => {
  const dispatch = useDispatch();
  const scopeData = useSelector(selectScopeData);
  const scopeLoading = useSelector(selectScopeLoading);
  const activeProductCode = useSelector(selectActiveProductCode);
  const programOptions = useMemo(
    () => getReportProgramOptions(scopeData, activeProductCode),
    [scopeData, activeProductCode],
  );

  const [activeCategory, setActiveCategory] = useState<FilterCategory>('range');
  const [draft, setDraft] = useState<ReportApiFilterState>(EMPTY_REPORT_API_FILTER);
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  useEffect(() => {
    if (visible) {
      setDraft({...appliedFilters, programIds: [...appliedFilters.programIds]});
      setCustomFrom(parseReportApiDate(appliedFilters.startDate));
      setCustomTo(parseReportApiDate(appliedFilters.endDate));
      if (!scopeData && !scopeLoading) {
        dispatch(fetchUserScopeRequest());
      }
    }
  }, [visible, appliedFilters, scopeData, scopeLoading, dispatch]);

  const toggleCategoryEnabled = (category: FilterCategory) => {
    setDraft(prev => {
      if (category === 'range') {
        const nextEnabled = !prev.rangeEnabled;
        if (nextEnabled && !prev.startDate && prev.rangePreset !== 'custom') {
          const preset = getPresetDateRange(prev.rangePreset);
          return {
            ...prev,
            rangeEnabled: true,
            startDate: preset.startDate,
            endDate: preset.endDate,
          };
        }
        return {...prev, rangeEnabled: nextEnabled};
      }
      return {...prev, programEnabled: !prev.programEnabled};
    });
  };

  const selectPreset = (preset: ReportRangePreset) => {
    if (preset === 'custom') {
      setDraft(prev => ({
        ...prev,
        rangePreset: preset,
        rangeEnabled: true,
      }));
      return;
    }
    const {startDate, endDate} = getPresetDateRange(preset);
    setDraft(prev => ({
      ...prev,
      rangePreset: preset,
      rangeEnabled: true,
      startDate,
      endDate,
    }));
  };

  const toggleProgram = (programId: string) => {
    setDraft(prev => {
      const ids = prev.programIds.includes(programId)
        ? prev.programIds.filter(id => id !== programId)
        : [...prev.programIds, programId];
      return {
        ...prev,
        programEnabled: ids.length > 0 ? true : prev.programEnabled,
        programIds: ids,
      };
    });
  };

  const handleClearAll = () => {
    setDraft(EMPTY_REPORT_API_FILTER);
    setCustomFrom(undefined);
    setCustomTo(undefined);
    onClearAll?.();
    onClose();
  };

  const handleApply = () => {
    let next = {...draft};
    if (next.rangeEnabled && next.rangePreset === 'custom') {
      if (customFrom && customTo) {
        next = {
          ...next,
          startDate: formatReportApiDate(customFrom),
          endDate: formatReportApiDate(customTo),
        };
      }
    }
    onApply(next);
    onClose();
  };

  const renderRangePanel = () => (
    <ScrollView style={styles.optionsScroll} showsVerticalScrollIndicator>
      {RANGE_PRESETS.map(preset => {
        const selected = draft.rangePreset === preset;
        return (
          <View key={preset}>
            <TouchableOpacity
              style={styles.radioRow}
              onPress={() => selectPreset(preset)}>
              <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                {selected ? <View style={styles.radioInner} /> : null}
              </View>
              <Text style={styles.optionText}>
                {REPORT_RANGE_PRESET_LABELS[preset]}
              </Text>
            </TouchableOpacity>
            {preset === 'custom' && selected ? (
              <View style={styles.customDateBlock}>
                <DateNTimePicker
                  label="From Date"
                  mode="date"
                  placeholder="DD-MM-YYYY"
                  value={
                    customFrom
                      ? moment(customFrom).format('DD-MM-YYYY')
                      : ''
                  }
                  onConfirm={date => {
                    setCustomFrom(date);
                    setDraft(prev => ({
                      ...prev,
                      rangeEnabled: true,
                      startDate: formatReportApiDate(date),
                    }));
                  }}
                />
                <DateNTimePicker
                  label="To Date"
                  mode="date"
                  placeholder="DD-MM-YYYY"
                  value={
                    customTo ? moment(customTo).format('DD-MM-YYYY') : ''
                  }
                  onConfirm={date => {
                    setCustomTo(date);
                    setDraft(prev => ({
                      ...prev,
                      rangeEnabled: true,
                      endDate: formatReportApiDate(date),
                    }));
                  }}
                />
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );

  const renderProgramItem = ({item}: {item: ReportProgramOption}) => {
    const isSelected = draft.programIds.includes(item.id);
    return (
      <TouchableOpacity
        style={styles.optionRow}
        onPress={() => toggleProgram(item.id)}>
        <View style={[styles.checkbox, isSelected && styles.checked]}>
          {isSelected ? <Tick width={14} height={14} stroke={Colors.white} /> : null}
        </View>
        <Text style={styles.optionText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderProgramPanel = () => {
    if (scopeLoading && programOptions.length === 0) {
      return (
        <View style={styles.emptyPrograms}>
          <Text style={styles.emptyProgramsText}>Loading programs...</Text>
        </View>
      );
    }
    if (programOptions.length === 0) {
      return (
        <View style={styles.emptyPrograms}>
          <Text style={styles.emptyProgramsText}>No programs available.</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={programOptions}
        keyExtractor={item => item.id}
        renderItem={renderProgramItem}
        contentContainerStyle={styles.programListContent}
      />
    );
  };

  const renderCategoryRow = (
    category: FilterCategory,
    label: string,
  ) => {
    const isActive = activeCategory === category;
    const isEnabled =
      category === 'range' ? draft.rangeEnabled : draft.programEnabled;
    return (
      <TouchableOpacity
        style={[styles.menuItem, isActive && styles.menuItemActive]}
        onPress={() => setActiveCategory(category)}>
        <TouchableOpacity
          style={styles.menuCheckboxHit}
          onPress={() => toggleCategoryEnabled(category)}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <View style={[styles.checkbox, isEnabled && styles.checked]}>
            {isEnabled ? (
              <Tick width={14} height={14} stroke={Colors.white} />
            ) : null}
          </View>
        </TouchableOpacity>
        <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
          {label}
        </Text>
        <Text style={styles.menuChevron}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
      presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <LeftChevron width={14} height={14} />
            <Text style={styles.headerTitle}>Filters</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.sideMenu}>
            {renderCategoryRow('range', 'Range')}
            {renderCategoryRow('program', 'Program')}
          </View>
          <View style={styles.optionsContainer}>
            {activeCategory === 'range' ? renderRangePanel() : renderProgramPanel()}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    padding: scaleWidth(16),
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.lightGray,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scaleWidth(8),
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontFamily: Fonts.GilroySemiBold,
    marginLeft: scaleWidth(12),
    color: Colors.darkblack,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sideMenu: {
    width: scaleWidth(130),
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Colors.lightGray,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(14),
    paddingHorizontal: scaleWidth(10),
  },
  menuItemActive: {
    backgroundColor: '#F5F5F5',
  },
  menuCheckboxHit: {
    marginRight: scaleWidth(6),
  },
  menuText: {
    flex: 1,
    fontSize: scaleFont(14),
    color: Colors.gray500,
    fontFamily: Fonts.GilroyMedium,
  },
  menuTextActive: {
    color: Colors.primaryColor,
    fontFamily: Fonts.GilroySemiBold,
  },
  menuChevron: {
    fontSize: scaleFont(18),
    color: Colors.graybase,
  },
  optionsContainer: {
    flex: 1,
    padding: scaleWidth(16),
  },
  optionsScroll: {
    flex: 1,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
  },
  radioOuter: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(10),
    borderWidth: 2,
    borderColor: Colors.graybase,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(10),
  },
  radioOuterSelected: {
    borderColor: Colors.primaryColor,
  },
  radioInner: {
    width: scaleWidth(10),
    height: scaleWidth(10),
    borderRadius: scaleWidth(5),
    backgroundColor: Colors.primaryColor,
  },
  customDateBlock: {
    marginLeft: scaleWidth(30),
    marginBottom: scaleHeight(12),
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(14),
  },
  checkbox: {
    justifyContent: 'center',
    alignItems: 'center',
    width: scaleWidth(18),
    height: scaleWidth(18),
    borderWidth: 1,
    borderColor: Colors.graybase,
    borderRadius: scaleWidth(3),
  },
  checked: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  optionText: {
    flex: 1,
    fontSize: scaleFont(15),
    marginLeft: scaleWidth(10),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
  },
  programListContent: {
    paddingBottom: scaleHeight(24),
  },
  emptyPrograms: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleWidth(24),
  },
  emptyProgramsText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scaleWidth(16),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.lightGray,
  },
  clearText: {
    color: Colors.primaryColor,
    textDecorationLine: 'underline',
    fontFamily: Fonts.GilroySemiBold,
    fontSize: scaleFont(14),
  },
  applyBtn: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(28),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(6),
  },
  applyText: {
    color: Colors.white,
    fontFamily: Fonts.GilroySemiBold,
    fontSize: scaleFont(15),
  },
});
