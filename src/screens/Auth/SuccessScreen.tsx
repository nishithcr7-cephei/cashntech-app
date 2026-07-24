import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Container, Header} from '@components/index';
import {BackHandler, StyleSheet, Text, View} from 'react-native';
import {AuthScreens, Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import LottieView from 'lottie-react-native';
import {successLottie} from '@assets/Lottie';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useDispatch} from 'react-redux';
import moment from 'moment';
import {bootstrapProductContextRequest} from '@store/auth/auth.slice';
import {setProgramScope} from '@store/programSelection/programSelection.slice';
import type {ProductBootstrapResult} from '@store/auth/auth.types';

const Strings = {
  copyright: `Copyright ${moment().year()}, CashnTech Pvt Ltd., All Rights Reserved`,
};

type SuccessScreenProps = NativeStackScreenProps<
  AuthNavigatorType,
  AuthScreens.SuccessScreen
>;
export const SuccessScreen = ({
  navigation,
  route: {params},
}: SuccessScreenProps) => {
  const dispatch = useDispatch();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [bootstrapResult, setBootstrapResult] =
    useState<ProductBootstrapResult | null>(null);
  const didNavigateRef = useRef(false);

  const message = useMemo(() => {
    const firstName = (params.firstName ?? '').trim();
    const lastName = (params.lastName ?? '').trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    switch (params.authMode) {
      case 'signin': {
        return fullName
          ? `Welcome back, ${fullName}\nYou are now signed in.`
          : 'Welcome back,\nYou are now signed in.';
      }
      case 'signup': {
        return fullName
          ? `Welcome aboard, ${fullName}\nYour account is now created.`
          : 'Welcome aboard,\nYour account is now created.';
      }
      case 'password':
        return 'Your password has been updated.';
    }
  }, [params.authMode, params.firstName, params.lastName]);

  // Start product bootstrap while the success animation plays (signin only).
  useEffect(() => {
    if (params.authMode !== 'signin') {
      return;
    }
    dispatch(
      bootstrapProductContextRequest({
        payload: null,
        callbackSuccess: result => {
          setBootstrapResult(result);
        },
        callbackError: () => {
          // Scope failure must not block DF login
          setBootstrapResult({needsSelection: false});
        },
      }),
    );
  }, [dispatch, params.authMode]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2500);

    return () => {
      backHandler.remove();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (params.authMode !== 'signin') {
      if (!minTimeElapsed || didNavigateRef.current) {
        return;
      }
      didNavigateRef.current = true;
      if (params.authMode === 'signup') {
        navigation.reset({
          routes: [{name: AuthScreens.SigninScreen}],
          index: 0,
        });
        return;
      }
      navigation.goBack();
      return;
    }

    if (!minTimeElapsed || bootstrapResult == null || didNavigateRef.current) {
      return;
    }
    didNavigateRef.current = true;

    dispatch(setProgramScope('all'));

    if (bootstrapResult.needsSelection) {
      navigation.replace(AuthScreens.ProductSelectionScreen, {
        firstName: params.firstName,
        lastName: params.lastName,
      });
      return;
    }

    // DF-only / single product — still pick program before entering home
    navigation.replace('SelectProgramScreen');
  }, [
    bootstrapResult,
    dispatch,
    minTimeElapsed,
    navigation,
    params.authMode,
    params.firstName,
    params.lastName,
  ]);

  return (
    <Container>
      <View style={styles.flex1}>
        <Header title={message} />
        <LottieView
          source={successLottie}
          autoPlay
          loop={false}
          style={styles.checkMark}
        />
      </View>
      <Text style={styles.copyRightText}>{Strings.copyright}</Text>
    </Container>
  );
};

const styles = StyleSheet.create({
  flex1: {flex: 1},
  copyRightText: {
    textAlign: 'center',
    color: Colors.gray200,
    fontFamily: Fonts.GilroyMedium,
    margin: scaleHeight(4),
    fontSize: scaleFont(10),
  },
  checkMark: {
    height: scaleWidth(100),
    width: scaleWidth(100),
    alignSelf: 'center',
    marginTop: scaleHeight(55),
  },
});
