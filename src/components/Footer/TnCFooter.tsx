import {View, Text, StyleSheet} from 'react-native';
import React from 'react';
import {scaleFont, scaleHeight} from '@utils/Scale';
import {AuthScreens, Colors, Fonts} from '@constants/index';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AuthNavigatorType} from '@type/NavigatorTypes';

const Strings = {
  bySigningIn: 'By signing in, you agree to our',
  privacyPolicy: 'Privacy Policy',
  and: ' and ',
  termsOfService: 'Terms of Service',
  copyright: 'Copyright 2024, CashnTech Pvt Ltd., All Rights Reserved',
};

type tncProps = {
  navigation: NativeStackNavigationProp<AuthNavigatorType, AuthScreens>;
};

/**
 * TnCFooter is a React functional component that displays the terms and conditions footer.
 * It includes links to the Privacy Policy and Terms of Service. Clicking these links navigates
 * to the respective screens using the provided navigation prop.
 *
 * @param {object} props - The component props.
 * @param {NativeStackNavigationProp<AuthNavigatorType, AuthScreens>} props.navigation - The navigation prop used to navigate to other screens.
 *
 * @returns {JSX.Element} A JSX element displaying the terms and conditions footer.
 */

export const TnCFooter: React.FC<tncProps> = ({navigation}) => {
  /**
   * Navigate to the TermsOfService screen when the Terms of Service text is pressed.
   */
  const handlePress = () => {
    navigation.navigate(AuthScreens.TermsOfService);
  };

  return (
    <View>
      <View style={styles.copyRightContainer}>
        <Text style={styles.termConText}>{Strings.bySigningIn}</Text>
        <Text style={styles.termConText}>
          <Text style={styles.termConLinkText} onPress={handlePress}>
            {Strings.privacyPolicy}
          </Text>
          <Text style={styles.termConText}>{Strings.and}</Text>
          <Text style={styles.termConLinkText} onPress={handlePress}>
            {Strings.termsOfService}
          </Text>
        </Text>
      </View>
      <Text style={styles.copyRightText}>{Strings.copyright}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  copyRightContainer: {alignItems: 'center', marginBottom: scaleHeight(24)},
  termConText: {
    color: Colors.lightGray,
    fontFamily: Fonts.GilroyRegular,
    fontSize: scaleFont(14),
  },
  termConLinkText: {
    fontSize: scaleFont(14),
    color: Colors.tertiaryColor,
    fontFamily: Fonts.GilroySemiBold,
    textDecorationLine: 'underline',
  },
  copyRightText: {
    textAlign: 'center',
    color: Colors.gray200,
    fontFamily: Fonts.GilroyMedium,
    margin: scaleHeight(4),
    fontSize: scaleFont(10),
  },
});
