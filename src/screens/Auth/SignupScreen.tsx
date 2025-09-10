import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Button, Container, Header, Input, TnCFooter} from '@components/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {AuthScreens, Colors, Fonts} from '@constants/index';
import CountryPicker, {Country} from 'react-native-country-picker-modal';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  handleEmailVerification,
  handleMobileVerification,
  handleNameVerifications,
} from '@utils/Utils';
import Toast from 'react-native-toast-message';
import {useDispatch, useSelector} from 'react-redux';
import {signupRequest} from '@store/auth/auth.slice';
import {authSelector} from '@store/auth';
import {setStorage} from '@services/localStorage';
import {KeyboardAvoidingScrollView} from 'react-native-keyboard-avoiding-scroll-view';

const Strings = {
  welcomeTitle: 'Welcome to CashnTech',
  subtitle: 'Unlock your Eligibility now',
  firstNameLabel: 'First Name',
  lastNameLabel: 'Last Name',
  emailLabel: 'Email Address',
  mobileLabel: 'Mobile Number',
  getVerificationCodeButtonText: 'Get Verification Code',
  accountText: 'Already have an account? ',
  accountLinkText: 'Log in',
};

type Props = NativeStackScreenProps<
  AuthNavigatorType,
  AuthScreens.SignupScreen
>;

export const SignupScreen: React.FC<Props> = ({
  navigation,
  route: {params},
}) => {
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [country, setCountry] = useState<Country>({
    cca2: 'IN',
    currency: ['INR'],
    callingCode: ['91'],
    region: 'Asia',
    subregion: 'Southern Asia',
    flag: 'flag-in',
    name: 'India',
  });
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const dispatch = useDispatch();
  const userType = useSelector(authSelector.getUserType);
  const isLoading = useSelector(authSelector.getGlobalLoader);

  useEffect(() => {
    if (params) {
      setEmail(params.email);
      setFirstName(params.firstName);
      setLastName(params.lastName);
      setMobileNumber(params.mobile);
      setCountry(params.country);
    }
  }, [params]);

  const onSuccessSignup = (message: string) => {
    Toast.show({
      type: 'success',
      text1: message || 'OTP sent to your email.',
      visibilityTime: 2000,
    });
    const data = {
      mobile: mobileNumber,
      email,
      country,
      firstName,
      lastName,
    };
    const params = {
      showCreatePass: true,
      screen: 'signup',
      data,
    };
    navigation.reset({
      index: 0,
      routes: [
        {
          name: AuthScreens.OTPInputScreen,
          params: params,
        },
      ],
    });
  };

  const onErrorSignup = (errorMessage: string) => {
    Toast.show({
      type: 'error',
      text1: errorMessage,
      visibilityTime: 2000,
    });
  };

  const onPressVerify = () => {
    const isMobileValid = handleMobileVerification(mobileNumber, country);
    const isEmailValid = handleEmailVerification(email);
    const isNameValid = handleNameVerifications(firstName, lastName);
    if (isEmailValid && isMobileValid && isNameValid) {
      const payload = {
        country_code: country.callingCode[0],
        mobile_number: mobileNumber.trim(),
        email: email.trim().toLowerCase(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        is_client: userType === 'client',
        is_internal: userType === 'internal',
      };
      const dispatchPayload = {
        payload: payload,
        callbackSuccess: onSuccessSignup,
        callbackError: onErrorSignup,
      };
      dispatch(signupRequest(dispatchPayload));
    }
  };

  const onPressLogin = () => {
    navigation.replace(AuthScreens.SigninScreen);
  };

  return (
    <Container>
      <KeyboardAvoidingScrollView>
        <View style={styles.flex1}>
          <Header title={Strings.welcomeTitle} subtitle={Strings.subtitle} />
          <View style={styles.inputContainer}>
            <Input
              label={Strings.firstNameLabel}
              value={firstName}
              onChangeText={setFirstName}
              editable={!isLoading}
            />
            <Input
              label={Strings.lastNameLabel}
              value={lastName}
              onChangeText={setLastName}
              containerStyle={styles.inputMargin}
              editable={!isLoading}
            />
            <Input
              label={Strings.emailLabel}
              maxLength={32}
              value={email}
              onChangeText={value => {
                setEmail(value);
                setStorage('user_email', value.trim());
              }}
              keyboardType={'email-address'}
              editable={!isLoading}
              containerStyle={styles.inputMargin}
            />
            <Input
              label={Strings.mobileLabel}
              renderLeftIcon={
                <View style={styles.countryCodeContainer}>
                  <CountryPicker
                    visible={showCountryModal}
                    countryCode={country.cca2}
                    onSelect={item => {
                      setShowCountryModal(false);
                      setCountry(item);
                    }}
                    withEmoji
                    withFlag
                    withCallingCode
                    withAlphaFilter
                    withFilter
                    withFlagButton
                    withCallingCodeButton
                  />
                </View>
              }
              leftIconStyle={styles.leftIcon}
              onPressLeftIcon={() => setShowCountryModal(prv => !prv)}
              maxLength={15}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="number-pad"
              editable={!isLoading}
              containerStyle={styles.inputMargin}
            />
            <Button
              buttonText={Strings.getVerificationCodeButtonText}
              style={styles.buttonMargin}
              onPress={onPressVerify}
              showLoader={isLoading}
              disabled={isLoading}
            />

            <View style={styles.accountContainer}>
              <Text style={styles.accountText}>{Strings.accountText}</Text>
              <TouchableOpacity onPress={onPressLogin}>
                <Text style={[styles.accountText, styles.accountLinkText]}>
                  {Strings.accountLinkText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingScrollView>
      <TnCFooter navigation={navigation} />
    </Container>
  );
};

const styles = StyleSheet.create({
  flex1: {flex: 1},
  inputContainer: {
    marginHorizontal: scaleWidth(43),
    marginTop: scaleHeight(50),
  },
  inputMargin: {
    marginTop: scaleHeight(20),
  },
  buttonMargin: {
    marginTop: scaleHeight(35),
  },
  accountContainer: {
    marginTop: scaleHeight(21),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountText: {
    color: '#202325',
    fontFamily: Fonts.GilroySemiBold,
    fontSize: scaleFont(16),
  },
  accountLinkText: {
    color: Colors.primaryColor,
    textDecorationLine: 'underline',
  },
  countryCodeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: scaleWidth(4),
  },
  leftIcon: {
    borderRightWidth: scaleWidth(1.5),
    borderColor: Colors.gray300,
    height: '100%',
    flexDirection: 'row',
  },
});
