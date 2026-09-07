import {CommonActions, createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/** Close product-scoped screens and land on the new product home. */
export function resetToProductHome() {
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{name: 'InvoiceDashboard'}],
    }),
  );
}
