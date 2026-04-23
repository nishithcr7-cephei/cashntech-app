import React, {useMemo} from 'react';
import {Text, TextProps, ActivityIndicator, View} from 'react-native';
import {decryptValue} from '@utils/decrypt';

interface SafeTextProps extends TextProps {
  /**
   * If true, shows a Loading... indicator if the text looks like it's still encrypted
   * and decryption fails or produces the same result.
   */
  showLoadingIfEncrypted?: boolean;
}

/**
 * A wrapper around the standard React Native Text component that automatically
 * attempts to decrypt its children if they appear to be encrypted base64 strings.
 * 
 * This serves as a secondary safety net in case the API transformer was bypassed.
 */
export const SafeText: React.FC<SafeTextProps> = ({
  children,
  showLoadingIfEncrypted = false,
  ...props
}) => {
  const processedContent = useMemo(() => {
    if (typeof children !== 'string') {
      return children;
    }

    // Check if it looks like an encrypted string (contains + or ends with ==)
    const looksEncrypted = children.includes('+') || children.endsWith('==') || (children.length > 32 && /^[A-Za-z0-9+/=]+$/.test(children));

    if (!looksEncrypted) {
      return children;
    }

    const decrypted = decryptValue(children);

    // If still looks encrypted and decryption returned the same thing
    if (showLoadingIfEncrypted && decrypted === children && looksEncrypted) {
      return 'LOADING_INDICATOR';
    }

    return decrypted;
  }, [children, showLoadingIfEncrypted]);

  if (processedContent === 'LOADING_INDICATOR') {
    return (
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <ActivityIndicator size="small" color="#999" />
        <Text {...props} style={[{marginLeft: 4, color: '#999'}, props.style]}>Loading...</Text>
      </View>
    );
  }

  return <Text {...props}>{processedContent}</Text>;
};
