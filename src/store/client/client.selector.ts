import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '@store/app/store';

const _selectState = (state: RootState) => state.client;

const getClientLoader = createSelector(
  _selectState,
  _state => _state.clientLoader,
);
const getClientList = createSelector(_selectState, _state => _state.clientList);
const getCityList = createSelector(_selectState, _state => _state.cityList);
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

const getLeadProgress = createSelector(_selectState, _state => _state.leadList);
const getLeadLoader = createSelector(_selectState, _state => _state.leadLoader);

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

const getUplaodpanLoading = createSelector(
  _selectState,
  state => state.panLoading,
);

const getUplaodpanData = createSelector(_selectState, state => state.panData);
const getUplaodpanError = createSelector(_selectState, state => state.panError);

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

const getUplaodResidenceLoading = createSelector(
  _selectState,
  state => state.residenceLoading,
);
const getUplaodResidenceData = createSelector(
  _selectState,
  state => state.residenceData,
);
const getUplaodResidenceError = createSelector(
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

const getSoftSanctionMethod = createSelector(
  _selectState,
  _state => _state.SoftSanctionData,
);

const getSoftSanctionBnkPro = createSelector(
  _selectState,
  _state => _state.SoftSanctionBNKPROData,
);

const getFilterbox = createSelector(
  _selectState,
  _state => _state.FilterboxData,
);

const getTaskRecordsFilter = createSelector(
  _selectState,
  _state => _state.TaskRecordsFilterData,
);

const getSoftSanctionRuleset = createSelector(
  _selectState,
  _state => _state.rulesetData,
);
const getSoftSanctionRulesetLoading = createSelector(
  _selectState,
  _state => _state.rulesetLoading,
);
const getSoftSanctionRulesetError = createSelector(
  _selectState,
  _state => _state.rulesetError,
);

const getSoftSanctionClientList = createSelector(
  _selectState,
  _state => _state.softSanctionClientList,
);
const getSoftSanctionClientLoading = createSelector(
  _selectState,
  _state => _state.softSanctionClientLoading,
);
const getSoftSanctionClientError = createSelector(
  _selectState,
  _state => _state.softSanctionClientError,
);

export const getSoftSanctionFields = (state: {client: any}) =>
  state.client.softSanctionFields;
export const getSoftSanctionFieldsLoading = (state: {client: any}) =>
  state.client.softSanctionFieldsLoading;
export const getSoftSanctionFieldsError = (state: {client: any}) =>
  state.client.softSanctionFieldsError;

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

const getLeadProgressDetails = createSelector(
  _selectState,
  _state => _state.leadProgressDetails,
);
const getLeadProgressDetailsLoading = createSelector(
  _selectState,
  _state => _state.leadProgressDetailsLoading,
);
const getLeadProgressDetailsError = createSelector(
  _selectState,
  _state => _state.leadProgressDetailsError,
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
  getLeadProgress,
  getLeadLoader,
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
  getUplaodpanLoading,
  getUplaodpanData,
  getUplaodpanError,
  getUploadAdharLoading,
  getUploadAdharData,
  getUploadAdharError,
  getUplaodResidenceLoading,
  getUplaodResidenceData,
  getUplaodResidenceError,
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
  getSoftSanctionMethod,
  getSoftSanctionBnkPro,
  getFilterbox,
  getTaskRecordsFilter,
  getSoftSanctionRuleset,
  getSoftSanctionRulesetLoading,
  getSoftSanctionRulesetError,
  getSoftSanctionClientList,
  getSoftSanctionClientLoading,
  getSoftSanctionClientError,
  getSoftSanctionFields,
  getSoftSanctionFieldsLoading,
  getSoftSanctionFieldsError,
  getBankStatement,
  getClientDetails,
  getClientDetailsLoading,
  getClientDetailsError,
  getLeadProgressDetails,
  getLeadProgressDetailsLoading,
  getLeadProgressDetailsError,
};
