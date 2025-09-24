import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  KycState,
  IBankListResponseDatum,
  IBankStatementPayload,
  IBankStatementInfoData,
  IBankStatementDetailData,
  IKycBusinessResponseDatum,
  IKycCheckedResponseDatum,
  IKycDocumentsData,
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
  IKycClientListResponseDatum,
  IKycDetailsPayload,
  IKycDetailsResponseDatum,
  IGetPersonalKycPayload,
  IGetPersonalKycResponse,
  IPersonalKycDocument,
} from './kyc.types';

const initialState: KycState = {
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
  
  // Bank Statement
  BankStatementLoading: false,
  BankStatementData: null,
  BankStatementError: null,

  // Bank Statement Info
  BankStatementInfoLoading: false,
  BankStatementInfoData: [],
  BankStatementInfoError: null,

  // Individual Bank Statement Detail
  BankStatementDetailLoading: false,
  BankStatementDetailData: null,
  BankStatementDetailError: null,
  
  // KYC Documents
  kycDocumentsLoading: false,
  kycDocumentsData: null,
  kycDocumentsError: null,
  kycClientList: [],
  
  // KYC Details
  kycDetailsLoading: false,
  kycDetailsData: [],
  kycDetailsError: null,
  
  // Personal KYC Documents
  personalKycLoading: false,
  personalKycData: [],
  personalKycError: null,
};

const kycSlice = createSlice({
  name: 'kyc',
  initialState,
  reducers: {
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
      action: PayloadAction<string[]>,
    ) => {
      state.KycBusinessLoader = false;
      state.KycBusinessList = action.payload;
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
    getBankStatementInfoRequest: (state, action: PayloadAction<string>) => {
      state.BankStatementInfoLoading = true;
      state.BankStatementInfoError = null;
    },
    getBankStatementInfoSuccess: (
      state,
      action: PayloadAction<IBankStatementInfoData[]>,
    ) => {
      state.BankStatementInfoLoading = false;
      state.BankStatementInfoData = action.payload;
    },
    getBankStatementInfoFailure: (state, action: PayloadAction<string>) => {
      state.BankStatementInfoLoading = false;
      state.BankStatementInfoError = action.payload;
    },
    clearBankStatementInfo: (state) => {
      state.BankStatementInfoLoading = false;
      state.BankStatementInfoData = [];
      state.BankStatementInfoError = null;
    },
    getBankStatementDetailRequest: (state, action: PayloadAction<string>) => {
      state.BankStatementDetailLoading = true;
      state.BankStatementDetailError = null;
    },
    getBankStatementDetailSuccess: (
      state,
      action: PayloadAction<IBankStatementDetailData>,
    ) => {
      state.BankStatementDetailLoading = false;
      state.BankStatementDetailData = action.payload;
    },
    getBankStatementDetailFailure: (state, action: PayloadAction<string>) => {
      state.BankStatementDetailLoading = false;
      state.BankStatementDetailError = action.payload;
    },
    clearBankStatementDetail: (state) => {
      state.BankStatementDetailLoading = false;
      state.BankStatementDetailData = null;
      state.BankStatementDetailError = null;
    },
        getKycClients: (state, _action: PayloadAction<number>) => {
          // Placeholder action for KYC clients
        },
        setKycClientList: (
          state,
          action: PayloadAction<Array<IKycClientListResponseDatum>>,
        ) => {
          state.kycClientList = action.payload;
        },
        
        // KYC Details Actions
        getKycDetailsRequest: (state, action: PayloadAction<IKycDetailsPayload>) => {
          state.kycDetailsLoading = true;
          state.kycDetailsError = null;
        },
        getKycDetailsSuccess: (
          state,
          action: PayloadAction<Array<IKycDetailsResponseDatum>>,
        ) => {
          state.kycDetailsLoading = false;
          state.kycDetailsData = action.payload;
        },
        getKycDetailsFailure: (state, action: PayloadAction<string>) => {
          state.kycDetailsLoading = false;
          state.kycDetailsError = action.payload;
        },
        
        // Personal KYC Documents Actions
        getPersonalKycRequest: (state, action: PayloadAction<IGetPersonalKycPayload>) => {
          state.personalKycLoading = true;
          state.personalKycError = null;
        },
        getPersonalKycSuccess: (
          state,
          action: PayloadAction<Array<IPersonalKycDocument>>,
        ) => {
          state.personalKycLoading = false;
          state.personalKycData = action.payload;
        },
        getPersonalKycFailure: (state, action: PayloadAction<string>) => {
          state.personalKycLoading = false;
          state.personalKycError = action.payload;
        },
        clearPersonalKyc: (state) => {
          state.personalKycLoading = false;
          state.personalKycData = [];
          state.personalKycError = null;
        },
        
        // Business KYC Documents Actions
        getBusinessKycRequest: (state, action: PayloadAction<IGetPersonalKycPayload>) => {
          state.personalKycLoading = true;
          state.personalKycError = null;
        },
        getBusinessKycSuccess: (
          state,
          action: PayloadAction<Array<IPersonalKycDocument>>,
        ) => {
          state.personalKycLoading = false;
          state.personalKycData = action.payload;
        },
        getBusinessKycFailure: (state, action: PayloadAction<string>) => {
          state.personalKycLoading = false;
          state.personalKycError = action.payload;
        },
  },
});

export const {
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
  bankStatementRequest,
  bankStatementSuccess,
  bankStatementFailure,
  clearBankStatement,
  getBankStatementInfoRequest,
  getBankStatementInfoSuccess,
  getBankStatementInfoFailure,
  clearBankStatementInfo,
  getBankStatementDetailRequest,
  getBankStatementDetailSuccess,
  getBankStatementDetailFailure,
  clearBankStatementDetail,
  getKycClients,
  setKycClientList,
  getKycDetailsRequest,
  getKycDetailsSuccess,
  getKycDetailsFailure,
  getPersonalKycRequest,
  getPersonalKycSuccess,
  getPersonalKycFailure,
  clearPersonalKyc,
  getBusinessKycRequest,
  getBusinessKycSuccess,
  getBusinessKycFailure,
} = kycSlice.actions;

export default kycSlice.reducer;
