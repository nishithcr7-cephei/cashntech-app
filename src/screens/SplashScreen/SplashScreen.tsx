import React, {useEffect} from 'react';
import {LogoImg} from '@assets/Images';
import {Image, StyleSheet} from 'react-native';
import {scaleWidth, scaleHeight} from '@utils/Scale';
import {Container} from '@components/index';
import {useNavigation} from '@react-navigation/native';
import {CommonActions} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {AuthScreens} from '@constants/Screens';

type SplashScreenNavigationProp = NativeStackNavigationProp<AuthNavigatorType>;

export const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();

  useEffect(() => {
    // Navigate to SigninScreen after 2 seconds
    const timer = setTimeout(() => {
      // Force navigation to SigninScreen using reset to clear navigation stack
      const resetAction = CommonActions.reset({
        index: 0,
        routes: [
          {
            name: AuthScreens.SigninScreen,
          },
        ],
      });
      navigation.dispatch(resetAction);
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <Container style={styles.container}>
      <Image source={LogoImg} style={styles.logo} />
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: scaleWidth(215),
    height: scaleHeight(53.5),
    resizeMode: 'contain',
  },
});
