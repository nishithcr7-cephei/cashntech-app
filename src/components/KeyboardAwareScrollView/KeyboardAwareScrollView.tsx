import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Config from 'react-native-config';
import {KeyboardAvoidingScrollView} from 'react-native-keyboard-avoiding-scroll-view';

type KeyboardAwareScrollViewProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

const isAppetizeBuild = Config.IS_APPETIZE_BUILD === 'true';

/**
 * Appetize / standalone simulator builds cannot use measureInWindow inside
 * react-native-keyboard-avoiding-scroll-view (TextInput focus crash).
 */
export const KeyboardAwareScrollView: React.FC<KeyboardAwareScrollViewProps> = ({
  children,
  style,
  contentContainerStyle,
}) => {
  if (isAppetizeBuild) {
    return (
      <KeyboardAvoidingView
        style={[styles.flex, style]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.flexGrow, contentContainerStyle]}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingScrollView
      style={style}
      contentContainerStyle={contentContainerStyle}>
      {children}
    </KeyboardAvoidingScrollView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flexGrow: {
    flexGrow: 1,
  },
});
