import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '@store/app/store';

const _selectState = (state: RootState) => state.user;

const getUserInfo = createSelector(
  _selectState,
  (user) => user
);

const getFullName = createSelector(
  _selectState,
  (user) => `${user.first_name} ${user.last_name}`
);

export default {
  getUserInfo,
  getFullName
};
