import React, {useCallback, useState} from 'react';
import {
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Container, Header, TnCFooter} from '@components/index';
import {useFocusEffect} from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight} from '@utils/Scale';
import {useDispatch} from 'react-redux';
import {authActions} from '@store/auth';
import {AuthScreens} from '@constants/Screens';

const Strings = {
  welcomeTitle: 'Welcome to CashnTech',
  chooseYourAccount: 'Choose your ',
  or: ' or ',
  accountTypeMessage: 'account type to continue your journey!',
  joinUsMessage: 'Join Us if you are a ',
  newUser: 'new user?',
  continueAsExisting: 'Continue your Journey as an ',
  existingUser: 'existing user?',
};

type RenderSubTitleProps = {
  showNewUser: boolean;
  navigation: NativeStackNavigationProp<
    AuthNavigatorType,
    AuthScreens.OnBoarding
  >;
  onPressNewUser: () => void;
};

/**
 * Renders the subtitle section of the OnBoarding screen
 * @param {boolean} showNewUser - Whether to show the new user section or not
 * @param {NativeStackNavigationProp<AuthNavigatorType, AuthScreens.OnBoarding>} navigation - The navigation object
 * @param {() => void} onPressNewUser - The callback when the "Join Us if you are a new user?" button is pressed
 * @returns {JSX.Element} The rendered subtitle section
 */
const RenderSubTitle: React.FC<RenderSubTitleProps> = ({
  showNewUser,
  navigation,
  onPressNewUser,
}) => {
  const dispatch = useDispatch();
  /**
   * Navigate to the Signup screen
   * @param {('client' | 'internal')} userType - Type of user
   */
  const navigateToSignup = (userType: 'client' | 'internal') => {
    dispatch(authActions.setUserType(userType));
    navigation.navigate('SignupScreen');
  };

  // Navigate to the Signin screen
  const navigateToSignin = () => {
    navigation.navigate('SigninScreen');
  };

  if (showNewUser) {
    return (
      <View style={styles.subTitleContainer}>
        <View style={styles.subTitleRow}>
          <Text style={styles.subTitle}>{Strings.chooseYourAccount}</Text>
          <TouchableOpacity onPress={() => navigateToSignup('client')}>
            <Text style={styles.subTitleLink}>Client?</Text>
          </TouchableOpacity>
          <Text style={styles.subTitle}>{Strings.or}</Text>
          <TouchableOpacity onPress={() => navigateToSignup('internal')}>
            <Text style={styles.subTitleLink}>Internal?</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subTitle}>{Strings.accountTypeMessage}</Text>
      </View>
    );
  }
  return (
    <View style={styles.subTitleContainer}>
      <View style={styles.subTitleRow}>
        <Text style={styles.subTitle}>{Strings.joinUsMessage}</Text>
        <TouchableOpacity onPress={onPressNewUser}>
          <Text style={styles.subTitleLink}>{Strings.newUser}</Text>
        </TouchableOpacity>
        <Text style={styles.subTitle}>{Strings.or}</Text>
      </View>
      <View style={styles.subTitleRow}>
        <Text style={styles.subTitle}>{Strings.continueAsExisting}</Text>
        <TouchableOpacity onPress={navigateToSignin}>
          <Text style={styles.subTitleLink}>{Strings.existingUser}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

type OnBoardingProps = NativeStackScreenProps<
  AuthNavigatorType,
  AuthScreens.OnBoarding
>;

/**
 * OnBoarding component - Renders the onboarding screen for the app
 * @returns {JSX.Element} The OnBoarding component
 */
export const OnBoarding = ({
  navigation,
}: OnBoardingProps): React.JSX.Element => {
  const [showNewUser, setShowNewUser] = useState(false);

  // Handle the hardware back button press event
  useFocusEffect(
    useCallback(() => {
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (showNewUser) {
          setShowNewUser(false);
          return true;
        }
        return false;
      });
      return () => handler.remove();
    }, [showNewUser]),
  );

  return (
    <Container>
      <View style={styles.flex1}>
        <Header
          title={Strings.welcomeTitle}
          customSubtitle={
            <RenderSubTitle
              navigation={navigation}
              showNewUser={showNewUser}
              onPressNewUser={() => setShowNewUser(true)}
            />
          }
        />
      </View>
      <TnCFooter navigation={navigation} />
    </Container>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  subTitleContainer: {
    marginTop: scaleHeight(8),
  },
  subTitleRow: {
    flexDirection: 'row',
  },
  subTitle: {
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.lightGray,
    fontSize: scaleFont(14),
    lineHeight: scaleFont(22),
  },
  subTitleLink: {
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.tertiaryColor,
    fontSize: scaleFont(14),
    textDecorationLine: 'underline',
    lineHeight: scaleFont(22),
  },
});
