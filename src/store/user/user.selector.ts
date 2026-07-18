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

/** Normalized capability from PR3 roleNormalizer (Vendor ≡ Dealer categories). */
export const getUserCapability = createSelector(
  _selectState,
  (user) => user.capability ?? null,
);

const getIsClient = createSelector(
  _selectState,
  (user) => user.is_client
);

/** True when API `user_type` is Cashntech (case-insensitive). */
export const getIsCashntechUserType = createSelector(_selectState, user =>
  String(user.user_type || '')
    .toLowerCase()
    .trim() === 'cashntech',
);

export const getPrimaryPermissionGroupId = createSelector(
  _selectState,
  (user) => {
    const pg = user.permission_group;
    if (!Array.isArray(pg) || pg.length === 0) {
      return null;
    }
    return pg[0]?.id ?? null;
  }
);

export default {
  getUserInfo,
  getFullName,
  getUserRole,
  getUserCapability,
  getIsClient,
  getIsCashntechUserType,
  getPrimaryPermissionGroupId,
};
