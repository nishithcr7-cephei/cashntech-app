import {NavigationContainer} from '@react-navigation/native';
import React, {useCallback} from 'react';
import {StyleSheet, View} from 'react-native';
import {HomeNavigator} from './HomeNavigator';
import {useAuth, useSessionTimeout} from '@hooks/index';
import {AuthNavigator} from './AuthNavigator';
import {API_URL} from '@config/config';
import {navigationRef} from './navigationRef';
import {SessionTimeoutWarning} from '@components/SessionTimeoutWarning';
import {markActivity} from '@utils/sessionActivity';

export const MainNavigator = () => {
  const {isInitialized, isLoggedIn} = useAuth();
  const sessionActive = isInitialized && !!isLoggedIn;
  const {warningVisible, secondsLeft, continueSession, logoutNow} =
    useSessionTimeout(sessionActive);
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

  // Returning false keeps taps/scrolls flowing to children untouched.
  const recordActivity = useCallback(() => {
    if (sessionActive) {
      markActivity();
    }
    return false;
  }, [sessionActive]);

  return (
    <View
      style={styles.root}
      onStartShouldSetResponderCapture={recordActivity}
      onMoveShouldSetResponderCapture={recordActivity}>
      <NavigationContainer ref={navigationRef} linking={linking}>
        {isInitialized ? (
          isLoggedIn ? <HomeNavigator /> : <AuthNavigator />
        ) : (
          <AuthNavigator />
        )}
      </NavigationContainer>
      <SessionTimeoutWarning
        visible={sessionActive && warningVisible}
        secondsLeft={secondsLeft}
        onContinue={continueSession}
        onLogout={logoutNow}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
