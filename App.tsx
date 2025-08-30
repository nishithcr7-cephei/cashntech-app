import React from 'react';
import {Provider} from 'react-redux';
import {MainNavigator} from '@navigation/MainNavigator';
import {store} from '@store/app/store';
import '@services/localStorage';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

function App() {
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
