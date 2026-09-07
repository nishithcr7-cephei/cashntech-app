import {NavigationContainer} from '@react-navigation/native';
import React from 'react';
import {HomeNavigator} from './HomeNavigator';
import {useAuth} from '@hooks/index';
import {AuthNavigator} from './AuthNavigator';
import {API_URL} from '@config/config';
import {navigationRef} from './navigationRef';

export const MainNavigator = () => {
  const {isInitialized, isLoggedIn} = useAuth();
  const webPrefix = API_URL ? `${API_URL.replace(/\/+$/, '')}/` : undefined;

  const linking = {
    prefixes: ['cashntech://', webPrefix].filter(Boolean) as string[],
    config: {
      screens: {
        PasswordScreen: {
          path: 'reset-password',
        },
      },
    },
  };

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      {isInitialized ? (
        isLoggedIn ? <HomeNavigator /> : <AuthNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};
