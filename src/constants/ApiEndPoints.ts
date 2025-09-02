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

  // Client apis
  apiGetAllClients: '/client-info-master/list',
  apiSaveBasicDetails: '/client-info-master/basic-details',
  apiSaveClientsDetails: '/client-info-master/client-details/',
  apiGetClientsDetails: 'client-info-master/details/',
  apiSaveFirmDetails: `/client-info-master/client-firm-details/`,
  apiSaveVendorDetails: (clientId: string) =>
    `/client-info-master/vendor-details/${clientId}`,
  apiSaveVisitDetails: (clientId: string) =>
    `/client-info-master/follow-up/${clientId}`,
  apiDeleteClient: (clientId: string | number) =>
    `/client-info-master/delete/${clientId}`,

  // Methods: Get | Client Form apis
  apiGetBasicDetails: (clientId: string) =>
    `/client-info-master/basic/${clientId}`,
  apiGetClientFirmDetails: (clientId: string) =>
    `/client-info-master/client-firm/${clientId}`,
  apiGetVendorDetails: (clientId: string) =>
    `/client-info-master/vendor/${clientId}`,
  apiGetVistiDetails: (clientId: string) =>
    `/client-info-master/follow-up/${clientId}`,

  // Report apis
  apiGetReport: '/client-info-master/remark-reports',
  apiGetRemarkReport: (clientId: string) =>
    `/client-info-master/${clientId}/remark-report`,

  // Lead apis
  apiGetLeadProgress: '/client-info-master/lead-progress/client/list',
  apiInfoLeadProgress: (leadID: string) =>
    `/client-info-master/${leadID}/lead-progress`,

  // Tasks apis
  apiGetTaskHistory: '/client-info-master/john.doe@example.com/tasks',

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
  // Get Api to check document uploaded or not
  apiGetKycChecked: (clientID: string) =>
    `/client-info-master/personal-kyc/check/${clientID}`,
  // Bussiness KYC Check document
  apiGetBusinessKycChecked: (clientID: string) =>
    `/client-info-master/business-kyc/check/${clientID}`,

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

  // Client visit details
  apiGetVisitDetailsList: '/client-info-master/visit-details',

  // Task Screen
  // apiRemarkReportTask:
} as const;

export default Endpoints;
