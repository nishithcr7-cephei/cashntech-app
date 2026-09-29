import React, {useEffect} from 'react';
import {Provider, useSelector} from 'react-redux';
import {MainNavigator} from '@navigation/MainNavigator';
import {store} from '@store/app/store';
import '@services/localStorage';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import Toast, {ErrorToast, InfoToast, ToastConfig} from 'react-native-toast-message';
import {initializeML} from '@utils/mlInitialization';
import {BusyOverlay} from '@components/index';
import {
  selectLeavingCreateInvoice,
  selectOpeningCreateInvoice,
} from '@store/ui';

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

function AppShell() {
  const leavingCreateInvoice = useSelector(selectLeavingCreateInvoice);
  const openingCreateInvoice = useSelector(selectOpeningCreateInvoice);
  const insets = useSafeAreaInsets();
  const showCreateInvoiceTransition =
    leavingCreateInvoice || openingCreateInvoice;

  return (
    <>
      <MainNavigator />
      <Toast topOffset={insets.top + 80} config={toastConfig} />
      <BusyOverlay
        visible={showCreateInvoiceTransition}
        message={
          leavingCreateInvoice
            ? 'Going back to invoices…'
            : 'Opening create invoice…'
        }
      />
    </>
  );
}

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
        <AppShell />
      </Provider>
    </SafeAreaProvider>
  );
}

export default App;
