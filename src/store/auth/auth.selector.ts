import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '@store/app/store';

const _selectState = (state: RootState) => state.auth;
const getUserType = createSelector(_selectState, _state => _state.userType);

const getGlobalLoader = createSelector(
  _selectState,
  _state => _state.globalLoader,
);

const getLoggedInState = createSelector(
  _selectState,
  _state => _state.isLoggedIn,
);

export default {
  getUserType,
  getGlobalLoader,
  getLoggedInState,
};
