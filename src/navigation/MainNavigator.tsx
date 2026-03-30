import {NavigationContainer} from '@react-navigation/native';
import React from 'react';
import {HomeNavigator} from './HomeNavigator';
import {useAuth} from '@hooks/index';
import {AuthNavigator} from './AuthNavigator';

export const MainNavigator = () => {
  const {isInitialized, isLoggedIn} = useAuth();

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
      {isInitialized ? (
        isLoggedIn ? <HomeNavigator /> : <AuthNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};
