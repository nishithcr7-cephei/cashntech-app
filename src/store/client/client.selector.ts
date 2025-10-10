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

const getMasterBankDropdown = createSelector(_selectState, _state => {
  const bankMap = new Map();
  _state.masterBankList.forEach(item => {
    if (!bankMap.has(item.bank_name)) {
      bankMap.set(item.bank_name, {
        label: item.bank_name,
        value: item.bank_name,
      });
    }
  });
  return Array.from(bankMap.values());
});

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

const getClientRemarkReport = createSelector(
  _selectState,
  _state => _state.clientRemarkReportList,
);

const getClientRemarkReportLoader = createSelector(
  _selectState,
  _state => _state.clientRemarkReportLoader,
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

const getFilterbox = createSelector(
  _selectState,
  _state => _state.FilterboxData,
);

const getTaskRecordsFilter = createSelector(
  _selectState,
  _state => _state.TaskRecordsFilterData,
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

const getLocationOptions = createSelector(
  _selectState,
  _state => _state.locationOptions,
);

const getLocationLoading = createSelector(
  _selectState,
  _state => _state.locationLoading,
);

const getPostalCodeOptions = createSelector(
  _selectState,
  _state => _state.postalCodeOptions,
);

const getPostalCodeLoading = createSelector(
  _selectState,
  _state => _state.postalCodeLoading,
);

const getSalesmanList = createSelector(
  _selectState,
  _state => _state.salesmanList,
);

const getSalesmanListLoading = createSelector(
  _selectState,
  _state => _state.salesmanListLoading,
);

const getSalesmanListError = createSelector(
  _selectState,
  _state => _state.salesmanListError,
);

const getSalesmanDropdown = createSelector(
  _selectState,
  _state => {
    console.log('Selector: getSalesmanDropdown called');
    console.log('Selector: salesmanList:', _state.salesmanList);
    console.log('Selector: salesmanList length:', _state.salesmanList.length);
    console.log('Selector: salesmanListLoading:', _state.salesmanListLoading);
    
    const dropdownData = _state.salesmanList.map(salesman => ({
      label: `${salesman.first_name} ${salesman.last_name}`,
      value: salesman.id.toString(),
    }));
    
    console.log('Selector: dropdownData:', dropdownData);
    return dropdownData;
  },
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
  getClientRemarkReport,
  getClientRemarkReportLoader,
  getTaskHistory,
  getBasicDetailLoading,
  getBasicDetailError,
  getClientId,
  getFilterbox,
  getTaskRecordsFilter,
  getClientDetails,
  getClientDetailsLoading,
  getClientDetailsError,
  getLocationOptions,
  getLocationLoading,
  getPostalCodeOptions,
  getPostalCodeLoading,
  getSalesmanList,
  getSalesmanListLoading,
  getSalesmanListError,
  getSalesmanDropdown,
};
