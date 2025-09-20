import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {IClientProfileData, IKycDocumentsData, ISoftSanctionData, ProfileState} from './profile.types';

const initialState: ProfileState = {
  clientProfile: null,
  clientProfileLoading: false,
  clientProfileError: null,
  softSanctionData: null,
  softSanctionLoading: false,
  softSanctionError: null,
  kycDocumentsData: null,
  kycDocumentsLoading: false,
  kycDocumentsError: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    // Client Profile
    getClientProfile: (state, _action: PayloadAction<string | number>) => {
      state.clientProfileLoading = true;
      state.clientProfileError = null;
    },
    setClientProfile: (state, action: PayloadAction<IClientProfileData>) => {
      state.clientProfileLoading = false;
      state.clientProfile = action.payload;
      state.clientProfileError = null;
    },
    setClientProfileError: (state, action: PayloadAction<string>) => {
      state.clientProfileLoading = false;
      state.clientProfile = null;
      state.clientProfileError = action.payload;
    },
    clearClientProfile: state => {
      state.clientProfile = null;
      state.clientProfileLoading = false;
      state.clientProfileError = null;
    },
    // Soft Sanction
    getSoftSanctionDetails: (state, _action: PayloadAction<string | number>) => {
      state.softSanctionLoading = true;
      state.softSanctionError = null;
    },
    setSoftSanctionDetails: (state, action: PayloadAction<ISoftSanctionData[]>) => {
      state.softSanctionLoading = false;
      state.softSanctionData = action.payload;
      state.softSanctionError = null;
    },
    setSoftSanctionError: (state, action: PayloadAction<string>) => {
      state.softSanctionLoading = false;
      state.softSanctionData = null;
      state.softSanctionError = action.payload;
    },
    clearSoftSanctionDetails: state => {
      state.softSanctionData = null;
      state.softSanctionLoading = false;
      state.softSanctionError = null;
    },
    // KYC Documents
    getKycDocuments: (state, _action: PayloadAction<string | number>) => {
      state.kycDocumentsLoading = true;
      state.kycDocumentsError = null;
    },
    setKycDocuments: (state, action: PayloadAction<IKycDocumentsData[]>) => {
      state.kycDocumentsLoading = false;
      // Take the first item from the array if it exists
      state.kycDocumentsData = action.payload && action.payload.length > 0 ? action.payload[0] : null;
      state.kycDocumentsError = null;
    },
    setKycDocumentsError: (state, action: PayloadAction<string>) => {
      state.kycDocumentsLoading = false;
      state.kycDocumentsData = null;
      state.kycDocumentsError = action.payload;
    },
    clearKycDocuments: state => {
      state.kycDocumentsData = null;
      state.kycDocumentsLoading = false;
      state.kycDocumentsError = null;
    },
  },
});

export const {
  getClientProfile,
  setClientProfile,
  setClientProfileError,
  clearClientProfile,
  getSoftSanctionDetails,
  setSoftSanctionDetails,
  setSoftSanctionError,
  clearSoftSanctionDetails,
  getKycDocuments,
  setKycDocuments,
  setKycDocumentsError,
  clearKycDocuments,
} = profileSlice.actions;

export default profileSlice.reducer;
