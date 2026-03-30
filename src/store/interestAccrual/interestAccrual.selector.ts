import {createSelector} from '@reduxjs/toolkit';
import {InterestAccrualState} from './interestAccrual.types';

const selectInterestAccrualState = (state: any): InterestAccrualState => state.interestAccrual;

export const selectDailyInterestList = createSelector(
  [selectInterestAccrualState],
  state => state.dailyInterestList,
);

export const selectInterestAccrualList = createSelector(
  [selectInterestAccrualState],
  state => state.interestAccrualList,
);

export const selectInterestAccrualLoading = createSelector(
  [selectInterestAccrualState],
  state => state.loading,
);

export const selectInterestAccrualError = createSelector(
  [selectInterestAccrualState],
  state => state.error,
);
