import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {Button, Container, Header, TnCFooter} from '@components/index';
import {OtpInput} from 'react-native-otp-entry';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {AuthScreens, Colors, Fonts} from '@constants/index';
import {EditIcon} from '@assets/Icons';
import Toast from 'react-native-toast-message';
import {useDispatch, useSelector} from 'react-redux';
import {signinOtpVerifyRequest} from '@store/auth/auth.slice';
import {authSelector} from '@store/auth';
import type {ILmsUser} from '@store/auth/auth.types';
import {userActions} from '@store/user';
import {clearProductContext} from '@store/product/product.slice';
import {APP_VERSION_DISPLAY} from '@constants/AppMeta';

const OTP_TIMER = 60;
const Strings = {
  verifyEmail: 'Verify Email',
  weJustSentCode: 'We Just sent a 6 Digit code to ',
  edit: 'Edit',
  didNotGetOTP: 'Didn’t get the OTP? ',
  resendOTP: 'Resend OTP ',
  in: 'in ',
  seconds: ' sec',
};

type OTPInputScreenProps = NativeStackScreenProps<
  AuthNavigatorType,
  AuthScreens.OTPInputScreen
>;

export const OTPInputScreen = ({
  navigation,
  route: {params},
}: OTPInputScreenProps) => {
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(OTP_TIMER);
  const timerInterval = useRef<NodeJS.Timeout>(null);

  const dispatch = useDispatch();
  const isLoading = useSelector(authSelector.getGlobalLoader);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  // Mock user data - will be replaced with API response later
  const getMockUserData = () => {
    if (params.screen === 'signin') {
      return {
        id: 1,
        email: params.data.email || 'test@gmail.com',
        first_name: 'Test',
        last_name: 'User',
        mobile_number: params.data.mobileNumber || '9814756321',
      };
    } else {
      return {
        id: 1,
        email: params.data.email || 'test@gmail.com',
        first_name: params.data.firstName || 'Test',
        last_name: params.data.lastName || 'User',
        mobile_number: params.data.mobile || '9814756321',
      };
    }
  };

  const startTimer = () => {
    timerInterval.current = setInterval(() => {
      setOtpTimer(prv => {
        if (prv > 0) {
          return prv - 1;
        } else {
          if (timerInterval.current) {
            clearInterval(timerInterval.current);
          }
          return 0;
        }
      });
    }, 1000);
  };

  const onPressResendOTP = () => {
    setOtpTimer(OTP_TIMER);
    Toast.show({
      type: 'success',
      text1: 'OTP has been sent successfully',
      visibilityTime: 2000,
    });
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    startTimer();
  };

  const onPressEdit = () => {
    if (params.screen === 'signup') {
      navigation.replace(AuthScreens.SignupScreen, params.data);
    } else {
      navigation.replace(AuthScreens.SigninScreen, params.data);
    }
  };

  const onPressVerifyOTP = () => {
    if (params.showCreatePass) {
      navigation.navigate('PasswordScreen', {
        screenMode: 'createPass',
        token: 'mock-token',
      });
      return;
    }

    if (params.screen === 'signin') {
      if (otp.length !== 6) {
        Toast.show({
          type: 'error',
          text1: 'Please enter 6-digit OTP',
          visibilityTime: 2000,
        });
        return;
      }
      const mobileNumber = params.data?.mobileNumber || params.data?.mobile || '';
      // Fresh sign-in: drop any stale product context before OTP verify completes
      dispatch(clearProductContext());
      dispatch(
        signinOtpVerifyRequest({
          payload: { mobile_number: mobileNumber, otp },
          callbackSuccess: (user: ILmsUser) => {
            Toast.show({
              type: 'success',
              text1: 'OTP verified successfully',
              visibilityTime: 2000,
            });
            navigation.replace(AuthScreens.SuccessScreen, {
              authMode: 'signin',
              firstName: user.first_name,
              lastName: user.last_name,
            });
          },
          callbackError: errorMessage => {
            Toast.show({
              type: 'error',
              text1: errorMessage || 'Verification failed',
              visibilityTime: 3000,
            });
          },
        }),
      );
      return;
    }

    const mockUserData = getMockUserData();
    dispatch(
      userActions.setUserInfo({
        id: mockUserData.id,
        email: mockUserData.email,
        first_name: mockUserData.first_name,
        last_name: mockUserData.last_name,
        mobile_number: mockUserData.mobile_number,
      }),
    );
    Toast.show({
      type: 'success',
      text1: 'OTP verified successfully',
      visibilityTime: 2000,
    });
    navigation.replace('SuccessScreen', {
      authMode: 'signup',
      firstName: mockUserData.first_name,
      lastName: mockUserData.last_name,
    });
  };

  return (
    <Container>
      <View style={styles.flex1}>
        <Header
          title={Strings.verifyEmail}
          customSubtitle={
            <View style={styles.subTitleContainer}>
              <Text style={styles.subTitle}>{Strings.weJustSentCode}</Text>
              <Text
                numberOfLines={1}
                style={[styles.subTitle, styles.subTitleInfo]}>
                {params.screen === 'signin'
                  ? params.data.mobileNumber
                  : params.data.email}
              </Text>
              <TouchableOpacity
                style={styles.editContainer}
                onPress={onPressEdit}>
                <EditIcon height={scaleHeight(10)} width={scaleWidth(10)} />
                <Text style={styles.editText}>{Strings.edit}</Text>
              </TouchableOpacity>
            </View>
          }
        />
        <View style={styles.otpContainer}>
          <OtpInput
            value={otp}
            onTextChange={setOtp}
            numberOfDigits={6}
            type="numeric"
            autoFocus={true}
            blurOnFilled={true}
            textInputProps={{
              accessibilityLabel: 'One-Time Password',
            }}
            theme={{
              pinCodeContainerStyle: styles.pinCodeContainerStyle,
              pinCodeTextStyle: styles.pinCodeTextStyle,
              focusedPinCodeContainerStyle: styles.focusedPinCodeContainerStyle,
              focusStickStyle: styles.focusStickStyle,
            }}
          />
          <Button
            buttonText={'Verify'}
            style={styles.verifyButton}
            onPress={onPressVerifyOTP}
            showLoader={isLoading}
            disabled={isLoading}
          />
        </View>
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>{Strings.didNotGetOTP}</Text>
          <TouchableOpacity disabled={otpTimer > 0} onPress={onPressResendOTP}>
            <Text style={[styles.resendText, styles.resendTextColor]}>
              {Strings.resendOTP}{' '}
              {otpTimer > 0
                ? `${Strings.in} ${otpTimer} ${Strings.seconds}`
                : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.versionInfoContainer}>
        <Text style={styles.versionInfoText}>{APP_VERSION_DISPLAY}</Text>
      </View>
      <TnCFooter navigation={navigation} />
    </Container>
  );
};

const styles = StyleSheet.create({
  flex1: {flex: 1},
  subTitleContainer: {
    flexDirection: 'row',
    marginTop: scaleHeight(8),
  },
  subTitle: {
    fontSize: scaleFont(12),
    color: Colors.gray600,
    fontFamily: Fonts.GilroyMedium,
  },
  subTitleInfo: {
    color: Colors.tertiaryColor,
    flex: 1,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginStart: scaleWidth(12),
    gap: scaleWidth(4),
  },
  editText: {
    color: 'rgba(0, 0, 0, 0.52)',
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
  },
  otpContainer: {
    marginHorizontal: scaleWidth(43),
    marginTop: scaleHeight(119),
  },
  resendContainer: {
    marginTop: scaleHeight(40),
    justifyContent: 'center',
    flexDirection: 'row',
    marginHorizontal: scaleWidth(32),
  },
  resendText: {
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkGray,
    fontSize: scaleFont(16),
  },
  resendTextColor: {
    color: Colors.tertiaryColor,
  },
  pinCodeContainerStyle: {
    borderWidth: 2,
    borderColor: Colors.gray500,
    borderRadius: 0,
    height: scaleWidth(30),
    width: scaleWidth(30),
  },
  pinCodeTextStyle: {
    fontSize: scaleFont(12),
  },
  focusedPinCodeContainerStyle: {
    borderColor: Colors.gray500,
  },
  focusStickStyle: {
    backgroundColor: Colors.primaryColor,
    height: scaleWidth(20),
  },
  verifyButton: {
    marginTop: scaleHeight(20),
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
