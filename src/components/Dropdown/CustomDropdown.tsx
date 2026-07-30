import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import React, {useMemo} from 'react';
import {
  Text,
  StyleSheet,
  StyleProp,
  TextStyle,
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
  labelStyle?: StyleProp<TextStyle>;
  selectedTextStyle?: StyleProp<TextStyle>;
  dropdownStyle?: StyleProp<ViewStyle>;
  itemContainerStyle?: StyleProp<ViewStyle>;
  showSearch?: boolean;
  dropdownPosition?: 'bottom' | 'top' | 'auto' | undefined;
  editable?: boolean;
  maxHeight?: number;
};

export const CustomDropdown = ({
  label,
  data = [],
  value = '',
  placeholder = 'Choose one',
  onChange,
  showSearch = true,
  containerStyle,
  labelStyle,
  selectedTextStyle,
  dropdownStyle,
  itemContainerStyle,
  dropdownPosition,
  editable = true,
  maxHeight = scaleHeight(240),
}: Props) => {
  const handleChange = (item: {label: string; value: string}) => {
    if (editable) {
      onChange?.(item.value);
    }
  };

  // Find selected item by matching value
  const selectedItem = useMemo(() => 
    data.find(item => item.value === value),
    [data, value]
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <Dropdown
        style={[
          styles.dropdown,
          dropdownStyle,
          !editable && styles.disabledDropdown,
        ]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={[
          styles.selectedTextStyle,
          selectedTextStyle,
          !editable && styles.disabledText,
        ]}
        itemTextStyle={styles.itemTextStyle}
        data={data}
        dropdownPosition={dropdownPosition}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        // ✅ Pass the actual value directly - Dropdown expects string matching valueField
        value={value}
        onChange={(item) => handleChange(item)}
        search={showSearch && editable}
        searchPlaceholder="Search"
        disable={!editable}
        maxHeight={maxHeight}
        containerStyle={styles.listContainer}
        itemContainerStyle={[styles.itemContainer, itemContainerStyle]}
        activeColor={Colors.gray100}
        renderItem={(item) => (
          <View style={[styles.itemRow, itemContainerStyle]}>
            <Text style={styles.itemTextStyle}>{item.label}</Text>
          </View>
        )}
        // ✅ Custom render selected item to show label instead of value
        renderSelectedItem={(item) => (
          <Text style={[styles.selectedTextStyle, selectedTextStyle]}>
            {data.find(d => d.value === item?.value)?.label || placeholder}
          </Text>
        )}
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
    fontSize: scaleFont(15),
    color: Colors.darkGray,
    fontFamily: Fonts.GilroyMedium,
  },
  listContainer: {
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: Colors.gray200,
    marginTop: scaleHeight(4),
  },
  itemContainer: {
    paddingVertical: 0,
  },
  itemRow: {
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(14),
    minHeight: scaleHeight(44),
    justifyContent: 'center',
  },
  disabledDropdown: {
    backgroundColor: Colors.gray100,
    borderColor: Colors.gray200,
  },
  disabledText: {
    color: Colors.gray400,
  },
});
