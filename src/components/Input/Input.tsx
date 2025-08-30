import {
  View,
  Text,
  StyleSheet,
  TextInputProps,
  TextInput,
  StyleProp,
  TextStyle,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import React, {forwardRef} from 'react';
import Fonts from '@constants/Fonts';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Colors} from '@constants/index';

export interface InputProps extends TextInputProps {
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  renderRightIcon?: React.ReactNode;
  onPressRightIcon?: () => void;
  rightIconStyle?: StyleProp<ViewStyle>;
  renderLeftIcon?: React.ReactNode;
  leftIconStyle?: StyleProp<ViewStyle>;
  onPressLeftIcon?: () => void;
}

export const Input = forwardRef<TextInput, InputProps>((props, ref) => {
  const {
    label,
    labelStyle,
    containerStyle,
    renderRightIcon,
    onPressRightIcon,
    rightIconStyle,
    renderLeftIcon,
    onPressLeftIcon,
    leftIconStyle,
    style,
    ...rest
  } = props;
  return (
    <View style={containerStyle}>
      {label && label.length > 0 && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}
      <View style={[styles.inputContainer]}>
        {renderLeftIcon && (
          <TouchableOpacity
            style={leftIconStyle}
            onPress={() => onPressLeftIcon?.()}>
            {renderLeftIcon}
          </TouchableOpacity>
        )}
        <TextInput
          ref={ref}
          {...rest}
          style={[styles.inputStyle, style]}
          placeholderTextColor={Colors.gray300}
        />
        {renderRightIcon && (
          <TouchableOpacity
            style={[styles.rightContainerStyle, rightIconStyle]}
            onPress={() => {
              onPressRightIcon?.();
            }}>
            {renderRightIcon}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(14),
    color: Colors.gray,
    marginBottom: scaleHeight(6),
  },
  inputContainer: {
    height: scaleHeight(35.9292631579),
    borderWidth: scaleWidth(1.5),
    borderRadius: scaleWidth(4),
    borderColor: Colors.gray300,
    paddingHorizontal: scaleWidth(4),
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputStyle: {
    height: scaleHeight(35.9292631579),
    color: Colors.darkGray,
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(14),
    flex: 1,
  },
  rightContainerStyle: {
    marginEnd: scaleWidth(12),
    padding: scaleWidth(4),
  },
});
