import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import {Colors} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

interface FilterDropdownProps {
  selectedFilters: {
    location: string;
    initiator: string;
    source: string;
  };
  enabledFilters: {
    location: boolean;
    initiator: boolean;
    source: boolean;
  };
  onSetSelectedFilters: (filters: {
    location: string;
    initiator: string;
    source: string;
  }) => void;
  onSetEnabledFilters: (filters: {
    location: boolean;
    initiator: boolean;
    source: boolean;
  }) => void;
  onApply: () => void;
  onClear: () => void;
  onSetIsFilterOpen: (open: boolean) => void;
  locations: {label: string; value: string}[];
  initiators: {label: string; value: string | number}[];
  sources: {label: string; value: string}[];
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  selectedFilters,
  enabledFilters,
  onSetSelectedFilters,
  onSetEnabledFilters,
  onApply,
  onClear,
  onSetIsFilterOpen,
  locations,
  initiators,
  sources,
}) => {
  const handleCheckboxToggle = (field: keyof typeof enabledFilters) => {
    onSetEnabledFilters({
      ...enabledFilters,
      [field]: !enabledFilters[field],
    });
  };

  return (
    <View style={styles.dropdownContainer}>
      {/* LOCATION FILTER */}
      <TouchableOpacity
        onPress={() => handleCheckboxToggle('location')}
        style={styles.row}>
        <View
          style={[
            styles.checkbox,
            enabledFilters.location && styles.checkedBox,
          ]}
        />
        <Text style={styles.label}>City</Text>
      </TouchableOpacity>
      {enabledFilters.location && (
        <Dropdown
          style={styles.dropdown}
          data={locations}
          labelField="label"
          valueField="value"
          placeholder="Select City"
          value={selectedFilters.location}
          onChange={item =>
            onSetSelectedFilters({...selectedFilters, location: item.value})
          }
        />
      )}

      {/* INITIATOR FILTER */}
      <TouchableOpacity
        onPress={() => handleCheckboxToggle('initiator')}
        style={styles.row}>
        <View
          style={[
            styles.checkbox,
            enabledFilters.initiator && styles.checkedBox,
          ]}
        />
        <Text style={styles.label}>Initiator</Text>
      </TouchableOpacity>
      {enabledFilters.initiator && (
        <Dropdown
          style={styles.dropdown}
          data={initiators}
          labelField="label"
          valueField="value"
          placeholder="Select Initiator"
          value={selectedFilters.initiator}
          onChange={item =>
            onSetSelectedFilters({...selectedFilters, initiator: item.value})
          }
        />
      )}

      {/* SOURCE FILTER */}
      <TouchableOpacity
        onPress={() => handleCheckboxToggle('source')}
        style={styles.row}>
        <View
          style={[styles.checkbox, enabledFilters.source && styles.checkedBox]}
        />
        <Text style={styles.label}>Source</Text>
      </TouchableOpacity>
      {enabledFilters.source && (
        <Dropdown
          style={styles.dropdown}
          data={sources}
          labelField="label"
          valueField="value"
          placeholder="Select Source"
          value={selectedFilters.source}
          onChange={item =>
            onSetSelectedFilters({...selectedFilters, source: item.value})
          }
        />
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={() => {
            onClear();
            onSetIsFilterOpen(false);
          }}>
          <Text style={styles.clearBtn}>Clear</Text>
        </TouchableOpacity>
        <Text
          style={styles.applyBtn}
          onPress={() => {
            onApply();
            onSetIsFilterOpen(false);
          }}>
          Apply
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#98A2B3',
    borderRadius: 3,
    marginRight: 10,
  },
  checkedBox: {
    backgroundColor: Colors.primaryColor,
  },
  label: {
    fontSize: scaleFont(14),
    color: '#344054',
    fontWeight: '500',
  },
  dropdown: {
    height: 42,
    borderColor: '#E4E7EC',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    paddingTop: 8,
  },
  clearBtn: {
    fontSize: scaleFont(12),
    color: '#D92D20',
    fontWeight: '600',
  },
  applyBtn: {
    fontSize: scaleFont(12),
    color: '#027A48',
    fontWeight: '600',
  },
});
