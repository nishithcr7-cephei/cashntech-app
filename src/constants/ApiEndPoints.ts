const Endpoints = {
  // Auth apis
  apiSignup: '/auth/signup',
  apiSignupOtpVerify: '/auth/verify-otp-from-email',
  apiSigninOtpVerify: '/auth/verify-otp',
  apiCreatePassword: '/auth/create-password',
  apiForgotPassword: '/auth/forgot-password',
  apiResetPassword: '/auth/reset-password',
  apiSignin: '/auth/login',

  // TODO
  apiResendOtp: '/auth/resend-otp',

  // Bank List
  apiGetMasterBank: '/client-info-master/bankmaster-list',
  apiGetCityList: '/client-info-master/cities',
  apiGetSalesmanList: '/client-info-master/salesman/list',

  // Client apis
  apiGetClientsFilter: '/client-info-master/filter/',
  apiGetAllClients: '/client-info-master/list',
  apiInboundClientsList: '/client-info-master/inbound-clients',
  apiGetInboundClientDetails: (registrationId: string) => `/client-info-master/inbound/${registrationId}`,
  apiSaveBasicDetails: '/client-info-master/basic-details/',
  apiGetBasicDetails: '/client-info-master/basic/',
  apiSaveClientsDetails: '/client-info-master/client-details/',
  apiGetClientsDetails: '/client-info-master/details/',
  apiSaveFirmDetails: `/client-info-master/client-firm-details/`,
  apiGetFirmDetails: `/client-info-master/client-firm/`,
  apiSaveVendorDetails: `/client-info-master/vendor-details/`,
  apiGetVendorDetails: `/client-info-master/vendor/`,
  apiSaveVisitDetails: `/client-info-master/follow-up/`,
  apiGetVisitDetails: `/client-info-master/follow-up/`,
  apiGetClientProfile: (id: string | number) => `/client-info-master/profile/${id}`,
  apiGetSoftSanctionDetails: (id: string | number) => `/client-info-master/soft-sanction/detail/${id}`,

  apiDeleteClient: `/client-info-master/delete/`,

  // Report apis
  apiGetReport: '/client-info-master/remark-reports',
  apiGetRemarkReport: (clientId: string) =>
    `/client-info-master/${clientId}/remark-report`,

  // Lead apis
  apiGetLeadProgress: '/client-info-master/lead-progress/client/list',
  apiInfoLeadProgress: (leadID: string) =>
    `/client-info-master/${leadID}/lead-progress`,

  // Tasks apis
  apiGetTaskHistory: (userName: string) => `/client-info-master/${userName}/tasks`,

  // Kyc Apis --
  // Personal Tab
  apiKycProfilePic: '/client-info-master/personal-kyc/profile',
  apiKycPanUpload: '/client-info-master/personal-kyc/pan',
  apiKycAadharUpload: '/client-info-master/personal-kyc/aadhar',
  apiKycResidenceDetail: '/client-info-master/personal-kyc/residence',
  // Business Tab
  apiUdhyamCertificate: '/client-info-master/business-kyc/udhyam',
  apiGstDocument: '/client-info-master/business-kyc/gst',
  apiGodownDetails: '/client-info-master/business-kyc/godown',
  apiCompanyPanDetails: '/client-info-master/business-kyc/pan',
  apiShareholding: '/client-info-master/business-kyc/share-holding',
  apiCompanyInformation: '/client-info-master/business-kyc/company-docs',
  // Bank Statement
  apiBankStatement: '/client-info-master/bank-statement',

  // Methods: Get | KYC Docs Apis
  // Kyc Personal Docs

  // apiGetPersonalDocs: (clientId: string) =>
  //   `/client-info-master/personal-kyc/${clientId}?doc_type=aadhar`,
  apiGetPersonalDocs: (clientId: string, docType: string) =>
    `/client-info-master/personal-kyc/${clientId}?doc_type=${docType}`,

  // Kyc Business Docs

  // apiGetBusinessDocs: (clientId: string) =>
  //   `/client-info-master/business-kyc/${clientId}?doc_type=udhyam`,
  apiGetBusinessDocs: (clientId: string, docType: string) =>
    `/client-info-master/business-kyc/${clientId}?doc_type=${docType}`,

  // bank Statement
  apiGetBankStatment: (clientId: string) =>
    `/client-info-master/bank-statement/${clientId}`,
  apiGetBankStatementInfo: (clientId: string) =>
    `/client-info-master/bank-statement-info/${clientId}`,
  apiGetBankStatementDetail: (bankId: string) =>
    `/client-info-master/bank-statement/${bankId}`,
  // Get Api to check document uploaded or not
  apiGetKycChecked: (clientID: string) =>
    `/client-info-master/personal-kyc/check/${clientID}`,
  // Bussiness KYC Check document
  apiGetBusinessKycChecked: (clientID: string) =>
    `/client-info-master/business-kyc/check/${clientID}`,
  // Get all KYC documents for a client
  apiGetKycDocuments: (clientID: string) =>
    `/client-info-master/kyc/${clientID}`,
  // Get KYC details with intent filtering
  apiGetKycDetails: '/client-info-master/kyc-details',
  // Download KYC documents
  apiDownloadKycDocuments: (clientId: string) => `/client-info-master/kyc/download/${clientId}`,

  // BankList dropdown
  apiBankList: '/client-info-master/bank-list',

  // Soft Sanction
  apiGetSoftSanction: (bankName: string) =>
    `/client-info-master/soft-sanction/inputs/${bankName}`,
  apiGetSoftSanctionBankProduct: (bank: string, product: string) =>
    `/client-info-master/soft-sanction/methods?bank=${bank}&product=${product}`,
  apiSoftSanctionCalculate: (id: string | number) =>
    `/client-info-master/soft-sanction/calculate/${id}`,
  apiSoftSanctionResult: (id: string | number, method: string, bank: string) =>
    `/client-info-master/soft-sanction/result/${id}?method=${encodeURIComponent(
      method,
    )}&bank=${encodeURIComponent(bank)}`,
  apiSoftSanctionExport: (
    id: string | number,
    method: string,
    product: string,
  ) =>
    `/client-info-master/soft-sanction/export/${id}?method=${encodeURIComponent(
      method,
    )}&product=${encodeURIComponent(product)}`,

  // Filter Box
  apiFilterBox: '/client-info-master/filter',
  apitaskFilterBox: '/client-info-master/filter/task-records',
  apiTaskRecords: '/client-info-master/task-records',

  // Client visit details
  apiGetVisitDetailsList: '/client-info-master/visit-details',
  apiUpdateVisitDetails: (visitId: string) => `/client-info-master/visit/update/${visitId}`,

  // Task Screen
  // apiRemarkReportTask:
} as const;

export default Endpoints;
