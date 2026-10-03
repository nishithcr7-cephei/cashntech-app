import {CommonActions, createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/**
 * Close product-scoped screens and land on the new product workspace.
 * Defaults to the product home; pass a drawer route to open that screen instead.
 */
export function resetToProductHome(targetRoute: string = 'InvoiceDashboard') {
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{name: targetRoute}],
    }),
  );
}
