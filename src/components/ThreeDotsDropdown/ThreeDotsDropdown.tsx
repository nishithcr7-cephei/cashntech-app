import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import {Dots} from '@assets/Icons';

type DropdownOption = {
  label: string;
  value: string;
};

type ThreeDotsDropdownProps = {
  options: DropdownOption[];
  onSelect: (value: string) => void;
};

export const ThreeDotsDropdown: React.FC<ThreeDotsDropdownProps> = ({
  options,
  onSelect,
}) => {
  return (
    <View style={styles.wrapper}>
      <Dropdown
        style={styles.dropdown}
        containerStyle={styles.dropdownContainer}
        data={options}
        labelField="label"
        valueField="value"
        placeholder=""
        onChange={item => onSelect(item.value)}
        renderRightIcon={() => <Dots height={16} width={16} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 999,
  },
  dropdown: {
    height: 30,
    width: 30,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  dropdownContainer: {
    width: 120,
    borderRadius: 6,
    padding: 6,
    backgroundColor: '#FFF',
    elevation: 5,
  },
});
