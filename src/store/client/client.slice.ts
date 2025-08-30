import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  BasicDetailsType,
  ClientsDetailsType,
  ClientFormPayload,
  ClientFormType,
  ClientState,
  IBankListResponseDatum,
  IBankStatementPayload,
  IClientInfoResponseDatum,
  IFilterPayload,
  IFilterResponseDatum,
  IKycBusinessResponseDatum,
  IKycCheckedResponseDatum,
  ILeadProgressResponseDatum,
  IRemarkReportResponseDatum,
  IsoftSanctionBankProductDatum,
  IsoftSanctionMethodDatum,
  ISoftSanctionPayload,
  ITaskHistoryResponseDatum,
  ITaskRecordsFilterPayload,
  ITaskReordsFilterResponseDatum,
  IuplaodCompanyPanResponse,
  IUploadAdharDocumentResponse,
  IUploadAdharDocumnetsPayload,
  IUploadCompanyInfoPayload,
  IUploadCompanyInfoResponse,
  IuploadCompanyPanPayload,
  IUploadGodDownDetailsResponse,
  IUploadGoDownDetailsPayload,
  IUploadGstPayload,
  IUploadGstResponse,
  IUploadKycDocumentPayload,
  IUploadKycDocumentResponse,
  IUploadPanDocumentsPayload,
  IUploadPanDocumentsResponse,
  IUploadResidenceDetailsPayload,
  IUploadResidenceDetailsResponse,
  IUploadShareholdingPayload,
  IUploadShareholdingResponse,
  IUploadUdhyamPayload,
  IUploadUdhyamResponse,
} from './client.types';
import {PayloadWithCallback} from '@type/global.types';

const basicDetails: BasicDetailsType = {
  sourceOfLead: '',
  firmName: '',
  city: '',
  state: undefined,
  location: '',
  dateOfVisit: undefined,
  address: '',
};

const clientsDetails: ClientsDetailsType = [
  {
    id: Math.random().toString(),
    clientType: '',
    nameOfClient: '',
    contactNumber: '',
    email: '',
    createdBy: '',
  },
];

const clientFormData: ClientFormType = {
  BasicDetails: {
    firmName: '',
    city: '',
    dateOfVisit: '',
    location: '',
    pincode: '',
    sourceOfLead: '',
    state: '',
    typeOfVisit: '',
    visitNumber: '',
    Fillby: '',
  },
  ClientFirmScreen: {
    bankName: [],
    businessVintage: '',
    cibilScore: '',
    clientName: '',
    contactNumber: '',
    creditPeriod: '',
    estimatedFunding: '',
    facilityType: '',
    sector: '',
    typeOfFirm: '',
    existingFunding: '',
  },
  VendorScreen: {
    Product: '',
    state: '',
    city: '',
    vendorName: '',
    address: '',
    pincode: '',
    vendorContact: '',
    vendorEmail: '',
    monthlySales: '',
  },
  VisitScreen: {
    intent: '',
    interested: '',
    UserResponse: '',
    nextVisitDate: '',
    reason: '',
  },
};

const initialState: ClientState = {
  // Client Info List screen
  clientLoader: false,
  clientList: [],
  // Client Information Form Data
  clientFormId: undefined,
  clientFormData: clientFormData,
  basicDetails: basicDetails,
  clientsDetails: clientsDetails,

  //Remark Report fields
  reportLoader: false,
  reportList: [],
  //Lead Progress fields
  leadLoader: false,
  leadList: [],
  //Task History fields
  TaskHistoryLoader: false,
  TaskHistoryList: [],
  //Basic Detail fields
  basicLoader: false,
  clientId: null,
  // Profile kyc
  loading: false,
  data: null,
  error: null,
  // Bank List
  BankLoader: false,
  BankList: [],
  // Kyc Checked
  KycCheckedLoader: false,
  kycCheckedList: [],
  // Kyc Business Checked
  KycBusinessLoader: false,
  KycBusinessList: [],
  // Pan Kyc
  panLoading: false,
  panData: null,
  panError: null,
  // Adhar Kyc
  adharLoading: false,
  adharData: null,
  adharError: null,
  // Residence Kyc
  residenceLoading: false,
  residenceData: null,
  residenceError: null,
  // Udhyam Kyc
  udhyamLoading: false,
  udhyamData: null,
  udhyamError: null,
  // Gst Kyc
  gstDocLoading: false,
  gstDocData: null,
  gtsDocError: null,
  // GoDown Kyc
  goDownLoading: false,
  goDownData: null,
  goDownError: null,
  // CompanyPan Upload
  CompanyPanLoading: false,
  CompanyPanData: null,
  CompanyPanError: null,
  // Shareholding Kyc
  ShareholdingLoading: false,
  ShareholdingData: null,
  ShareholdingError: null,
  // CompanyInfo Upload
  CompanyInfoLoading: false,
  CompanyInfoData: null,
  CompanyInfoError: null,
  // SoftSanction Bank Method
  SoftSanctionLoading: false,
  SoftSanctionData: [],
  SoftSanctionError: null,
  // SoftSanction BNKPRO
  SoftSanctionBNKPROLoading: false,
  SoftSanctionBNKPROData: [],
  SoftSanctionBNKPROError: null,
  // Filterbox
  FilterboxLoading: false,
  FilterboxData: null,
  FilterboxError: null,
  // Task Records Filter
  TaskRecordsFilterLoading: false,
  TaskRecordsFilterData: null,
  TaskRecordsFilterError: null,
  // Ruleset SoftSanction
  rulesetLoading: false,
  rulesetData: [],
  rulesetError: null,
  // SoftSanction Client
  softSanctionClientLoading: false,
  softSanctionClientList: [],
  softSanctionClientError: null,
  // SoftSanction
  softSanctionFields: {},
  softSanctionFieldsLoading: false,
  softSanctionFieldsError: null,
  // Bank Statement
  BankStatementLoading: false,
  BankStatementData: null,
  BankStatementError: null,
  // Client
  clientDetails: null,
  clientDetailsLoading: false,
  clientDetailsError: null,
  // Lead Progress
  leadProgressDetails: [],
  leadProgressDetailsLoading: false,
  leadProgressDetailsError: null,
};

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    // Set Client Loader
    setClientLoader: (state, action: PayloadAction<boolean>) => {
      state.clientLoader = action.payload;
    },
    // Get Client from api
    getClients: state => {
      state.clientLoader = true;
    },
    setClientList: (
      state,
      action: PayloadAction<Array<IClientInfoResponseDatum>>,
    ) => {
      state.clientLoader = false;
      state.clientList = action.payload;
    },
    saveClientFormId: (state, action: PayloadAction<number>) => {
      state.clientFormId = action.payload;
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
      state.clientLoader = false;
    },
    updateClientBasicDetails: state => {
      state.clientLoader = false;
    },
    // Client Details
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
        id: Math.random().toString(),
        nameOfClient: '',
        clientType: '',
        contactNumber: '',
        email: '',
        createdBy: '',
      });
    },
    removeClientDetails: (state, action: PayloadAction<string>) => {
      state.clientsDetails = state.clientsDetails.filter(
        client => client.id !== action.payload
      );
    },
    clearClientDetails: state => {
      state.clientDetails = initialState.clientDetails;
    },
    saveClientsDetails: state => {
      state.clientLoader = false;
    },

    // Set Client Form Data
    setClientFormData: (state, action: PayloadAction<ClientFormPayload>) => {
      const {formName, name, value} = action.payload;
      if (state.clientFormData[formName]) {
        // @ts-expect-error: name is correctly typed per formName in ClientFormPayload
        state.clientFormData[formName][name] = value;
      }
    },
    resetClientFormData: (
      state,
      action: PayloadAction<keyof ClientFormType>,
    ) => {
      // @ts-expect-error: name is correctly typed per formName in ClientFormPayload
      state.clientFormData[action.payload] = clientFormData[action.payload];
    },
    resetAllClientFormData: state => {
      state.clientFormData = clientFormData;
      state.clientFormId = undefined;
    },
    saveClientFirmDetails: state => {
      state.clientLoader = false;
    },
    saveVendorDetails: (
      state,
      _action: PayloadAction<{clientId: string; vendors: any[]}>,
    ) => {
      state.clientLoader = false;
    },
    saveVisitDetails: state => {
      state.clientLoader = false;
    },
    deleteClientRequest: (state, action) => {},
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
    getLead: state => {
      console.log(
        'Slice: getLead action dispatched, setting leadLoader = true',
      );
      state.leadLoader = true;
    },
    getLeadDesciption: (
      state,
      _payload: PayloadAction<PayloadWithCallback<string, [Array<any>]>>,
    ) => {
      state.leadLoader = true;
    },
    setLeadList: (
      state,
      action: PayloadAction<ILeadProgressResponseDatum[]>,
    ) => {
      console.log(
        'Slice: setLeadList action dispatched, setting leadLoader = false, data length:',
        action.payload?.length || 0,
      );
      state.leadLoader = false;
      state.leadList = action.payload;
    },
    resetLeadList: state => {
      state.leadList = [];
      state.leadLoader = false;
    },
    getTaskHistory: state => {
      state.TaskHistoryLoader = true;
    },
    setTaskHistoryList: (
      state,
      action: PayloadAction<ITaskHistoryResponseDatum[]>,
    ) => {
      state.TaskHistoryLoader = false;
      state.TaskHistoryList = action.payload;
    },
    resetTaskHistoryList: state => {
      state.TaskHistoryList = [];
      state.TaskHistoryLoader = false;
    },
    uploadKycRequest(state, action: PayloadAction<IUploadKycDocumentPayload>) {
      state.loading = true;
      state.error = null;
    },
    uploadKycSuccess(state, action: PayloadAction<IUploadKycDocumentResponse>) {
      state.loading = false;
      state.data = action.payload;
    },
    uploadKycFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    clearUploadKyc(state) {
      state.loading = false;
      state.data = null;
      state.error = null;
    },
    setBankLoader: (state, action: PayloadAction<boolean>) => {
      state.BankLoader = action.payload;
    },
    getBankList: state => {
      state.BankLoader = true;
    },
    setBankList: (
      state,
      action: PayloadAction<Array<IBankListResponseDatum>>,
    ) => {
      state.BankLoader = false;
      state.BankList = action.payload;
    },
    resetBankList: state => {
      state.BankList = [];
      state.BankLoader = false;
    },
    setKycCheckedLoader: (state, action: PayloadAction<boolean>) => {
      state.KycCheckedLoader = action.payload;
    },
    getKycChecked: (state, action: PayloadAction<string>) => {
      state.KycCheckedLoader = true;
    },
    setKycCheckedList: (
      state,
      action: PayloadAction<Array<IKycCheckedResponseDatum>>,
    ) => {
      state.KycCheckedLoader = false;
      state.kycCheckedList = action.payload;
    },
    resetKycCheckedList: state => {
      state.kycCheckedList = [];
      state.KycCheckedLoader = false;
    },
    setKycBusinessLoader: (state, action: PayloadAction<boolean>) => {
      state.KycBusinessLoader = action.payload;
    },
    getKycBusinessChecked: (state, action: PayloadAction<string>) => {
      state.KycBusinessLoader = true;
    },
    setKycBusinessCheckedList: (
      state,
      action: PayloadAction<Array<IKycBusinessResponseDatum>>,
    ) => {
      (state.KycBusinessLoader = false),
        (state.KycBusinessList = action.payload);
    },
    resetKycBusinessList: state => {
      state.KycBusinessList = [];
      state.KycBusinessLoader = false;
    },
    uploadPanRequest(state, action: PayloadAction<IUploadPanDocumentsPayload>) {
      state.panLoading = true;
      state.panError = null;
    },
    uploadPanSuccess(
      state,
      action: PayloadAction<IUploadPanDocumentsResponse>,
    ) {
      state.panLoading = false;
      state.panData = action.payload;
    },
    uploadPanFailure(state, action: PayloadAction<string>) {
      state.panLoading = false;
      state.panError = action.payload;
    },
    clearPanUpload(state) {
      state.panLoading = false;
      state.panData = null;
      state.panError = null;
    },
    uploadAdharRequest(
      state,
      action: PayloadAction<IUploadAdharDocumnetsPayload>,
    ) {
      state.adharLoading = true;
      state.adharError = null;
    },
    uploadAdharSuccess(
      state,
      action: PayloadAction<IUploadAdharDocumentResponse>,
    ) {
      state.adharLoading = false;
      state.adharData = action.payload;
    },
    uploadAdharFailure(state, action: PayloadAction<string>) {
      state.adharLoading = false;
      state.adharError = action.payload;
    },
    clearAdhar(state) {
      state.adharLoading = false;
      state.adharData = null;
      state.adharError = null;
    },
    uploadResidenceRequest(
      state,
      action: PayloadAction<IUploadResidenceDetailsPayload>,
    ) {
      state.residenceLoading = true;
      state.residenceError = null;
    },
    uploadResidenceSuccess(
      state,
      action: PayloadAction<IUploadResidenceDetailsResponse>,
    ) {
      state.residenceLoading = false;
      state.residenceData = action.payload;
    },
    uploadResidenceFailure(state, action: PayloadAction<string>) {
      state.residenceLoading = false;
      state.residenceError = action.payload;
    },
    clearUploadResidence(state) {
      state.residenceLoading = false;
      state.residenceData = null;
      state.residenceError = null;
    },
    uploadUdhyamRequest(state, action: PayloadAction<IUploadUdhyamPayload>) {
      state.udhyamLoading = true;
      state.udhyamError = null;
    },
    uploadUdhyamSuccess(state, action: PayloadAction<IUploadUdhyamResponse>) {
      state.udhyamLoading = false;
      state.udhyamData = action.payload;
    },
    uploadUdhyamFailure(state, action: PayloadAction<string>) {
      state.udhyamLoading = false;
      state.udhyamError = action.payload;
    },
    clearUplaodUdhyam(state) {
      state.udhyamLoading = false;
      state.udhyamData = null;
      state.udhyamError = null;
    },
    uploadGstRequest(state, action: PayloadAction<IUploadGstPayload>) {
      state.gstDocLoading = true;
      state.gtsDocError = null;
    },
    uploadGstSuccess(state, action: PayloadAction<IUploadGstResponse>) {
      state.gstDocLoading = false;
      state.gstDocData = action.payload;
    },
    uploadGstfailure(state, action: PayloadAction<string>) {
      state.gstDocLoading = false;
      state.gtsDocError = action.payload;
    },
    clearUplaodGst(state) {
      state.gstDocLoading = false;
      state.gstDocData = null;
      state.gtsDocError = null;
    },
    uploadGoDownRequest(
      state,
      action: PayloadAction<IUploadGoDownDetailsPayload>,
    ) {
      state.goDownLoading = true;
      state.goDownError = null;
    },
    uploadGoDownSuccess(
      state,
      action: PayloadAction<IUploadGodDownDetailsResponse>,
    ) {
      state.goDownLoading = false;
      state.goDownData = action.payload;
    },
    uploadGoDownFailure(state, action: PayloadAction<string>) {
      state.goDownLoading = false;
      state.goDownError = action.payload;
    },
    clearUploadGoDown(state) {
      state.goDownLoading = false;
      state.goDownData = null;
      state.goDownError = null;
    },
    uploadShareholdingRequest(
      state,
      action: PayloadAction<IUploadShareholdingPayload>,
    ) {
      state.ShareholdingLoading = true;
      state.ShareholdingError = null;
    },
    uploadShareholdingSuccess(
      state,
      action: PayloadAction<IUploadShareholdingResponse>,
    ) {
      state.ShareholdingLoading = false;
      state.ShareholdingData = action.payload;
    },
    uploadShareholdingFailure(state, action: PayloadAction<string>) {
      state.ShareholdingLoading = false;
      state.ShareholdingError = action.payload;
    },
    clearShareholding(state) {
      state.ShareholdingLoading = false;
      state.ShareholdingData = null;
      state.ShareholdingError = null;
    },
    uploadCompanyPanRequest(
      state,
      action: PayloadAction<IuploadCompanyPanPayload>,
    ) {
      state.CompanyPanLoading = true;
      state.CompanyPanError = null;
    },
    uploadCompanyPanSuccess(
      state,
      action: PayloadAction<IuplaodCompanyPanResponse>,
    ) {
      state.CompanyPanLoading = false;
      state.CompanyPanData = action.payload;
    },
    uploadCompanyPanFailure(state, action: PayloadAction<string>) {
      state.CompanyPanLoading = false;
      state.CompanyPanError = action.payload;
    },
    clearCompanyPan(state) {
      state.CompanyPanLoading = false;
      state.CompanyPanData = null;
      state.CompanyPanError = null;
    },
    uploadCompanyInfoRequest(
      state,
      action: PayloadAction<IUploadCompanyInfoPayload>,
    ) {
      state.CompanyInfoLoading = true;
      state.CompanyInfoError = null;
    },
    uploadCompanyInfoSuccess(
      state,
      action: PayloadAction<IUploadCompanyInfoResponse>,
    ) {
      state.CompanyInfoLoading = false;
      state.CompanyInfoData = action.payload;
    },
    uploadCompanyInfoFailure(state, action: PayloadAction<string>) {
      state.CompanyInfoLoading = false;
      state.CompanyInfoError = action.payload;
    },
    clearCompanyInfo(state) {
      state.CompanyInfoLoading = false;
      state.CompanyInfoData = null;
      state.CompanyInfoError = null;
    },
    setSoftSanctionLoader: (state, action: PayloadAction<boolean>) => {
      state.SoftSanctionLoading = action.payload;
    },
    getSoftSanctionRequest: (
      state,
      _action: PayloadAction<ISoftSanctionPayload>,
    ) => {
      state.SoftSanctionLoading = true;
    },
    getSoftSanction: state => {
      state.SoftSanctionLoading = true;
    },
    setSoftSanctionList: (
      state,
      action: PayloadAction<Array<IsoftSanctionMethodDatum>>,
    ) => {
      state.SoftSanctionLoading = false;
      state.SoftSanctionData = action.payload;
    },
    resetSoftSanction: state => {
      state.SoftSanctionData = [];
      state.SoftSanctionLoading = false;
    },
    setSoftSanctionBnkProLoader: (state, action: PayloadAction<boolean>) => {
      state.SoftSanctionBNKPROLoading = action.payload;
    },
    getSoftSanctionBnkPro: state => {
      state.SoftSanctionBNKPROLoading = true;
    },
    setSoftSanctionBnkProList: (
      state,
      action: PayloadAction<Array<IsoftSanctionBankProductDatum>>,
    ) => {
      state.SoftSanctionBNKPROLoading = false;
      state.SoftSanctionBNKPROData = action.payload;
    },
    resetSoftSanctionBnkPro: state => {
      state.SoftSanctionBNKPROData = [];
      state.SoftSanctionBNKPROLoading = false;
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
      state.TaskRecordsFilterError = action.payload;
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
    getSoftSanctionRuleset: (state, _action) => {
      state.rulesetLoading = true;
      state.rulesetError = null;
    },
    setSoftSanctionRuleset: (state, action) => {
      state.rulesetLoading = false;
      state.rulesetData = action.payload;
    },
    setSoftSanctionRulesetError: (state, action) => {
      state.rulesetLoading = false;
      state.rulesetError = action.payload;
    },
    getSoftSanctionClientList: state => {
      state.softSanctionClientLoading = true;
      state.softSanctionClientError = null;
    },
    setSoftSanctionClientList: (state, action) => {
      state.softSanctionClientLoading = false;
      state.softSanctionClientList = action.payload;
    },
    setSoftSanctionClientListError: (state, action) => {
      state.softSanctionClientLoading = false;
      state.softSanctionClientError = action.payload;
    },
    setSoftSanctionFields: (state, action) => {
      state.softSanctionFields = action.payload;
      state.softSanctionFieldsLoading = false;
      state.softSanctionFieldsError = null;
    },
    setSoftSanctionFieldsLoading: state => {
      state.softSanctionFieldsLoading = true;
      state.softSanctionFieldsError = null;
    },
    setSoftSanctionFieldsError: (state, action) => {
      state.softSanctionFieldsLoading = false;
      state.softSanctionFieldsError = action.payload;
    },
    clearSoftSanctionFields: state => {
      state.softSanctionFields = {};
      state.softSanctionFieldsLoading = false;
      state.softSanctionFieldsError = null;
    },
    getSoftSanctionFields: (state, action) => {},
    bankStatementRequest(state, action: PayloadAction<IBankStatementPayload>) {
      state.BankStatementLoading = true;
      state.BankStatementError = null;
    },
    bankStatementSuccess(state, action: PayloadAction<any>) {
      state.BankStatementLoading = false;
      state.BankStatementData = action.payload;
    },
    bankStatementFailure(state, action: PayloadAction<string>) {
      state.BankStatementLoading = false;
      state.BankStatementError = action.payload;
    },
    clearBankStatement(state) {
      state.BankStatementLoading = false;
      state.BankStatementData = null;
      state.BankStatementError = null;
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
    getLeadProgressDetails: (state, _action: PayloadAction<number>) => {
      state.leadProgressDetailsLoading = true;
      state.leadProgressDetailsError = null;
    },
    setLeadProgressDetails: (state, action: PayloadAction<any[]>) => {
      state.leadProgressDetailsLoading = false;
      state.leadProgressDetails = action.payload;
      state.leadProgressDetailsError = null;
    },
    setLeadProgressDetailsError: (state, action: PayloadAction<string>) => {
      state.leadProgressDetailsLoading = false;
      state.leadProgressDetails = [];
      state.leadProgressDetailsError = action.payload;
    },
  },
});

export const {
  getClients,
  setClientLoader,
  setClientList,
  saveClientFormId,

  setBasicDetails,
  clearBasicDetails,
  saveClientBasicDetails,
  updateClientBasicDetails,

  setClientsDetails,
  addNewClientDetails,
  removeClientDetails,
  clearClientDetails,
  saveClientsDetails,

  setClientFormData,
  resetClientFormData,
  resetAllClientFormData,
  saveClientFirmDetails,
  saveVendorDetails,
  saveVisitDetails,
  getReport,
  setReportList,
  resetReportList,
  getLead,
  setLeadList,
  resetLeadList,
  getLeadDesciption,
  getTaskHistory,
  setTaskHistoryList,
  resetTaskHistoryList,
  uploadKycRequest,
  uploadKycSuccess,
  uploadKycFailure,
  clearUploadKyc,
  setBankLoader,
  getBankList,
  setBankList,
  resetBankList,
  setKycCheckedLoader,
  getKycChecked,
  setKycCheckedList,
  resetKycCheckedList,
  setKycBusinessLoader,
  getKycBusinessChecked,
  setKycBusinessCheckedList,
  resetKycBusinessList,
  uploadPanRequest,
  uploadPanSuccess,
  uploadPanFailure,
  clearPanUpload,
  uploadAdharRequest,
  uploadAdharSuccess,
  uploadAdharFailure,
  clearAdhar,
  uploadResidenceRequest,
  uploadResidenceSuccess,
  uploadResidenceFailure,
  clearUploadResidence,
  uploadUdhyamRequest,
  uploadUdhyamSuccess,
  uploadUdhyamFailure,
  clearUplaodUdhyam,
  uploadGstRequest,
  uploadGstSuccess,
  uploadGstfailure,
  clearUplaodGst,
  uploadGoDownRequest,
  uploadGoDownSuccess,
  uploadGoDownFailure,
  clearUploadGoDown,
  uploadShareholdingRequest,
  uploadShareholdingSuccess,
  uploadShareholdingFailure,
  clearShareholding,
  uploadCompanyPanRequest,
  uploadCompanyPanSuccess,
  uploadCompanyPanFailure,
  clearCompanyPan,
  uploadCompanyInfoRequest,
  uploadCompanyInfoSuccess,
  uploadCompanyInfoFailure,
  clearCompanyInfo,
  setSoftSanctionLoader,
  getSoftSanctionRequest,
  getSoftSanction,
  setSoftSanctionList,
  resetSoftSanction,
  setSoftSanctionBnkProLoader,
  getSoftSanctionBnkPro,
  setSoftSanctionBnkProList,
  resetSoftSanctionBnkPro,
  FilterRequest,
  FilterSucess,
  FilterFailure,
  clearFilter,
  TaskRecordsFilterRequest,
  TaskRecordsFilterSucess,
  TaskRecordsFailure,
  clearTaskRecordsFilter,
  getSoftSanctionRuleset,
  setSoftSanctionRuleset,
  setSoftSanctionRulesetError,
  getSoftSanctionClientList,
  setSoftSanctionClientList,
  setSoftSanctionClientListError,
  setSoftSanctionFields,
  setSoftSanctionFieldsLoading,
  setSoftSanctionFieldsError,
  clearSoftSanctionFields,
  getSoftSanctionFields,
  bankStatementRequest,
  bankStatementSuccess,
  bankStatementFailure,
  clearBankStatement,
  getClientDetails,
  setClientDetails,
  setClientDetailsError,
  getLeadProgressDetails,
  setLeadProgressDetails,
  setLeadProgressDetailsError,
} = clientSlice.actions;
export default clientSlice.reducer;

export function getFilteredClients(filters: {
  client_name: string;
  location: string;
  source_of_lead: string;
}): any {
  throw new Error('Function not implemented.');
}
