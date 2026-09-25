import {Country} from 'react-native-country-picker-modal';

export type AuthNavigatorType = {
  OnBoarding: undefined;
  SplashScreen: undefined;
  MenuPageView: undefined;
  RegisterView: undefined;
  ApplyView: undefined;
  ContactUs: undefined;
  SignupScreen: SignupScreenParams | undefined;
  OTPInputScreen: OTPInputScreenParams;
  ConsentScreen: {
    mobile_number: string;
    continuationToken: string;
    pendingAgreementTypes: string[];
  };
  PasswordScreen: PasswordScreenParams;

  SigninScreen: SigninScreenParams | undefined;
  TermsOfService: {uri: string; title?: string};
  SuccessScreen: {
    authMode: 'signin' | 'signup' | 'password';
    firstName: string;
    lastName: string;
  };
  ProductSelectionScreen: {
    firstName?: string;
    lastName?: string;
  };
  OcrInvoice: undefined;
  SelectUserTypeScreen: undefined;
  SelectProgramScreen: {fromScreen?: string} | undefined;
  SelectRoleScreen: undefined;
  HomeNavigator: undefined;
};

export type SignupScreenParams = {
  email: string;
  mobile: string;
  country: Country;
  firstName: string;
  lastName: string;
};

export type SigninScreenParams = {
  email: string;
  mobileNumber: string;
  password: string;
};

export type OTPInputScreenParams = {
  showCreatePass: boolean;
} & (
  | {
      screen: 'signup';
      data: SignupScreenParams;
    }
  | {
      screen: 'signin';
      data: SigninScreenParams;
    }
);

export type PasswordScreenParams = {
  token?: string;
  screenMode?: 'forgotPass' | 'createPass';
};

export type HomeNavigatorType = {
  InvoiceDashboard: undefined;
  InvoiceDetails: {
    invoiceId?: string;
    dealerName?: string;
    programId?: string;
  };
  CreateInvoice: {
    previewFields?: import('./Invoice').InvoiceFields;
    previewAttachment?: import('@react-native-documents/picker').DocumentPickerResponse;
    previewReturnToken?: number;
  } | undefined;
  UploadInvoiceList: undefined;
  DealerInvoiceList: undefined;
  DiscountingPayments: undefined;
  PendingApprovals: undefined;
  RejectedFinances: undefined;
  DPDInvoiceList: undefined;
  FundingLimitsForDealers: undefined;
  ANCreditAccount: undefined;
  CreditAccountDetails: {
    id?: string;
    programId?: string;
    dealerName?: string;
    creditAccount?: string;
    anchor?: string;
    bankName?: string;
    status?: string;
  };
  CreditAccountInvoiceNumber: {
    creditAccountNo?: string;
    invoiceNumber?: string;
  };
  CreditAccountDailyInterest: {
    invoiceNumber?: string;
    creditAccountNo?: string;
  };
  FinancingRequestScreen: undefined;
  LimitDetailsScreen: undefined;
  DealerMakerDashboardScreen: undefined;
  ODDetailsScreen: undefined;
  ODRepaymentsScreen: undefined;
  AnchorsListScreen: {
    companyName?: string;
  };
  InvoiceDetailView: {
    invoiceId?: string;
    invoiceNo?: string;
    returnRoute?: keyof HomeNavigatorType;
    listInvoiceStatus?: string;
    listApprovalStatus?: string;
    listAdminStatus?: string;
  };
  InvoiceUploadPreview: {
    previewFields?: import('./Invoice').InvoiceFields;
    previewAttachment?: import('@react-native-documents/picker').DocumentPickerResponse;
    previewAnchorName?: string;
    productType?: 'dealer_finance' | 'vendor_finance' | 'purchase_invoice_discounting';
  };
  DealerInvoiceDetailsScreen: {
    dealerName?: string;
  };
  DisbursementScreen: undefined;
  InterestAccrualsScreen: undefined;
  InvoiceDailyInterestScreen: {
    invoiceId: string;
    invoiceNo: string;
  };
  RepaymentSettlementScreen: undefined;
  DPDPenalInterestNPAScreen: undefined;
  StatementOfAccount: undefined;
  SOADealerList: {
    programId?: string;
    programIds?: string[];
    programName?: string;
    bankName?: string;
    partyName?: string;
    status?: string;
    totalSanctionedAmount?: string | number;
    totalOutstanding?: string | number;
  };
  OcrInvoice: undefined;
  Profile: undefined;
  SelectProgramScreen: {fromScreen?: string} | undefined;
  AllLoanReportScreen: undefined;
  DisbursementReportScreen: undefined;
  DpdReportScreen: undefined;
  DailyAccrualReportScreen: undefined;
  MonthlyInterestReportScreen: undefined;
  RepaymentReportScreen: undefined;
  InvoiceOutstandingReportScreen: undefined;
  LoanStatusReportScreen: undefined;
  AllProductOutstandingReportScreen: undefined;
  UtilizationReportScreen: undefined;
};
