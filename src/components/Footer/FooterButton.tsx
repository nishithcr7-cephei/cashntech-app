import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Colors from '@constants/Colors';
import Fonts from '@constants/Fonts';
import {RightCheckmark, RightChevronCircle} from '@assets/Icons';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

type FooterButtonProps = {
  onPressClearAll?: () => void;
  onPressSave?: () => void;
  onPressNext?: () => void;
  onPressSubmit?: () => void;
  showNext?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  clearButtonText?: string;
  disableSubmit?: boolean;
};

export const FooterButton: React.FC<FooterButtonProps> = ({
  onPressClearAll,
  onPressSave,
  onPressNext,
  onPressSubmit,
  showNext = true,
  containerStyle,
  clearButtonText = 'Clear all',
  disableSubmit = false,
}) => {
  return (
    <View style={[styles.footerButton, containerStyle]}>
      {onPressClearAll && (
        <TouchableOpacity style={styles.clearButton} onPress={onPressClearAll}>
          <Text style={styles.clearText}>{clearButtonText}</Text>
        </TouchableOpacity>
      )}

      {onPressSave && (
        <TouchableOpacity
          style={[styles.saveButton, {backgroundColor: Colors.white}]}
          onPress={onPressSave}>
          <Text style={[styles.saveText, {color: Colors.green}]}>Save</Text>
        </TouchableOpacity>
      )}

      {showNext ? (
        <TouchableOpacity style={styles.nextButton} onPress={onPressNext}>
          <RightChevronCircle width={24} height={24} />
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={[
            styles.saveButton, 
            disableSubmit && styles.disabledButton
          ]} 
          onPress={disableSubmit ? undefined : onPressSubmit}
          disabled={disableSubmit}>
          <Text style={[
            styles.saveText,
            disableSubmit && styles.disabledText
          ]}>Submit</Text>
          <RightCheckmark 
            width={12} 
            height={12} 
            color={disableSubmit ? Colors.gray : Colors.white} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  footerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  clearButton: {
    paddingHorizontal: 10,
  },
  clearText: {
    color: Colors.primaryColor,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.green,
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(5),
    borderRadius: scaleWidth(4),
    gap: scaleWidth(8),
    borderWidth: 1,
    borderColor: Colors.green,
    minWidth: scaleWidth(100),
  },
  saveText: {
    color: Colors.white,
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(14),
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextText: {
    color: Colors.blueGray700,
    fontSize: 16,
    marginStart: scaleWidth(10),
  },
  disabledButton: {
    backgroundColor: Colors.gray,
    borderColor: Colors.gray,
  },
  disabledText: {
    color: Colors.white,
    opacity: 0.6,
  },
});