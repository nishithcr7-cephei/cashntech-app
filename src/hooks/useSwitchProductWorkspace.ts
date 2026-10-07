import {useCallback} from 'react';
import {Alert} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {selectActiveProduct} from '@store/product/product.selectors';
import {setActiveProduct} from '@store/product/product.slice';
import type {ResolvedProduct} from '@store/product/product.types';
import {setProgramScope} from '@store/programSelection/programSelection.slice';
import {fetchPermissionsRequest} from '@store/permissions/permissions.slice';
import {resetInvoiceOverview} from '@store/invoiceOverview/invOverview.slice';
import {resetSOAState} from '@store/soa/soa.slice';
import {resetDealerState} from '@store/soa/dealer/dealer.slice';
import {resetCreditAccountDetails} from '@store/soa/creditAccountDetails/slice';
import {resetInvoiceWorkspace} from '@store/invoice/inv.slice';
import {resetReportState} from '@store/report/report.slice';
import {resetRepaymentState} from '@store/repayment/repayment.slice';
import {resetDPDState} from '@store/dpd/dpd.slice';
import {resetInterestAccrualState} from '@store/interestAccrual/interestAccrual.slice';
import {resetConsolidatedState} from '@store/consolidatedInvoice/consolidatedInvoice.slice';
import {resetToProductHome} from '@navigation/navigationRef';

/**
 * In-app product switch: keep auth, wipe product-scoped state, land on home.
 * Login ProductSelectionScreen must not use this (session bootstrap stays as-is).
 */
export const useSwitchProductWorkspace = () => {
  const dispatch = useDispatch();
  const activeProduct = useSelector(selectActiveProduct);

  const applyWorkspaceSwitch = useCallback(
    (next: ResolvedProduct, targetRoute?: string) => {
      dispatch(setActiveProduct(next));
      dispatch(setProgramScope('all'));
      dispatch(resetInvoiceOverview());
      dispatch(resetSOAState());
      dispatch(resetDealerState());
      dispatch(resetCreditAccountDetails());
      dispatch(resetInvoiceWorkspace());
      dispatch(resetReportState());
      dispatch(resetRepaymentState());
      dispatch(resetDPDState());
      dispatch(resetInterestAccrualState());
      dispatch(resetConsolidatedState());
      dispatch(fetchPermissionsRequest());
      resetToProductHome(targetRoute);
    },
    [dispatch],
  );

  const switchProductWorkspace = useCallback(
    (next: ResolvedProduct) => {
      if (!next?.code || next.code === activeProduct?.code) {
        return false;
      }
      const fromName = activeProduct?.name || 'the current product';
      Alert.alert(
        'Switch product',
        `Switch to ${next.name}? ${fromName} screens will close.`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Switch',
            onPress: () => applyWorkspaceSwitch(next),
          },
        ],
      );
      return true;
    },
    [activeProduct, applyWorkspaceSwitch],
  );

  return {switchProductWorkspace, applyWorkspaceSwitch, activeProduct};
};
