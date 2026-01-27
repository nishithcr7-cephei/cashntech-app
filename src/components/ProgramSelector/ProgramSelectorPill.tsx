import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {
  selectProgramDisplayText,
  selectIsProgramSelected,
} from '@store/programSelection/programSelection.selector';

export const ProgramSelectorPill: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthNavigatorType>>();
  const displayText = useSelector(selectProgramDisplayText);
  const isSelected = useSelector(selectIsProgramSelected);

  if (!isSelected || !displayText) return null;

  return (
    <TouchableOpacity
      style={styles.pill}
      onPress={() => navigation.navigate('SelectProgramScreen')}>
      <Text style={styles.pillText} numberOfLines={1}>
        {displayText}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    backgroundColor: Colors.white,
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    borderColor: Colors.primaryColor,
    maxWidth: scaleWidth(200),
  },
  pillText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
});
