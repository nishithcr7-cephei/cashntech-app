import {NavigationContainer} from '@react-navigation/native';
import {SplashScreen} from '@screens/index';
import React from 'react';
import {HomeNavigator} from './HomeNavigator';
import {useAuth} from '@hooks/index';
import {AuthNavigator} from './AuthNavigator';

export const MainNavigator = () => {
  const {isInitialized, isLoggedIn} = useAuth();
  
  if (!isInitialized) {
    return <SplashScreen />;
  }

  const linking = {
    prefixes: ['cashntech://', 'https://losapidev.cashntech.com/'],
    config: {
      screens: {
        PasswordScreen: {
          path: 'reset-password',
        },
      },
    },
  };

  return (
    <NavigationContainer linking={linking}>
      {isLoggedIn ? <HomeNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
