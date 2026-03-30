import {createSelector} from '@reduxjs/toolkit';
import {DPDState} from './dpd.types';

const selectDPDState = (state: any): DPDState => state.dpd;

export const selectDPDList = createSelector(
  [selectDPDState],
  dpdState => dpdState.dpdList,
);

export const selectDPDLoading = createSelector(
  [selectDPDState],
  dpdState => dpdState.loading,
);

export const selectDPDError = createSelector(
  [selectDPDState],
  dpdState => dpdState.error,
);
