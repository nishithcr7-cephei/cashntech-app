import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '@store/app/store';

const _selectState = (state: RootState) => state.client;

const getClientLoader = createSelector(
  _selectState,
  _state => _state.clientLoader,
);
const getClientList = createSelector(_selectState, _state => _state.clientList);
const getCityList = createSelector(_selectState, _state =>
  _state.cityList.filter(Boolean),
);
const getClientFormId = createSelector(
  _selectState,
  _state => _state.clientFormId,
);
const getBasicDetailFormData = createSelector(
  _selectState,
  _state => _state.basicDetails,
);
const getClientDetailsFormData = createSelector(
  _selectState,
  _state => _state.clientsDetails,
);

const getClientsDetailsFormStatus = createSelector(
  _selectState,
  _state => _state.isSavedClientsDetails,
);

const getMasterBankDropdown = createSelector(_selectState, _state =>
  _state.masterBankList.map(item => ({
    label: item.bank_name,
    value: item.bank_name,
  })),
);

const getFirmDetailsFormData = createSelector(
  _selectState,
  _state => _state.firmDetails,
);

const getFirmDetailsFormStatus = createSelector(
  _selectState,
  _state => _state.isSavedFirmDetails,
);

const getVendorDetailsFormData = createSelector(
  _selectState,
  _state => _state.vendorDetails,
);

const getVendorDetailsFormStatus = createSelector(
  _selectState,
  _state => _state.isSavedVendorDetails,
);

const getVisitDetailsFormData = createSelector(
  _selectState,
  _state => _state.visitDetails,
);

const getSavedVisitDetailsStatus = createSelector(
  _selectState,
  _state => _state.isSavedVisitDetails,
);

const getRemarkReport = createSelector(
  _selectState,
  _state => _state.reportList,
);


const getTaskHistory = createSelector(
  _selectState,
  _state => _state.TaskHistoryList,
);

const getBasicDetailLoading = createSelector(
  _selectState,
  state => state.clientLoader,
);

const getBasicDetailError = createSelector(
  _selectState,
  state => state.clientList,
);

const getClientId = createSelector(_selectState, state => state.clientId);

const getUploadKycLoading = createSelector(
  _selectState,
  state => state.loading,
);

const getUploadKycData = createSelector(_selectState, state => state.data);

const getUploadKycError = createSelector(_selectState, state => state.error);

const getBankList = createSelector(_selectState, _state => _state.BankList);

const getkycChecked = createSelector(_selectState, _state =>
  _state.kycCheckedList.map(value => value.document_type),
);

const getBusinessChecked = createSelector(_selectState, _state =>
  _state.KycBusinessList.map(value => value.document_type),
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


const getFilterbox = createSelector(
  _selectState,
  _state => _state.FilterboxData,
);

const getTaskRecordsFilter = createSelector(
  _selectState,
  _state => _state.TaskRecordsFilterData,
);


const getBankStatement = createSelector(
  _selectState,
  _state => _state.BankStatementData,
);

const getClientDetails = createSelector(
  _selectState,
  _state => _state.clientDetails,
);
const getClientDetailsLoading = createSelector(
  _selectState,
  _state => _state.clientDetailsLoading,
);
const getClientDetailsError = createSelector(
  _selectState,
  _state => _state.clientDetailsError,
);



export default {
  getClientLoader,
  getClientList,
  getCityList,
  getClientFormId,

  getBasicDetailFormData,
  getClientDetailsFormData,
  getVendorDetailsFormData,
  getFirmDetailsFormData,
  getVisitDetailsFormData,

  getClientsDetailsFormStatus,
  getFirmDetailsFormStatus,
  getVendorDetailsFormStatus,
  getSavedVisitDetailsStatus,
  getMasterBankDropdown,

  getRemarkReport,
  getTaskHistory,
  getBasicDetailLoading,
  getBasicDetailError,
  getClientId,
  getUploadKycLoading,
  getUploadKycData,
  getUploadKycError,
  getBankList,
  getkycChecked,
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
  getFilterbox,
  getTaskRecordsFilter,
  getBankStatement,
  getClientDetails,
  getClientDetailsLoading,
  getClientDetailsError,
};
