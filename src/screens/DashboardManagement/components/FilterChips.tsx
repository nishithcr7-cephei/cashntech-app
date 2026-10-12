import React from 'react';
import {ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

type Props<T extends string> = {
  options: {value: T; label: string}[];
  value: T;
  onChange: (value: T) => void;
};

/** Single-select chip row (horizontal scroll). */
export const FilterChips = <T extends string>({options, value, onChange}: Props<T>) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.row}
    keyboardShouldPersistTaps="handled">
    {options.map(option => {
      const selected = option.value === value;
      return (
        <TouchableOpacity
          key={option.value}
          style={[styles.chip, selected && styles.chipSelected]}
          onPress={() => onChange(option.value)}
          accessibilityRole="button"
          accessibilityState={{selected}}>
          <Text style={[styles.text, selected && styles.textSelected]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const styles = StyleSheet.create({
  row: {paddingBottom: scaleHeight(10)},
  chip: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    marginRight: scaleWidth(8),
    borderRadius: scaleWidth(6),
    borderWidth: 1,
    borderColor: '#DDE1E6',
    backgroundColor: Colors.white,
  },
  chipSelected: {
    borderColor: '#1F2328',
    backgroundColor: '#1F2328',
  },
  text: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: '#252C32',
  },
  textSelected: {color: Colors.white},
});
