import React, {useMemo, useState} from 'react';
import {Button, Container, Header, Input, TnCFooter} from '@components/index';

import {StyleSheet, Text, View} from 'react-native';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {CircleCheck, EyeClose, EyeOpen} from '@assets/Icons';
import {AuthScreens, Colors, Fonts} from '@constants/index';
import Toast from 'react-native-toast-message';

import {useDispatch, useSelector} from 'react-redux';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {authSelector} from '@store/auth';
import {
  createNewPassword,
  resetPassword,
  sendResetLinkRequest,
} from '@store/auth/auth.slice';
import { decodeJWT } from '@utils/Utils';

type PasswordScreenProps = NativeStackScreenProps<
  AuthNavigatorType,
  AuthScreens.PasswordScreen
>;

const Strings = {
  createPassTitle: 'Create your password',
  forgotPassTitle: 'Re-set your Password',
  createPassSubtitle:
    'Passwords must be a minimum of 8 characters and include at least one special character and one digit.',
  forgotPassSubtitle:
    'Enter your Email Address, and you got the updates link to change the Password.',
  sendResetLinkButtonText: 'Send Reset Link',
  createPasswordButtonText: 'Create Password',
  updatePasswordButtonText: 'Update Password',
  noAccountText: "Don't have an account? ",
  signupLinkText: 'Sign up',
};

export const PasswordScreen = ({
  navigation,
  route: {params},
}: PasswordScreenProps) => {
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const dispatch = useDispatch();

  const isLoading = useSelector(authSelector.getGlobalLoader);

  const passwordError = useMemo(() => {
    const error = {
      lengthError: false,
      symbolError: false,
      numberError: false,
    };
    if (password.length < 8) {
      error.lengthError = true;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      error.symbolError = true;
    }
    if (!/\d/.test(password)) {
      error.numberError = true;
    }
    return error;
  }, [password]);

  const onSuccessPasswordCreate = (successMessage: string) => {
    Toast.show({
      type: 'success',
      text1: successMessage,
      visibilityTime: 2000,
    });
    const data = decodeJWT(params.token!);
    navigation.replace('SuccessScreen', {
      authMode: params.screenMode === 'createPass' ? 'signup' : 'password',
      firstName: data?.first_name ?? '',
      lastName: data?.last_name ?? '',
    });
  };

  const onFailPasswordCreate = (errorMessage: string) => {
    Toast.show({
      type: 'error',
      text1: errorMessage,
      visibilityTime: 2000,
    });
  };

  const onSuccessEmailSend = (successMessage: string) => {
    Toast.show({
      type: 'success',
      text1: successMessage,
      visibilityTime: 2000,
    });
    setTimeout(() => {
      navigation.goBack();
    }, 2000);
  };

  const onFailEmailSend = (errorMessage: string) => {
    Toast.show({
      type: 'error',
      text1: 'Error occurred, please retry',
      visibilityTime: 2000,
    });
  };

  const validatePassword = () => {
    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Passwords do not match',
        visibilityTime: 2000,
      });
      return false;
    }

    if (
      passwordError.lengthError ||
      passwordError.symbolError ||
      passwordError.numberError
    ) {
      Toast.show({
        type: 'error',
        text1: 'Please enter a valid password',
        visibilityTime: 2000,
      });
      return false;
    }
    return true;
  };

  const onPressPasswordBtn = () => {
    if (!validatePassword()) return;
    if (!params?.token) {
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
        visibilityTime: 2000,
      });
      return;
    }
    const data = {
      password: password,
      token: params.token,
    };
    const payload = {
      payload: data,
      callbackSuccess: onSuccessPasswordCreate,
      callbackError: onFailPasswordCreate,
    };
    if (params.screenMode === 'createPass') {
      dispatch(createNewPassword(payload));
    } else {
      dispatch(resetPassword(payload));
    }
  };

  const onPressSendResetLink = () => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Please enter your email',
        visibilityTime: 2000,
      });
      return;
    }
    const data = {
      email: email,
    };
    const payload = {
      payload: data,
      callbackSuccess: onSuccessEmailSend,
      callbackError: onFailEmailSend,
    };
    dispatch(sendResetLinkRequest(payload));
  };

  return (
    <Container>
      <Header
        title={
          params.screenMode === 'createPass'
            ? Strings.createPassTitle
            : Strings.forgotPassTitle
        }
        subtitle={
          params.screenMode === 'forgotPass'
            ? Strings.forgotPassSubtitle
            : Strings.createPassSubtitle
        }
      />

      <View style={styles.flex1}>
        {params.screenMode === 'forgotPass' ? (
          <>
            <View style={styles.inputContainer}>
              <Input
                label="Email"
                placeholder="Enter your email"
                keyboardType="email-address"
                value={email}
                editable={!isLoading}
                onChangeText={setEmail}
              />
            </View>
            <Button
              buttonText={Strings.sendResetLinkButtonText}
              style={styles.buttonStyle}
              onPress={onPressSendResetLink}
              showLoader={isLoading}
            />
            <View style={styles.accountContainer}>
              <Text style={styles.accountText}>{Strings.noAccountText}</Text>
              <Text style={[styles.accountText, styles.accountLinkDisabled]}>
                {Strings.signupLinkText}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.passwordContainer}>
              <Input
                label="Password"
                placeholder="Enter your password"
                editable={!isLoading}
                renderRightIcon={
                  showPassword ? (
                    <EyeOpen height={scaleWidth(20)} width={scaleWidth(20)} />
                  ) : (
                    <EyeClose height={scaleWidth(20)} width={scaleWidth(20)} />
                  )
                }
                onPressRightIcon={() => setShowPassword(prv => !prv)}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <Input
                label="Confirm Password"
                placeholder="Repeat your password"
                containerStyle={styles.inputMargin}
                editable={!isLoading}
                renderRightIcon={
                  showConfirmPassword ? (
                    <EyeOpen height={scaleWidth(20)} width={scaleWidth(20)} />
                  ) : (
                    <EyeClose height={scaleWidth(20)} width={scaleWidth(20)} />
                  )
                }
                onPressRightIcon={() => setShowConfirmPassword(prv => !prv)}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              {confirmPassword.length > 0 && (
                <Text
                  style={[
                    styles.passwordMatchText,
                    password !== confirmPassword && styles.colorRed,
                  ]}>
                  {password === confirmPassword
                    ? 'Passwords match'
                    : 'Passwords do not match'}
                </Text>
              )}
            </View>

            <View style={styles.passwordInfoContainer}>
              <View style={styles.passwordInfo}>
                <CircleCheck
                  color={
                    passwordError.lengthError ? Colors.gray400 : Colors.green
                  }
                  height={scaleHeight(16)}
                  width={scaleWidth(16)}
                />
                <Text style={styles.passwordInfoText}>
                  Minimum 8 characters
                </Text>
              </View>
              <View style={styles.passwordInfo}>
                <CircleCheck
                  color={
                    passwordError.symbolError ? Colors.gray400 : Colors.green
                  }
                  height={scaleHeight(16)}
                  width={scaleWidth(16)}
                />
                <Text style={styles.passwordInfoText}>At least 1 symbol</Text>
              </View>
              <View style={styles.passwordInfo}>
                <CircleCheck
                  color={
                    passwordError.numberError ? Colors.gray400 : Colors.green
                  }
                  height={scaleHeight(16)}
                  width={scaleWidth(16)}
                />
                <Text style={styles.passwordInfoText}>At least 1 number</Text>
              </View>
            </View>

            <Button
              buttonText={
                params.screenMode === 'createPass'
                  ? Strings.createPasswordButtonText
                  : Strings.updatePasswordButtonText
              }
              style={styles.buttonStyle}
              onPress={onPressPasswordBtn}
              showLoader={isLoading}
              disabled={isLoading}
            />
          </>
        )}
      </View>

      <TnCFooter navigation={navigation} />
    </Container>
  );
};

const styles = StyleSheet.create({
  flex1: {flex: 1},
  inputContainer: {
    marginHorizontal: scaleWidth(43),
    marginTop: scaleHeight(54),
  },
  inputMargin: {
    marginTop: scaleHeight(24),
  },
  passwordContainer: {
    marginHorizontal: scaleWidth(43),
    marginTop: scaleHeight(64),
  },
  passwordInfoContainer: {
    marginHorizontal: scaleWidth(43),
    marginTop: scaleHeight(32),
    gap: scaleWidth(8),
  },
  passwordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  passwordInfoText: {
    fontFamily: Fonts.GilroySemiBold,
    fontSize: scaleFont(12),
    color: Colors.gray400,
  },
  passwordMatchText: {
    marginTop: scaleHeight(8),
    marginLeft: scaleWidth(8),
    fontSize: scaleWidth(12),
    color: Colors.green,
  },
  colorRed: {
    color: 'red',
  },
  buttonStyle: {marginHorizontal: scaleWidth(43), marginTop: scaleHeight(68)},
  accountContainer: {
    marginTop: scaleHeight(64),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountText: {
    color: Colors.gray300,
    fontFamily: Fonts.GilroySemiBold,
    fontSize: scaleFont(16),
  },
  accountLinkDisabled: {
    color: Colors.gray300,
    textDecorationLine: 'underline',
  },
});
