import React from 'react';
import {StyleSheet, TextInput, TouchableOpacity, View} from 'react-native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
};

export const RiskSearchBox: React.FC<Props> = ({value, onChangeText, placeholder}) => (
  <View style={styles.box}>
    <FontAwesome6
      name="magnifying-glass"
      iconStyle="solid"
      size={scaleFont(12)}
      color={Colors.graybase}
    />
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.graybase}
      autoCapitalize="none"
      autoCorrect={false}
      returnKeyType="search"
    />
    {value ? (
      <TouchableOpacity onPress={() => onChangeText('')} hitSlop={10}>
        <FontAwesome6
          name="xmark"
          iconStyle="solid"
          size={scaleFont(12)}
          color={Colors.graybase}
        />
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(10),
    marginBottom: scaleHeight(10),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#DDE1E6',
    backgroundColor: Colors.white,
  },
  input: {
    flex: 1,
    paddingVertical: scaleHeight(8),
    marginHorizontal: scaleWidth(8),
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
});
