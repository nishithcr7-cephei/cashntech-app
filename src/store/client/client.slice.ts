import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  BasicDetailsType,
  ClientsDetailsType,
  ClientsFilterResponseDatum,
  ClientState,
  FirmDetailsType,
  IFilterPayload,
  IFilterResponseDatum,
  IRemarkReportResponseDatum,
  ITaskHistoryResponseDatum,
  ITaskRecordsFilterPayload,
  ITaskReordsFilterResponseDatum,
  VendorDetailsType,
  VisitDetailsType,
  Salesman,
} from './client.types';
import {PayloadWithCallback} from '@type/global.types';

const basicDetails: BasicDetailsType = {
  sourceOfLead: '',
  firmName: '',
  city: '',
  state: undefined,
  pincode: '',
  location: '',
  dateOfVisit: undefined,
  productType: '',
  programType: '',
  address: '',
  filedBy: '',
  salesmanId: undefined,
};

const clientsDetails: ClientsDetailsType = [
  {
    key: Math.random().toString(36).substring(7),
    id: undefined,
    clientType: '',
    nameOfClient: '',
    contactNumber: '',
    email: '',
    createdBy: '',
  },
];

const firmDetails: FirmDetailsType = {
  firmType: '',
  dateOfCorporation: undefined,
  businessVintage: '',
  industry: '',
  sector: '',
  rating: '',
  bankName: [], // Ensure this is truly empty, not containing empty strings
  cibilScore: '',
  facilityType: [], // Changed to array to support multiple facility types
  annualTurnover: '',
  existingFundingSanctionedAmount: '',
  estimatedFundingRequired: '',
  creditPeriodOffer: '',
  createdBy: '',
};

const vendorDetails: VendorDetailsType = [
  {
    key: Math.random().toString(36).substring(7),
    vendorName: '',
    address: '',
    city: '',
    pinCode: '',
    productCategory: [],
    productType: [],
    state: undefined,
    vendorContactNumber: '',
    vendorContactEmail: '',
    monthlySalesValue: '',
  },
];

const visitDetails: VisitDetailsType = {
  dateOfNextVisit: undefined,
  intent: undefined,
  reasonForNotInterested: '',
  interestedFor: [],
  userResponse: undefined,
};

const initialState: ClientState = {
  // Client Info List screen
  clientLoader: false,
  clientList: [],
  cityList: [],
  // Client Information Form Data
  clientFormId: undefined,
  masterBankList: [],
  basicDetails: basicDetails,
  firmDetails: firmDetails,
  vendorDetails: vendorDetails,
  visitDetails: visitDetails,

  clientsDetails: clientsDetails,
  isSavedClientsDetails: false,
  isSavedFirmDetails: false,
  isSavedVendorDetails: false,
  isSavedVisitDetails: false,

  // Location options from pincode API
  locationOptions: [],
  locationLoading: false,

  // Postal code options for vendor forms
  postalCodeOptions: [],
  postalCodeLoading: false,

  //Remark Report fields
  reportLoader: false,
  reportList: [],
  
  // Client-specific Remark Report fields
  clientRemarkReportLoader: false,
  clientRemarkReportList: [],
  //Task History fields
  TaskHistoryLoader: false,
  TaskHistoryList: [],
  //Basic Detail fields
  basicLoader: false,
  clientId: null,
  // Filterbox
  FilterboxLoading: false,
  FilterboxData: null,
  FilterboxError: null,
  // Task Records Filter
  TaskRecordsFilterLoading: false,
  TaskRecordsFilterData: null,
  TaskRecordsFilterError: null,
  // Client
  clientDetails: null,
  clientDetailsLoading: false,
  clientDetailsError: null,
  
  // SoftSanction Bank Method
  SoftSanctionLoading: false,
  SoftSanctionData: [],
  SoftSanctionError: null,
  
  // SoftSanction Bank Product
  SoftSanctionBNKPROLoading: false,
  SoftSanctionBNKPROData: [],
  SoftSanctionBNKPROError: null,
  
  // Ruleset
  rulesetLoading: false,
  rulesetData: [],
  rulesetError: null,
  
  // Soft Sanction Client
  softSanctionClientLoading: false,
  softSanctionClientList: [],
  softSanctionClientError: null,
  
  // Soft Sanction Fields
  softSanctionFields: {},
  softSanctionFieldsLoading: false,
  softSanctionFieldsError: null,
  
  // Soft Sanction Result
  softSanctionResult: null,
  softSanctionResultLoading: false,
  softSanctionResultError: null,
  
  // Generic error holder (used by deleteClientFailure and others)
  error: null,

  // Salesman list
  salesmanList: [],
  salesmanListLoading: false,
  salesmanListError: null,

};

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    // Set Client Loader
    setClientLoader: (state, action: PayloadAction<boolean>) => {
      console.log('=== Redux setClientLoader action ===');
      console.log('Previous clientLoader:', state.clientLoader);
      console.log('New clientLoader:', action.payload);
      state.clientLoader = action.payload;
      console.log('clientLoader updated in state');
      console.log('====================================');
    },
    // City List
    getCityList: state => {
      state.clientLoader = true;
    },
    setCityList: (state, action: PayloadAction<Array<string>>) => {
      state.cityList = action.payload;
    },
    // Get Client from api
    getClients: (state, action: PayloadAction<Record<string, string[]>>) => {
      console.log('=== Redux getClients action ===');
      console.log('Action payload:', action.payload);
      console.log('Setting clientLoader to true');
      state.clientLoader = true;
      console.log('================================');
    },
    setClientList: (
      state,
      action: PayloadAction<Array<ClientsFilterResponseDatum>>,
    ) => {
      console.log('=== Redux setClientList action ===');
      console.log('Previous clientList length:', state.clientList.length);
      console.log('New clientList payload:', action.payload);
      console.log('New clientList length:', action.payload.length);
      state.clientList = action.payload;
      console.log('clientList updated in state');
      console.log('==================================');
    },
    saveClientFormId: (state, action: PayloadAction<number>) => {
      state.clientFormId = action.payload;
    },
    // Reset All Client Form Data
    resetAllClientFormData: state => {
      state.clientLoader = false;
      state.basicDetails = initialState.basicDetails;
      state.clientsDetails = initialState.clientsDetails;
      state.isSavedClientsDetails = initialState.isSavedClientsDetails;
      state.firmDetails = initialState.firmDetails;
      state.isSavedFirmDetails = initialState.isSavedFirmDetails;
      state.vendorDetails = initialState.vendorDetails;
      state.isSavedVendorDetails = initialState.isSavedVendorDetails;
      state.visitDetails = initialState.visitDetails;
      state.isSavedVisitDetails = initialState.isSavedVisitDetails;
      state.clientFormId = undefined;
    },
    // Edit function
    prepareClientForEdit: (state, _action: PayloadAction<number>) => {
      state.clientLoader = true;
    },
    // Delete function
    deleteClientRequest: (
      state,
      _action: PayloadAction<{id: number; deleted_by: string}>,
    ) => {
      state.clientLoader = true;
    },
    // Basic Details
    setBasicDetails: (
      state,
      action: PayloadAction<Partial<BasicDetailsType>>,
    ) => {
      state.basicDetails = {...state.basicDetails, ...action.payload};
    },
    clearBasicDetails: state => {
      state.basicDetails = initialState.basicDetails;
    },
    saveClientBasicDetails: state => {
      state.clientLoader = true;
    },
    updateClientBasicDetails: state => {
      state.clientLoader = true;
    },
    getClientBasicDetails: (state, _action: PayloadAction<number>) => {
      state.clientLoader = true;
    },
    // Client Details
    setAllClientsDetails: (
      state,
      action: PayloadAction<ClientsDetailsType>,
    ) => {
      state.clientsDetails = action.payload;
    },
    setClientsDetails: (
      state,
      action: PayloadAction<[Partial<ClientsDetailsType[number]>, number]>,
    ) => {
      const [data, index] = action.payload;
      let existingClient = state.clientsDetails[index];
      existingClient = {...existingClient, ...data};
      state.clientsDetails[index] = existingClient;
    },
    addNewClientDetails: state => {
      state.clientsDetails.push({
        key: Math.random().toString(),
        id: undefined,
        nameOfClient: '',
        clientType: '',
        contactNumber: '',
        email: '',
        createdBy: '',
      });
    },
    removeClientDetails: (state, action: PayloadAction<string>) => {
      state.clientsDetails = state.clientsDetails.filter(
        client => client.key !== action.payload,
      );
    },
    clearClientDetails: state => {
      // Reset the editable clientsDetails array (not the singular clientDetails view state)
      state.clientsDetails = initialState.clientsDetails;
    },
    setSavedClientsDetailsStatus: (state, action: PayloadAction<boolean>) => {
      state.isSavedClientsDetails = action.payload;
    },
    saveClientsDetails: state => {
      state.clientLoader = true;
    },
    updateClientsDetails: state => {
      state.clientLoader = true;
    },
    getClientsDetails: (state, _action: PayloadAction<number>) => {
      state.clientLoader = true;
    },
    // Firm Details
    getMasterBankList: state => {
      state.clientLoader = true;
    },
    setMasterBankList: (
      state,
      action: PayloadAction<Array<{id: number; bank_name: string}>>,
    ) => {
      state.clientLoader = false;
      state.masterBankList = action.payload;
    },
    setFirmDetails: (
      state,
      action: PayloadAction<Partial<FirmDetailsType>>,
    ) => {
      state.firmDetails = {...state.firmDetails, ...action.payload};
    },
    clearFirmDetails: state => {
      state.firmDetails = initialState.firmDetails;
    },
    saveFirmDetails: state => {
      state.clientLoader = true;
    },
    setSavedFirmDetailsStatus: (state, action: PayloadAction<boolean>) => {
      state.isSavedFirmDetails = action.payload;
    },
    getFirmDetails: (state, _action: PayloadAction<number>) => {
      state.clientLoader = true;
    },
    // Vendor Details
    setAllVendorDetails: (
      state,
      action: PayloadAction<VendorDetailsType>,
    ) => {
      state.vendorDetails = action.payload;
    },
    setVendorDetails: (
      state,
      action: PayloadAction<[Partial<VendorDetailsType[number]>, number]>,
    ) => {
      const [data, index] = action.payload;
      let existingVendor = state.vendorDetails[index];
      existingVendor = {...existingVendor, ...data};
      state.vendorDetails[index] = existingVendor;
    },
    clearVendorDetails: state => {
      state.vendorDetails = initialState.vendorDetails;
    },
    addNewVendorDetails: state => {
      state.vendorDetails.push({
        key: Math.random().toString(36).substring(7),
        productCategory: [],
        productType: [],
        vendorName: '',
        address: '',
        state: undefined,
        city: '',
        pinCode: '',
        monthlySalesValue: '',
        vendorContactNumber: '',
        vendorContactEmail: '',
      });
    },
    removeVendorDetails: (state, action: PayloadAction<string>) => {
      state.vendorDetails = state.vendorDetails.filter(
        vendor => vendor.key !== action.payload,
      );
    },
    saveVendorDetails: state => {
      state.clientLoader = true;
    },
    setSavedVendorDetailsStatus: (state, action: PayloadAction<boolean>) => {
      state.isSavedVendorDetails = action.payload;
    },
    getVendorDetails: (state, _action: PayloadAction<number>) => {
      state.clientLoader = true;
    },
    // Visit Details
    setVisitDetails: (
      state,
      action: PayloadAction<Partial<VisitDetailsType>>,
    ) => {
      state.visitDetails = {...state.visitDetails, ...action.payload};
    },
    clearVisitDetails: state => {
      state.visitDetails = initialState.visitDetails;
    },
    setSavedVisitDetailsStatus: (state, action: PayloadAction<boolean>) => {
      state.isSavedVisitDetails = action.payload;
    },
    getVisitDetails: (state, _action: PayloadAction<number>) => {
      state.clientLoader = true;
    },
    // Set Client Form Data,
    saveVisitDetails: state => {
      state.clientLoader = true;
    },
    saveVisitDetailsAndSubmit: state => {
      state.clientLoader = true;
    },
    updateVisitDetails: state => {
      state.clientLoader = true;
    },
    deleteClientSuccess: (state, action) => {
      state.clientList = state.clientList.filter(
        client => client.id !== action.payload,
      );
    },
    deleteClientFailure: (state, action) => {
      state.error = action.payload;
    },
    getReport: state => {
      state.reportLoader = true;
    },
    setReportList: (
      state,
      action: PayloadAction<IRemarkReportResponseDatum[]>,
    ) => {
      state.reportLoader = false;
      state.reportList = action.payload;
    },
    resetReportList: state => {
      state.reportList = [];
      state.reportLoader = false;
    },
    
    // Client-specific Remark Report actions
    getClientRemarkReport: (state, action: PayloadAction<string>) => {
      state.clientRemarkReportLoader = true;
    },
    setClientRemarkReportList: (state, action: PayloadAction<any[]>) => {
      state.clientRemarkReportLoader = false;
      state.clientRemarkReportList = action.payload;
    },
    resetClientRemarkReportList: state => {
      state.clientRemarkReportList = [];
      state.clientRemarkReportLoader = false;
    },
    FilterRequest(state, action: PayloadAction<IFilterPayload>) {
      state.FilterboxLoading = true;
      state.FilterboxError = null;
    },
    FilterSucess(state, action: PayloadAction<IFilterResponseDatum>) {
      state.FilterboxLoading = false;
      state.FilterboxData = action.payload;
    },
    FilterFailure(state, action: PayloadAction<string>) {
      state.FilterboxLoading = false;
      state.FilterboxError = action.payload;
    },
    clearFilter(state) {
      state.FilterboxLoading = false;
      state.FilterboxData = null;
      state.FilterboxError = null;
    },
    TaskRecordsFilterRequest(
      state,
      action: PayloadAction<ITaskRecordsFilterPayload>,
    ) {
      state.TaskRecordsFilterLoading = true;
      state.TaskRecordsFilterError = null;
    },
    TaskRecordsFilterSucess(
      state,
      action: PayloadAction<ITaskReordsFilterResponseDatum>,
    ) {
      state.TaskRecordsFilterLoading = false;
      state.TaskRecordsFilterData = action.payload;
    },
    TaskRecordsFailure(state, action: PayloadAction<string>) {
      state.TaskRecordsFilterLoading = false;
      state.TaskRecordsFilterError = action.payload;
    },
    clearTaskRecordsFilter(state) {
      state.TaskRecordsFilterLoading = false;
      state.TaskRecordsFilterData = null;
      state.TaskRecordsFilterError = null;
    },
    getClientDetails: (state, _action: PayloadAction<number>) => {
      state.clientDetailsLoading = true;
      state.clientDetailsError = null;
    },
    setClientDetails: (state, action: PayloadAction<any>) => {
      state.clientDetailsLoading = false;
      state.clientDetails = action.payload;
      state.clientDetailsError = null;
    },
    setClientDetailsError: (state, action: PayloadAction<string>) => {
      state.clientDetailsLoading = false;
      state.clientDetails = null;
      state.clientDetailsError = action.payload;
    },
    // Location options from pincode API
    fetchLocationOptions: (state, _action: PayloadAction<string>) => {
      state.locationLoading = true;
    },
    setLocationOptions: (state, action: PayloadAction<Array<{label: string; value: string}>>) => {
      state.locationLoading = false;
      state.locationOptions = action.payload;
    },
    clearLocationOptions: state => {
      state.locationOptions = [];
      state.locationLoading = false;
    },
    // Postal code options for vendor forms
    fetchPostalCodeOptions: (state, _action: PayloadAction<string>) => {
      state.postalCodeLoading = true;
    },
    setPostalCodeOptions: (state, action: PayloadAction<Array<{label: string; value: string}>>) => {
      state.postalCodeLoading = false;
      state.postalCodeOptions = action.payload;
    },
    clearPostalCodeOptions: state => {
      state.postalCodeOptions = [];
      state.postalCodeLoading = false;
    },
    // Salesman list actions
    fetchSalesmanList: state => {
      state.salesmanListLoading = true;
      state.salesmanListError = null;
    },
    setSalesmanList: (state, action: PayloadAction<Salesman[]>) => {
      state.salesmanListLoading = false;
      state.salesmanList = action.payload;
      state.salesmanListError = null;
    },
    setSalesmanListError: (state, action: PayloadAction<string>) => {
      state.salesmanListLoading = false;
      state.salesmanListError = action.payload;
    },
  },
});

export const {
  getClients,
  setClientLoader,
  setClientList,
  saveClientFormId,
  prepareClientForEdit,
  deleteClientRequest,

  getCityList,
  setCityList,

  setBasicDetails,
  clearBasicDetails,
  saveClientBasicDetails,
  updateClientBasicDetails,
  getClientBasicDetails,

  setAllClientsDetails,
  setClientsDetails,
  setSavedClientsDetailsStatus,
  addNewClientDetails,
  removeClientDetails,
  clearClientDetails,
  saveClientsDetails,
  getClientsDetails,
  updateClientsDetails,

  getMasterBankList,
  setMasterBankList,
  setFirmDetails,
  clearFirmDetails,
  saveFirmDetails,
  setSavedFirmDetailsStatus,
  getFirmDetails,

  setAllVendorDetails,
  setVendorDetails,
  clearVendorDetails,
  addNewVendorDetails,
  removeVendorDetails,
  saveVendorDetails,
  setSavedVendorDetailsStatus,
  getVendorDetails,

  saveVisitDetails,
  saveVisitDetailsAndSubmit,
  updateVisitDetails,
  setVisitDetails,
  clearVisitDetails,
  setSavedVisitDetailsStatus,
  getVisitDetails,

  resetAllClientFormData,

  getReport,
  setReportList,
  resetReportList,
  
  getClientRemarkReport,
  setClientRemarkReportList,
  resetClientRemarkReportList,
  FilterRequest,
  FilterSucess,
  FilterFailure,
  clearFilter,
  TaskRecordsFilterRequest,
  TaskRecordsFilterSucess,
  TaskRecordsFailure,
  clearTaskRecordsFilter,
  getClientDetails,
  setClientDetails,
  setClientDetailsError,
  fetchLocationOptions,
  setLocationOptions,
  clearLocationOptions,
  fetchPostalCodeOptions,
  setPostalCodeOptions,
  clearPostalCodeOptions,
  fetchSalesmanList,
  setSalesmanList,
  setSalesmanListError,
} = clientSlice.actions;
export default clientSlice.reducer;
