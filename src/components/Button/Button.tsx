import React, {forwardRef} from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Colors, Fonts} from '@constants/index';

/**
 * Customizable button component.
 */
export interface CustomButtonProps extends TouchableOpacityProps {
  /**
   * The text to display within the button.
   */
  buttonText: string;

  /**
   * The visual style of the button.
   * @default 'contained'
   */
  mode?: 'contained' | 'outlined';

  /**
   * The style of the button text.
   */
  buttonTextStyle?: StyleProp<TextStyle>;

  /**
   * Whether to display a loading indicator.
   * @default false
   */
  showLoader?: boolean;
}

export const Button = forwardRef<View, CustomButtonProps>((props, ref) => {
  const {
    buttonText,
    mode = 'contained',
    buttonTextStyle,
    disabled,
    style,
    showLoader,
    ...touchableProps
  } = props;
  return (
    <TouchableOpacity
      ref={ref}
      disabled={disabled}
      style={[
        styles.buttonStyle,
        mode === 'outlined' && styles.buttonOutline,
        style,
      ]}
      {...touchableProps}>
      {showLoader ? (
        <ActivityIndicator color={Colors.white} />
      ) : (
        <Text
          style={[
            styles.buttonTextStyle,
            mode === 'outlined' && styles.outlinedButtonText,
            buttonTextStyle,
          ]}>
          {buttonText}
        </Text>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  buttonStyle: {
    backgroundColor: Colors.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaleHeight(10),
    borderWidth: 2,
    borderRadius: scaleWidth(4),
    borderColor: Colors.primaryColor,
  },
  buttonOutline: {
    backgroundColor: Colors.white,
  },
  buttonTextStyle: {
    color: Colors.white,
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(16),
    lineHeight: scaleFont(20),
  },
  outlinedButtonText: {
    color: Colors.primaryColor,
  },
});
