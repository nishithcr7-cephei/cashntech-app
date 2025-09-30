import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';

type MultiSelectItem = {
  label: string;
  value: string;
};

type Props = {
  label: string;
  data: MultiSelectItem[];
  value: string[];
  placeholder?: string;
  onChange: (values: string[]) => void;
  containerStyle?: any;
  showSearch?: boolean;
  dropdownPosition?: 'bottom' | 'top' | 'auto' | undefined;
};

export const MultiSelectDropdown: React.FC<Props> = ({
  label,
  data = [],
  value = [],
  placeholder = 'Choose multiple options',
  onChange,
  showSearch = true,
  containerStyle,
  dropdownPosition = 'bottom',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchText, setSearchText] = useState('');


  const filteredData = data.filter(item =>
    item.label.toLowerCase().includes(searchText.toLowerCase()),
  );

  const selectedItems = data.filter(item => value.includes(item.value) && item.value !== '');

  const handleItemPress = (itemValue: string) => {
    // Filter out empty strings from current value
    const cleanValue = value.filter(v => v !== '');
    
    const newValue = cleanValue.includes(itemValue)
      ? cleanValue.filter(v => v !== itemValue)
      : [...cleanValue, itemValue];
    
    onChange(newValue);
  };

  const removeItem = (itemValue: string) => {
    const newValue = value.filter(v => v !== itemValue);
    onChange(newValue);
  };

  const getDisplayText = () => {
    // Filter out empty strings for display
    const cleanValue = value.filter(v => v !== '');
    
    if (cleanValue.length === 0) return placeholder;
    if (cleanValue.length === 1) {
      const item = data.find(d => d.value === cleanValue[0]);
      return item?.label || cleanValue[0];
    }
    return `${cleanValue.length} items selected`;
  };

  const renderChip = (itemValue: string) => {
    const item = data.find(d => d.value === itemValue);
    return (
      <View key={itemValue} style={styles.chip}>
        <Text style={styles.chipText}>{item?.label || itemValue}</Text>
        <TouchableOpacity
          onPress={() => removeItem(itemValue)}
          style={styles.chipClose}>
          <Text style={styles.chipCloseText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = ({item}: {item: MultiSelectItem}) => {
    const isSelected = value.includes(item.value);
    return (
      <TouchableOpacity
        style={[
          styles.item,
          isSelected && styles.selectedItem,
        ]}
        onPress={() => handleItemPress(item.value)}>
        <Text
          style={[
            styles.itemText,
            isSelected && styles.selectedItemText,
          ]}>
          {item.label}
        </Text>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      {/* Selected items as chips */}
      {selectedItems.length > 0 && (
        <View style={styles.chipsContainer}>
          {selectedItems.map(item => renderChip(item.value))}
        </View>
      )}

      {/* Dropdown trigger */}
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setIsVisible(true)}>
        <Text
          style={[
            styles.dropdownText,
            value.length === 0 && styles.placeholderText,
          ]}>
          {getDisplayText()}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      {/* Modal with options */}
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}>
          <View style={styles.modalContent}>
            {/* Search input */}
            {showSearch && (
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor={Colors.gray300}
              />
            )}

            {/* Options list */}
            <FlatList
              data={filteredData}
              renderItem={renderItem}
              keyExtractor={item => item.value}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />

            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: scaleHeight(4),
  },
  label: {
    fontSize: scaleFont(14),
    marginBottom: 8,
    color: '#333',
    fontWeight: fontWeight.Medium,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: scaleHeight(8),
    gap: scaleWidth(6),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(12),
    marginBottom: scaleHeight(4),
  },
  chipText: {
    color: 'white',
    fontSize: scaleFont(12),
    fontWeight: fontWeight.Medium,
  },
  chipClose: {
    marginLeft: scaleWidth(4),
    paddingHorizontal: scaleWidth(2),
  },
  chipCloseText: {
    color: 'white',
    fontSize: scaleFont(14),
    fontWeight: fontWeight.Bold,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: scaleWidth(1.5),
    borderColor: Colors.gray300,
    borderRadius: scaleWidth(4),
    paddingHorizontal: scaleWidth(12),
    height: scaleHeight(36),
    backgroundColor: 'white',
  },
  dropdownText: {
    flex: 1,
    fontSize: scaleFont(14),
    color: Colors.darkGray,
  },
  placeholderText: {
    color: Colors.gray300,
  },
  arrow: {
    fontSize: scaleFont(12),
    color: Colors.gray300,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: scaleWidth(8),
    width: '80%',
    maxHeight: '70%',
    padding: scaleWidth(16),
  },
  searchInput: {
    borderWidth: scaleWidth(1),
    borderColor: Colors.gray300,
    borderRadius: scaleWidth(4),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    fontSize: scaleFont(14),
    marginBottom: scaleHeight(12),
  },
  list: {
    maxHeight: scaleHeight(200),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(8),
    borderBottomWidth: scaleWidth(0.5),
    borderBottomColor: Colors.gray300,
  },
  selectedItem: {
    backgroundColor: Colors.primaryColor + '10',
  },
  itemText: {
    fontSize: scaleFont(14),
    color: Colors.darkGray,
    flex: 1,
  },
  selectedItemText: {
    color: Colors.primaryColor,
    fontWeight: fontWeight.Medium,
  },
  checkmark: {
    fontSize: scaleFont(16),
    color: Colors.primaryColor,
    fontWeight: fontWeight.Bold,
  },
  closeButton: {
    marginTop: scaleHeight(12),
    paddingVertical: scaleHeight(8),
    alignItems: 'center',
    borderTopWidth: scaleWidth(1),
    borderTopColor: Colors.gray300,
  },
  closeButtonText: {
    fontSize: scaleFont(14),
    color: Colors.primaryColor,
    fontWeight: fontWeight.Medium,
  },
});
