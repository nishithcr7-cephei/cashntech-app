import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '@store/app/store';

const _selectState = (state: RootState) => state.kyc;

const getUploadKycLoading = createSelector(
  _selectState,
  state => state.loading,
);

const getUploadKycData = createSelector(_selectState, state => state.data);

const getUploadKycError = createSelector(_selectState, state => state.error);

const getBankList = createSelector(_selectState, _state => _state.BankList);

const getKycChecked = createSelector(_selectState, _state =>
  _state.kycCheckedList.map(value => value.document_type),
);

const getBusinessChecked = createSelector(_selectState, _state =>
  _state.KycBusinessList, // Direct string array, no mapping needed
);

const getUploadPanLoading = createSelector(
  _selectState,
  state => state.panLoading,
);

const getUploadPanData = createSelector(_selectState, state => state.panData);
const getUploadPanError = createSelector(_selectState, state => state.panError);

const getUploadAdharLoading = createSelector(
  _selectState,
  state => state.adharLoading,
);

const getUploadAdharData = createSelector(
  _selectState,
  state => state.adharData,
);

const getUploadAdharError = createSelector(
  _selectState,
  state => state.adharError,
);

const getUploadResidenceLoading = createSelector(
  _selectState,
  state => state.residenceLoading,
);
const getUploadResidenceData = createSelector(
  _selectState,
  state => state.residenceData,
);
const getUploadResidenceError = createSelector(
  _selectState,
  state => state.residenceError,
);

const getUdhyamLoading = createSelector(
  _selectState,
  state => state.udhyamLoading,
);

const getUdhyamData = createSelector(_selectState, state => state.udhyamData);

const getUdhyamError = createSelector(_selectState, state => state.udhyamError);

const getGstLoading = createSelector(
  _selectState,
  state => state.gstDocLoading,
);

const getGstData = createSelector(_selectState, state => state.gstDocData);

const getGstError = createSelector(_selectState, state => state.gtsDocError);

const getGoDownLoading = createSelector(
  _selectState,
  state => state.goDownLoading,
);

const getGoDownData = createSelector(_selectState, state => state.goDownData);

const getGoDownError = createSelector(_selectState, state => state.goDownError);

const getCompanyPanLoading = createSelector(
  _selectState,
  state => state.CompanyPanLoading,
);

const getCompanyPanData = createSelector(
  _selectState,
  state => state.CompanyPanData,
);

const getCompanyPanError = createSelector(
  _selectState,
  state => state.CompanyPanError,
);

const getCompanyInfoLoading = createSelector(
  _selectState,
  state => state.CompanyInfoLoading,
);

const getCompanyInfoData = createSelector(
  _selectState,
  state => state.CompanyInfoData,
);

const getCompanyInfoError = createSelector(
  _selectState,
  state => state.CompanyInfoError,
);

const getBankStatement = createSelector(
  _selectState,
  _state => _state.BankStatementData,
);

const getBankMasterList = createSelector(_selectState, _state =>
  _state.BankList.map(item => ({
    label: item.bank_name,
    value: item.bank_name,
  })),
);

const getKycClientList = createSelector(_selectState, _state => _state.kycClientList);

// KYC Details Selectors
const getKycDetailsLoading = createSelector(
  _selectState,
  state => state.kycDetailsLoading,
);

const getKycDetailsData = createSelector(_selectState, state => state.kycDetailsData);

const getKycDetailsError = createSelector(_selectState, state => state.kycDetailsError);

// Personal KYC Documents Selectors
const getPersonalKycLoading = createSelector(
  _selectState,
  state => state.personalKycLoading,
);

const getPersonalKycData = createSelector(_selectState, state => state.personalKycData);

const getPersonalKycError = createSelector(_selectState, state => state.personalKycError);

// Bank Statement Info Selectors
const getBankStatementInfoLoading = createSelector(
  _selectState,
  state => state.BankStatementInfoLoading,
);

const getBankStatementInfoData = createSelector(_selectState, state => state.BankStatementInfoData);

const getBankStatementInfoError = createSelector(_selectState, state => state.BankStatementInfoError);

// Individual Bank Statement Detail Selectors
const getBankStatementDetailLoading = createSelector(
  _selectState,
  state => state.BankStatementDetailLoading,
);

const getBankStatementDetailData = createSelector(_selectState, state => state.BankStatementDetailData);

const getBankStatementDetailError = createSelector(_selectState, state => state.BankStatementDetailError);

export default {
  getUploadKycLoading,
  getUploadKycData,
  getUploadKycError,
  getBankList,
  getKycChecked,
  getBusinessChecked,
  getUploadPanLoading,
  getUploadPanData,
  getUploadPanError,
  getUploadAdharLoading,
  getUploadAdharData,
  getUploadAdharError,
  getUploadResidenceLoading,
  getUploadResidenceData,
  getUploadResidenceError,
  getUdhyamLoading,
  getUdhyamData,
  getUdhyamError,
  getGstLoading,
  getGstData,
  getGstError,
  getGoDownLoading,
  getGoDownData,
  getGoDownError,
  getCompanyPanLoading,
  getCompanyPanData,
  getCompanyPanError,
  getCompanyInfoLoading,
  getCompanyInfoData,
  getCompanyInfoError,
  getBankStatement,
  getBankMasterList,
  getKycClientList,
  getKycDetailsLoading,
  getKycDetailsData,
  getKycDetailsError,
  getPersonalKycLoading,
  getPersonalKycData,
  getPersonalKycError,
  getBankStatementInfoLoading,
  getBankStatementInfoData,
  getBankStatementInfoError,
  getBankStatementDetailLoading,
  getBankStatementDetailData,
  getBankStatementDetailError,
};
