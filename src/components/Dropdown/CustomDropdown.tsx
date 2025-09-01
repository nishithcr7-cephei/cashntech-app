import Colors from '@constants/Colors';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import React from 'react';
import {
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';

type Props = {
  label: string;
  data?: Array<{label: string; value: string}>;
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
  showSearch?: boolean;
  dropdownPosition?: 'bottom' | 'top' | 'auto' | undefined;
};

export const CustomDropdown = ({
  label,
  data = [],
  value = '',
  placeholder = 'Choose one',
  onChange,
  showSearch = true,
  containerStyle,
  dropdownPosition,
}: Props) => {
  const handleChange = (item: {label: string; value: string}) => {
    onChange?.(item.value);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Dropdown
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        itemTextStyle={styles.itemTextStyle}
        data={data}
        dropdownPosition={dropdownPosition}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        value={{
          label: value,
          value: value,
        }}
        onChange={handleChange}
        search={showSearch}
        searchPlaceholder="Search"
      />
    </KeyboardAvoidingView>
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
});
