import React, {useEffect} from 'react';
import {Provider} from 'react-redux';
import {MainNavigator} from '@navigation/MainNavigator';
import {store} from '@store/app/store';
import '@services/localStorage';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Toast, {ErrorToast, InfoToast, ToastConfig} from 'react-native-toast-message';
import {initializeML} from '@utils/mlInitialization';

const toastConfig: ToastConfig = {
  error: props => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#DC2626',
        height: undefined,
        minHeight: 60,
        paddingVertical: 12,
      }}
      contentContainerStyle={{paddingHorizontal: 15}}
      text1NumberOfLines={2}
      text2NumberOfLines={0}
    />
  ),
  info: props => (
    <InfoToast
      {...props}
      style={{
        borderLeftColor: '#2563EB',
        height: undefined,
        minHeight: 60,
        paddingVertical: 12,
      }}
      contentContainerStyle={{paddingHorizontal: 15}}
      text1NumberOfLines={2}
      text2NumberOfLines={0}
    />
  ),
};

function App() {
  // Initialize ML capabilities (TensorFlow.js) in background
  useEffect(() => {
    // Initialize asynchronously to not block app startup
    initializeML().catch(error => {
      console.warn('ML initialization failed, continuing with fallback parsing:', error);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <MainNavigator />
        <Toast topOffset={80} config={toastConfig} />
      </Provider>
    </SafeAreaProvider>
  );
}

export default App;
