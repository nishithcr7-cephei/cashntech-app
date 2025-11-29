import Colors from '@constants/Colors';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import React from 'react';
import {
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  View,
} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';

type Props = {
  label: string;
  data?: Array<{label: string; value: string}>;
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
  dropdownStyle?: StyleProp<ViewStyle>;
  showSearch?: boolean;
  dropdownPosition?: 'bottom' | 'top' | 'auto' | undefined;
  editable?: boolean;
};

export const CustomDropdown = ({
  label,
  data = [],
  value = '',
  placeholder = 'Choose one',
  onChange,
  showSearch = true,
  containerStyle,
  dropdownStyle,
  dropdownPosition,
  editable = true,
}: Props) => {
  const handleChange = (item: {label: string; value: string}) => {
    if (editable) {
      onChange?.(item.value);
    }
  };

  const selectedItem = data.find(item => item.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Dropdown
        style={[
          styles.dropdown,
          dropdownStyle,
          !editable && styles.disabledDropdown,
        ]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={[
          styles.selectedTextStyle,
          !editable && styles.disabledText,
        ]}
        itemTextStyle={styles.itemTextStyle}
        data={data}
        dropdownPosition={dropdownPosition}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        value={{
          label: selectedItem?.label || '',
          value: value,
        }}
        onChange={handleChange}
        search={showSearch && editable}
        searchPlaceholder="Search"
        disable={!editable}
      />
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
  },
  dropdown: {
    borderWidth: scaleWidth(1.5),
    borderColor: Colors.gray300,
    borderRadius: scaleWidth(4),
    paddingHorizontal: scaleWidth(6),
    height: scaleHeight(36),
    justifyContent: 'center',
  },
  placeholderStyle: {
    fontSize: scaleFont(14),
    color: Colors.gray300,
  },
  selectedTextStyle: {
    fontSize: scaleFont(14),
    color: Colors.darkGray,
  },
  itemTextStyle: {
    fontSize: scaleFont(16),
    color: '#333',
  },
  disabledDropdown: {
    backgroundColor: Colors.gray100,
    borderColor: Colors.gray200,
  },
  disabledText: {
    color: Colors.gray400,
  },
});
