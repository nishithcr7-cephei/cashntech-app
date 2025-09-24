import {Country} from 'react-native-country-picker-modal';

export type AuthNavigatorType = {
  OnBoarding: undefined;
  SignupScreen: SignupScreenParams | undefined;
  OTPInputScreen: OTPInputScreenParams;
  PasswordScreen: PasswordScreenParams;

  SigninScreen: SigninScreenParams | undefined;
  TermsOfService: undefined;
  SuccessScreen: {
    authMode: 'signin' | 'signup' | 'password';
    firstName: string;
    lastName: string;
  };
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
  ClientNavigator: undefined;
  SoftNavigator: undefined;
  LeadNavigator: undefined;
  ReportNavigator: undefined;
  KycNavigator: undefined;
  DocNavigator: undefined;
  ManageTask: undefined;
  VisitDetail: undefined;
};

export type ClientNavigatorType = {
  ClientInfo: undefined;
  FormSelectionScreen: undefined;
  BasicDetailForm: undefined;
  ClientDetailForm: undefined;
  FirmDetailForm: undefined;
  VendorDetailForm: undefined;
  VisitDetailForm: undefined;
  VisitDetail: undefined;
  UpdateVisitDetails: {
    visitId: string;
    visit_date_time: string;
    salesperson: string;
    client_firm_name: string;
    visit_type: string;
    visit_number: number;
    visit_remark: string;
  };
  ProfileScreen: {clientId: number};
};

export type SoftNavigatorType = {
  Softsanction: undefined;
  SoftsanctionProcess: undefined;
  SoftSanctionRuleset:
    | {
        bankName?: string;
        product?: string;
        configRules?: any[];
        clientName?: string;
        clientId?: string;
      }
    | undefined;
  RulesetTCPD: undefined;
  UGROTurnoverMethod: {
    clientId: string;
    method: string;
    bank: string;
    product?: string;
    clientName?: string;
  };
  UGROPurchaseMethod: undefined;
  RulesetView:
    | {
        rulesetData: any[];
        bankName?: string;
        productName?: string;
        rulesetId?: string;
        methodName?: string;
        clientId?: string;
        clientName?: string;
        location?: string;
      }
    | undefined;
};

export type LeadNavigatorType = {
  LeadProgress: undefined;
  LeadProgressInfo: undefined;
};

export type ReportNavigatorType = {
  Report: undefined;
};

export type KycNavigatorType = {
  KycDocument: undefined;
  KYCFormSelection: {clientID: number};
  BankStatementUpload: {clientID: number};
  KycUploadDoc: {clientID: number};
  KycUploadPan: {clientID: number};
  KycUploadAdhar: {clientID: number};
  ResidenceDetail: {clientID: number};
  KycElectricityBill: undefined;
  KycOwner: undefined;
  UdhyamCertificate: {clientID: number};
  GSTDocument: {clientID: number};
  GodownDetails: {clientID: number};
  GodownDetails2: {clientID: number};
  CompanyPanCard: {clientID: number};
  ShareholdingCompany: {clientID: number};
  CompanyDocument: {clientID: number};
  FullImage: {imageUrl: string};
};

export type DocNavigatorType = {
  DocumentValidation: undefined;
  DocValidForm: undefined;
  DocValidSelection: undefined;
  PersonalKYCValidation: undefined;
  BusinessKYCValidation: undefined;
  TaskLogTabs: undefined;
  TaskHistTabs: undefined;
  TaskUpdate: {
    taskId: string;
    task_status?: string;
    remark?: string;
    completed_at?: string;
    task_description?: string;
    client_name?: string;
  };
};
