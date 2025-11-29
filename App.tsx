import React, {useEffect} from 'react';
import {Provider} from 'react-redux';
import {MainNavigator} from '@navigation/MainNavigator';
import {store} from '@store/app/store';
import '@services/localStorage';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {initializeML} from '@utils/mlInitialization';

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
        <Toast topOffset={80}/>
      </Provider>
    </SafeAreaProvider>
  );
}

export default App;
