import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '@store/app/store';

const _selectState = (state: RootState) => state.user;

const getUserInfo = createSelector(
  (state: RootState) => state,
  (state) => state.user
);

const getFullName = createSelector(
  _selectState,
  (user) => `${user.first_name} ${user.last_name}`
);

const getUserRole = createSelector(
  _selectState,
  (user) => user.appRole
);

export default {
  getUserInfo,
  getFullName,
  getUserRole
};
