import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {EyeClose, EyeOpen} from '@assets/Icons';
import {Button, Container, Header, Input, TnCFooter} from '@components/index';
import {AuthScreens, Colors, Fonts, StorageKeys} from '@constants/index';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {handleEmailVerification} from '@utils/Utils';
import Toast from 'react-native-toast-message';
import {Feather} from '@react-native-vector-icons/feather';
import {setStorage} from '@services/localStorage';
import {KeyboardAvoidingScrollView} from 'react-native-keyboard-avoiding-scroll-view';
import {useDispatch, useSelector} from 'react-redux';
import {signinRequest} from '@store/auth/auth.slice';
import {authSelector} from '@store/auth';
import {APP_VERSION_DISPLAY} from '@constants/AppMeta';

type SigninProps = NativeStackScreenProps<
  AuthNavigatorType,
  AuthScreens.SigninScreen
>;

const Strings = {
  welcomeBackTitle: 'Welcome to CashnTech',
  loginSubtitle: 'Login to your account',
  emailLabel: 'Email Address',
  passwordLabel: 'Password',
  rememberMe: 'Remember me for faster login',
  forgotPassword: 'Forgot Password?',
  getVerificationCode: 'Get Verification Code',
  noAccountText: "Don't have an account? ",
  signupLinkText: 'Sign up',
  otpSent: 'OTP sent to your email.',
};


export const SigninScreen = ({navigation, route: {params}}: SigninProps) => {
  
  //1.Cashntech-user
  const [email, setEmail] = useState('itsupport@cashntech.com');
  const [passwordValue, setPassword] = useState('santram@123');

  //2.Anchor-maker
  //const [email, setEmail] = useState('sm_maker@yopmail.com');
  //const [passwordValue, setPassword] = useState('Welcome@123');

  //3.Anchor-checker
  //const [email, setEmail] = useState('dms_checker@yopmail.com');
  //const [passwordValue, setPassword] = useState('Welcome@123');

  //4.Dealer-mkaer
  //const [email, setEmail] = useState('maheshkmaker@yopmail.com');
  //const [passwordValue, setPassword] = useState('Welcome@123');

  //5.Dealer-cheker
  //const [email, setEmail] = useState('dl_chcker21@yopmail.com');
  //const [passwordValue, setPassword] = useState('Welcome@123');


  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const dispatch = useDispatch();
  const isLoading = useSelector(authSelector.getGlobalLoader);

  useEffect(() => {
    if (params?.email != null) setEmail(params.email);
    if (params?.password != null) setPassword(params.password);
  }, [params]);

  const onPressVerify = () => {
    const payload = {
      email: email.trim().toLowerCase(),
      password: passwordValue.trim(),
    };

    console.log('🔵 [SigninScreen] Login button pressed');
    console.log('🔵 [SigninScreen] Payload:', JSON.stringify(payload, null, 2));

    const isEmailValid = handleEmailVerification(email);
    if (!isEmailValid) return;

    setStorage(StorageKeys.REMEMBER_ME, rememberMe);

    dispatch(
      signinRequest({
        payload,
        callbackSuccess: (message, mobileNumber) => {
          Toast.show({
            type: 'success',
            text1: message || Strings.otpSent,
            visibilityTime: 2000,
          });
          navigation.navigate(AuthScreens.OTPInputScreen, {
            showCreatePass: false,
            screen: 'signin',
            data: {
              email: email.trim().toLowerCase(),
              password: passwordValue.trim(),
              mobileNumber: mobileNumber || '',
            },
          });
        },
        callbackError: errorMessage => {
          Toast.show({
            type: 'error',
            text1: errorMessage || 'Login failed',
            visibilityTime: 3000,
          });
        },
      }),
    );
  };

  const onPressForgotPassword = () => {
    navigation.navigate(AuthScreens.PasswordScreen, {screenMode: 'forgotPass'});
  };

  const onPressSignup = () => {
    navigation.navigate(AuthScreens.SignupScreen);
  };

  return (
    <Container>
      <KeyboardAvoidingScrollView>
        <Header
          title={Strings.welcomeBackTitle}
          subtitle={Strings.loginSubtitle}
        />
        <View style={styles.inputContainer}>
          <Input
            label={Strings.emailLabel}
            leftIconStyle={styles.leftIcon}
            maxLength={80}
            value={email}
            onChangeText={setEmail}
            keyboardType={'email-address'}
            editable={!isLoading}
          />
          <Input
            label={Strings.passwordLabel}
            onChangeText={setPassword}
            value={passwordValue}
            editable={!isLoading}
            renderRightIcon={
              showPassword ? (
                <EyeOpen style={styles.icon} />
              ) : (
                <EyeClose style={styles.icon} />
              )
            }
            onPressRightIcon={() => setShowPassword(prv => !prv)}
            secureTextEntry={!showPassword}
            containerStyle={styles.passwordInputContainer}
          />
          <View style={styles.extraInfoContainer}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => setRememberMe(pre => !pre)}>
              <Feather
                name={rememberMe ? 'check-square' : 'square'}
                size={scaleWidth(12)}
                color={Colors.gray300}
              />
              <Text style={styles.rememberText}>{Strings.rememberMe}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onPressForgotPassword}>
              <Text style={styles.forgotPasswordText}>
                {Strings.forgotPassword}
              </Text>
            </TouchableOpacity>
          </View>
          <Button
            buttonText={Strings.getVerificationCode}
            onPress={onPressVerify}
            showLoader={isLoading}
            disabled={isLoading}
          />
          <View style={styles.accountContainer}>
            <Text style={styles.accountText}>{Strings.noAccountText}</Text>
            <TouchableOpacity onPress={onPressSignup}>
              <Text style={[styles.accountText, styles.accountLinkText]}>
                {Strings.signupLinkText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingScrollView>
      <View style={styles.versionInfoContainer}>
        <Text style={styles.versionInfoText}>{APP_VERSION_DISPLAY}</Text>
      </View>
      <TnCFooter navigation={navigation} />
    </Container>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flex: 1,
    marginHorizontal: scaleWidth(43),
    marginTop: scaleHeight(36),
  },
  passwordInputContainer: {
    marginTop: scaleHeight(24),
  },
  extraInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleHeight(8),
    alignItems: 'center',
    marginBottom: scaleHeight(47),
  },
  row: {flexDirection: 'row', alignItems: 'center'},
  rememberText: {
    marginLeft: scaleWidth(6),
    color: Colors.gray300,
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(12),
  },
  forgotPasswordText: {
    color: Colors.tertiaryColor,
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(12),
  },
  accountContainer: {
    marginTop: scaleHeight(64),
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
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  icon: {
    height: scaleWidth(20),
    width: scaleWidth(20),
  },
  versionInfoContainer: {
    alignItems: 'center',
    paddingBottom: scaleHeight(6),
  },
  versionInfoText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
});
