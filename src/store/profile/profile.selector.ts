import {createSelector} from '@reduxjs/toolkit';

import {RootState} from '@store/app/store';
import {IClientProfileData, IKycDocumentsData, ISoftSanctionData} from './profile.types';

// Base selector for profile state
const selectProfileState = (state: RootState) => state.profile;

// Client Profile selectors
const getClientProfile = createSelector(
  [selectProfileState],
  (profileState): IClientProfileData | null => profileState.clientProfile,
);

const getClientProfileLoading = createSelector(
  [selectProfileState],
  (profileState): boolean => profileState.clientProfileLoading,
);

const getClientProfileError = createSelector(
  [selectProfileState],
  (profileState): string | null => profileState.clientProfileError,
);

// Soft Sanction selectors
const getSoftSanctionData = createSelector(
  [selectProfileState],
  (profileState): ISoftSanctionData[] | null => profileState.softSanctionData,
);

const getSoftSanctionLoading = createSelector(
  [selectProfileState],
  (profileState): boolean => profileState.softSanctionLoading,
);

const getSoftSanctionError = createSelector(
  [selectProfileState],
  (profileState): string | null => profileState.softSanctionError,
);

// KYC Documents selectors
const getKycDocumentsData = createSelector(
  [selectProfileState],
  (profileState): IKycDocumentsData | null => profileState.kycDocumentsData,
);

const getKycDocumentsLoading = createSelector(
  [selectProfileState],
  (profileState): boolean => profileState.kycDocumentsLoading,
);

const getKycDocumentsError = createSelector(
  [selectProfileState],
  (profileState): string | null => profileState.kycDocumentsError,
);

// Combined selectors for common use cases
const getClientProfileState = createSelector(
  [getClientProfile, getClientProfileLoading, getClientProfileError],
  (profile, loading, error) => ({
    profile,
    loading,
    error,
  }),
);

const getSoftSanctionState = createSelector(
  [getSoftSanctionData, getSoftSanctionLoading, getSoftSanctionError],
  (data, loading, error) => ({
    data,
    loading,
    error,
  }),
);

const getKycDocumentsState = createSelector(
  [getKycDocumentsData, getKycDocumentsLoading, getKycDocumentsError],
  (data, loading, error) => ({
    data,
    loading,
    error,
  }),
);

export default {
  getClientProfile,
  getClientProfileLoading,
  getClientProfileError,
  getClientProfileState,
  getSoftSanctionData,
  getSoftSanctionLoading,
  getSoftSanctionError,
  getSoftSanctionState,
  getKycDocumentsData,
  getKycDocumentsLoading,
  getKycDocumentsError,
  getKycDocumentsState,
};
