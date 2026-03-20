import React, {useEffect, useMemo} from 'react';
import {Container, Header} from '@components/index';
import {BackHandler, StyleSheet, Text, View} from 'react-native';
import {AuthScreens, Colors, Fonts, StorageKeys} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import LottieView from 'lottie-react-native';
import {successLottie} from '@assets/Lottie';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useDispatch} from 'react-redux';
import moment from 'moment';
import {authActions} from '@store/auth';
import {setStorage} from '@services/localStorage';
import {fetchUserScopeRequest, setProgramScope} from '@store/programSelection/programSelection.slice';

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

  const message = useMemo(() => {
    const firstName = (params.firstName ?? '').trim();
    const lastName = (params.lastName ?? '').trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    switch (params.authMode) {
      case 'signin': {
        return fullName
          ? `Welcome back, ${fullName}\nYou are now signed in.`
          : `Welcome back,\nYou are now signed in.`;
      }
      case 'signup': {
        return fullName
          ? `Welcome aboard, ${fullName}\nYour account is now created.`
          : `Welcome aboard,\nYour account is now created.`;
      }
      case 'password':
        return 'Your password has been updated.';
    }
  }, [params.authMode, params.firstName, params.lastName]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    const timer = setTimeout(() => {
      if (params.authMode === 'signin') {
        dispatch(authActions.setIsLoggedIn(true));
        setStorage(StorageKeys.IS_LOGGED_IN, true);
        // Default to All Program; user can change via breadcrumb when needed
        dispatch(setProgramScope('all'));
        dispatch(fetchUserScopeRequest());
        // Navigate directly to Home (skip role/program selection)
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'HomeNavigator',
            },
          ],
        });
        clearTimeout(timer);
        return;
      }
      if (params.authMode === 'signup') {
        navigation.reset({
          routes: [
            {
              name: 'SigninScreen',
            },
          ],
          index: 0,
        });
        return;
      }
      navigation.goBack();
      clearTimeout(timer);
    }, 2500);

    return () => backHandler.remove();
  }, [params.authMode]);

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
