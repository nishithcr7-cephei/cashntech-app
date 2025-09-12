import React from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import Colors from '@constants/Colors';
import { scaleFont, scaleHeight, scaleWidth } from '@utils/Scale';

interface FilterState {
  taskType: boolean;
  salesman: boolean;
  status: boolean;
}

interface SelectedFilters {
  taskTypes: string[];
  salesman: string;
  statuses: string[];
}

interface TaskFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  enabledFilters: FilterState;
  onToggleFilter: (filter: keyof FilterState) => void;
  selectedFilters: SelectedFilters;
  onToggleTaskType: (type: string) => void;
  onToggleStatus: (status: string) => void;
  onSalesmanChange: (salesman: string) => void;
  salesmanOptions: { label: string; value: string }[];
  onClearFilters: () => void;
  onApplyFilters: () => void;
}

const TaskFilterModal: React.FC<TaskFilterModalProps> = ({
  isOpen,
  onClose,
  enabledFilters,
  onToggleFilter,
  selectedFilters,
  onToggleTaskType,
  onToggleStatus,
  onSalesmanChange,
  salesmanOptions,
  onClearFilters,
  onApplyFilters,
}) => {
  if (!isOpen) return null;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.filterOverlay}>
        <View style={styles.filterBackground} />
        <View style={styles.dropdownContainer}>
          {/* Task Type */}
          <TouchableOpacity
            onPress={() => onToggleFilter('taskType')}
            style={styles.dropdownRow}>
            <View style={[styles.checkbox, enabledFilters.taskType && styles.checkedBox]} />
            <Text style={styles.dropdownText}>Task Type</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          {enabledFilters.taskType && (
            <View style={{marginBottom: 12}}>
              {['call', 'meeting', 'email'].map(tt => (
                <TouchableOpacity
                  key={tt}
                  onPress={() => onToggleTaskType(tt)}
                  style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                  <View
                    style={[
                      styles.checkbox,
                      selectedFilters.taskTypes.includes(tt) && styles.checkedBox,
                    ]}
                  />
                  <Text style={styles.dropdownText}>
                    {tt.charAt(0).toUpperCase() + tt.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Salesman */}
          <TouchableOpacity
            onPress={() => onToggleFilter('salesman')}
            style={styles.dropdownRow}>
            <View style={[styles.checkbox, enabledFilters.salesman && styles.checkedBox]} />
            <Text style={styles.dropdownText}>Salesman</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          {enabledFilters.salesman && (
            <Dropdown
              style={styles.dropdown}
              data={salesmanOptions}
              labelField="label"
              valueField="value"
              placeholder="Select Salesman"
              value={selectedFilters.salesman}
              onChange={item => onSalesmanChange(item.value)}
            />
          )}

          {/* Status */}
          <TouchableOpacity
            onPress={() => onToggleFilter('status')}
            style={styles.dropdownRow}>
            <View style={[styles.checkbox, enabledFilters.status && styles.checkedBox]} />
            <Text style={styles.dropdownText}>Status</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          {enabledFilters.status && (
            <View style={{marginBottom: 12}}>
              {['completed', 'pending'].map(st => (
                <TouchableOpacity
                  key={st}
                  onPress={() => onToggleStatus(st)}
                  style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                  <View
                    style={[
                      styles.checkbox,
                      selectedFilters.statuses.includes(st) && styles.checkedBox,
                    ]}
                  />
                  <Text style={styles.dropdownText}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.dropdownButtons}>
            <Text style={styles.clearBtn} onPress={onClearFilters}>
              Clear
            </Text>
            <Text style={styles.applyBtn} onPress={onApplyFilters}>
              Apply
            </Text>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 999,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  filterBackground: { width: '100%', height: '100%', position: 'absolute' },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    padding: scaleWidth(14),
    position: 'absolute',
    top: scaleHeight(120),
    right: scaleWidth(10),
    width: scaleWidth(240),
    elevation: 6,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.6,
    borderBottomColor: '#E4E7EC',
    backgroundColor: '#fff',
    marginLeft: 10,
    marginRight: 60,
    paddingHorizontal: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#98A2B3',
    borderRadius: 3,
    marginRight: 10,
  },
  checkedBox: { backgroundColor: Colors.primaryColor },
  dropdownText: { flex: 1, fontSize: scaleFont(13), fontWeight: '500', color: '#344054' },
  arrow: { fontSize: 16, color: '#D0D5DD' },
  dropdownButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, paddingTop: 8 },
  clearBtn: { fontSize: scaleFont(12), color: '#D92D20', fontWeight: '600' },
  applyBtn: { fontSize: scaleFont(12), color: '#027A48', fontWeight: '600' },
  dropdown: {
    height: 42,
    borderColor: '#E4E7EC',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    width: '100%',
  },
});

export default TaskFilterModal;
