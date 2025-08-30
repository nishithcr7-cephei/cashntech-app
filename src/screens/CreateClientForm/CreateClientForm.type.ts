import Cities from '@constants/Cities';
import {ClientScreens} from '@constants/Screens';
import {DrawerScreenProps} from '@react-navigation/drawer';
import {CompositeScreenProps, RouteProp} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ClientNavigatorType, HomeNavigatorType} from '@type/NavigatorTypes';

// Navigation Types
export type NavigationType = CompositeScreenProps<
  NativeStackScreenProps<ClientNavigatorType>,
  DrawerScreenProps<HomeNavigatorType>
>;

export type CreateClientFormProps = {
  navigation: NavigationType['navigation'];
  route: RouteProp<ClientNavigatorType, ClientScreens.CreateClientForm>;
};

// Types
export type FormTypes = keyof typeof formTitles;
export type FormTitlesType = (typeof formTitles)[FormTypes];
export enum FieldType {
  INPUT = 'input',
  DROPDOWN = 'dropdown',
  DATE = 'date',
}
// Name TYpes
type BasicDetailsDropDownNames =
  | 'sourceOfLead'
  | 'city'
  | 'state'
  | 'typeOfVisit';
type BasicDetailsInputNames =
  | 'firmName'
  | 'location'
  | 'pincode'
  | 'dateOfVisit'
  | 'visitNumber'
  | 'Fillby';
export type BasicDetailsNames =
  | BasicDetailsDropDownNames
  | BasicDetailsInputNames;
type ClientFirmDropDownNames =
  | 'typeOfFirm'
  | 'sector'
  | 'facilityType'
  | 'creditPeriod';
type ClientFirmInputNames =
  | 'clientName'
  | 'contactNumber'
  | 'businessVintage'
  | 'cibilScore'
  | 'existingFunding'
  | 'estimatedFunding'
  | 'bankName';
export type ClientFirmNames = ClientFirmDropDownNames | ClientFirmInputNames;

type VendorDropDownNames = 'Product' | 'state' | 'city';
type VendorInputNames =
  | 'vendorName'
  | 'address'
  | 'pincode'
  | 'vendorContact'
  | 'vendorEmail'
  | 'monthlySales';
export type VendorNames = VendorDropDownNames | VendorInputNames;

type VisitDropDownNames = 'intent' | 'interested' | 'UserResponse';
type VisitInputNames = 'nextVisitDate' | 'reason';
export type VisitNames = VisitDropDownNames | VisitInputNames;

// Form Data Type
type BasicDetailsTypes =
  | {
      label: string;
      name: BasicDetailsDropDownNames;
      type: FieldType.DROPDOWN;
    }
  | {
      label: string;
      name: BasicDetailsInputNames;
      type: FieldType.INPUT | FieldType.DATE;
      formatNumberWithCommas?: boolean;
    };

export type ClientFirmScreenTypes =
  | {
      label: string;
      name: ClientFirmDropDownNames;
      type: FieldType.DROPDOWN;
    }
  | {
      label: string;
      name: ClientFirmInputNames;
      type: FieldType.INPUT | FieldType.DATE;
      formatNumberWithCommas?: boolean;
    };

export type VendorScreenTypes =
  | {
      label: string;
      name: VendorDropDownNames;
      type: FieldType.DROPDOWN;
    }
  | {
      label: string;
      name: VendorInputNames;
      type: FieldType.INPUT;
      formatNumberWithCommas?: boolean;
    };

export type VisitScreenTypes =
  | {
      label: string;
      name: VisitDropDownNames;
      type: FieldType.DROPDOWN;
    }
  | {
      label: string;
      name: VisitInputNames;
      type: FieldType.INPUT | FieldType.DATE;
    };

// Combined Types
export type DataFieldsType =
  | BasicDetailsTypes
  | ClientFirmScreenTypes
  | VendorScreenTypes
  | VisitScreenTypes;
export type FormInputListType = {
  BasicDetails: Array<BasicDetailsTypes>;
  ClientFirmScreen: Array<ClientFirmScreenTypes>;
  VendorScreen: Array<VendorScreenTypes>;
  VisitScreen: Array<VisitScreenTypes>;
};

export type DropDownDataType = Record<
  | BasicDetailsDropDownNames
  | ClientFirmDropDownNames
  | VendorDropDownNames
  | VisitDropDownNames,
  Array<{label: string; value: string}>
>;

// Dropdown Enums
export enum LeadSourceType {
  MARKET_KNOWLEDGE = 'Market Knowledge (D)',
  CUSTOMER_REFERENCE = 'Customer Reference (C)',
  TELECALLING = 'Telecalling (H)',
  OUTSOURCED_AGENCY = 'Outsourced Agency (H)',
  CHARETRED_ACCOUNTANT = 'Chartered Accountant (A)',
  INSURANCE = 'Insurance (I)',
  WEALTH_AND_INVESTMENT = 'Wealth & Investment (W)',
}

export enum VisitType {
  NEW = 'New',
  REPEAT = 'Repeat',
}

export enum FirmType {
  CHARITY = 'Charity',
  EDUCATIONAL_INSTITUTE = 'Educational institute',
  GOVERNMENT = 'Government',
  HUF = ' HUF',
  INDIVIDUAL_SALARIED = 'Individual/Salaried',
  LIMITED_LIABILITY_PARTNERSHIP = 'Limited liability Partnership',
  MNC = 'MNC',
  NON_GOVERNMENT_ORGANIZATION = 'Non Government Organization',
  PARTNERSHIP = 'Partnership',
  PRIVATE_LTD = 'Private Ltd',
  PROPRIETERSHIP = 'Proprietership',
  PUBLIC_LTD = 'Public Ltd',
  TRUST = 'Trust',
}

export enum SectorType {
  FMCG = 'FMCG',
  PAINT = 'Paint',
  MANUFACTURING = 'Manufacturing',
  PHARMA = 'Pharma',
  ELECTRONIC = 'Electronic',
}

export enum FacilityType {
  OD = 'OD - Overdraft',
  CC = 'CC - Cash Credit',
  WCTL = 'WCTL - Working Capital Term Loan',
  CF = 'CF - Cashn Flow',
  OTHERS = 'Others',
}

export enum creditPeriodType {
  Days30 = '30',
  Days45 = '45',
  Days60 = '60',
  Days90 = '90',
}

export enum IntentType {
  HIGH = 'High',
  LOW = 'Low',
  MEDIUM = 'Medium',
}

export enum InterestedType {
  YES = 'Yes',
  NO = 'No',
  MAYBE = 'Maybe',
}

export enum ResponseType {
  INTERESTED = 'Interested',
  NOT_INTERESTED = 'Not interested',
}

export enum ProductCategoryType {
  PERSONAL_CARE = 'Personal Care & Hygiene',
  HOUSEHOLD_CLEANING = 'Household Cleaning',
  PACKAGED_FOODS = 'Packaged Foods',
  BEVERAGES = 'Beverages',
  DAIRY_FROZEN = 'Dairy & Frozen Foods',
  CONFECTIONERY = 'Confectionery',
  STAPLE_GROCERY = 'Staple & Grocery',
  PAPER_DISPOSABLE = 'Paper & Disposable',
}

// Dropdown Data
const sourceOfLead = [
  {
    label: LeadSourceType.MARKET_KNOWLEDGE,
    value: LeadSourceType.MARKET_KNOWLEDGE,
  },
  {
    label: LeadSourceType.CUSTOMER_REFERENCE,
    value: LeadSourceType.CUSTOMER_REFERENCE,
  },
  {label: LeadSourceType.TELECALLING, value: LeadSourceType.TELECALLING},
  {
    label: LeadSourceType.OUTSOURCED_AGENCY,
    value: LeadSourceType.OUTSOURCED_AGENCY,
  },
  {
    label: LeadSourceType.CHARETRED_ACCOUNTANT,
    value: LeadSourceType.CHARETRED_ACCOUNTANT,
  },
  {label: LeadSourceType.INSURANCE, value: LeadSourceType.INSURANCE},
  {
    label: LeadSourceType.WEALTH_AND_INVESTMENT,
    value: LeadSourceType.WEALTH_AND_INVESTMENT,
  },
];

const typeOfVisit = [
  {label: VisitType.NEW, value: VisitType.NEW},
  {label: VisitType.REPEAT, value: VisitType.REPEAT},
];

const typeOfFirm = [
  {label: FirmType.CHARITY, value: FirmType.CHARITY},
  {
    label: FirmType.EDUCATIONAL_INSTITUTE,
    value: FirmType.EDUCATIONAL_INSTITUTE,
  },
  {label: FirmType.GOVERNMENT, value: FirmType.GOVERNMENT},
  {label: FirmType.HUF, value: FirmType.HUF},
  {label: FirmType.INDIVIDUAL_SALARIED, value: FirmType.INDIVIDUAL_SALARIED},
  {
    label: FirmType.LIMITED_LIABILITY_PARTNERSHIP,
    value: FirmType.LIMITED_LIABILITY_PARTNERSHIP,
  },
  {label: FirmType.MNC, value: FirmType.MNC},
  {
    label: FirmType.NON_GOVERNMENT_ORGANIZATION,
    value: FirmType.NON_GOVERNMENT_ORGANIZATION,
  },
  {label: FirmType.PARTNERSHIP, value: FirmType.PARTNERSHIP},
  {label: FirmType.PRIVATE_LTD, value: FirmType.PRIVATE_LTD},
  {label: FirmType.PROPRIETERSHIP, value: FirmType.PROPRIETERSHIP},
  {label: FirmType.PUBLIC_LTD, value: FirmType.PUBLIC_LTD},
  {label: FirmType.TRUST, value: FirmType.TRUST},
];

const sector = [
  {label: SectorType.FMCG, value: SectorType.FMCG},
  {label: SectorType.PAINT, value: SectorType.PAINT},
  {label: SectorType.MANUFACTURING, value: SectorType.MANUFACTURING},
  {label: SectorType.PHARMA, value: SectorType.PHARMA},
  {label: SectorType.ELECTRONIC, value: SectorType.ELECTRONIC},
];

const facilityType = [
  {label: FacilityType.OD, value: FacilityType.OD},
  {label: FacilityType.CC, value: FacilityType.CC},
  {label: FacilityType.WCTL, value: FacilityType.WCTL},
  {label: FacilityType.CF, value: FacilityType.CF},
  {label: FacilityType.OTHERS, value: FacilityType.OTHERS},
];

const intent = [
  {label: IntentType.HIGH, value: IntentType.HIGH},
  {label: IntentType.LOW, value: IntentType.LOW},
  {label: IntentType.MEDIUM, value: IntentType.MEDIUM},
];

const creditPeriod = [
  {label: creditPeriodType.Days30, value: creditPeriodType.Days30},
  {label: creditPeriodType.Days45, value: creditPeriodType.Days45},
  {label: creditPeriodType.Days60, value: creditPeriodType.Days60},
  {label: creditPeriodType.Days90, value: creditPeriodType.Days90},
];

const Response = [
  {label: ResponseType.INTERESTED, value: ResponseType.INTERESTED},
  {label: ResponseType.NOT_INTERESTED, value: ResponseType.NOT_INTERESTED},
];

const interested = [
  {label: InterestedType.YES, value: InterestedType.YES},
  {label: InterestedType.NO, value: InterestedType.NO},
  {label: InterestedType.MAYBE, value: InterestedType.MAYBE},
];

export const productCategoryDropdown = [
  {
    label: ProductCategoryType.PERSONAL_CARE,
    value: ProductCategoryType.PERSONAL_CARE,
  },
  {
    label: ProductCategoryType.HOUSEHOLD_CLEANING,
    value: ProductCategoryType.HOUSEHOLD_CLEANING,
  },
  {
    label: ProductCategoryType.PACKAGED_FOODS,
    value: ProductCategoryType.PACKAGED_FOODS,
  },
  {label: ProductCategoryType.BEVERAGES, value: ProductCategoryType.BEVERAGES},
  {
    label: ProductCategoryType.DAIRY_FROZEN,
    value: ProductCategoryType.DAIRY_FROZEN,
  },
  {
    label: ProductCategoryType.CONFECTIONERY,
    value: ProductCategoryType.CONFECTIONERY,
  },
  {
    label: ProductCategoryType.STAPLE_GROCERY,
    value: ProductCategoryType.STAPLE_GROCERY,
  },
  {
    label: ProductCategoryType.PAPER_DISPOSABLE,
    value: ProductCategoryType.PAPER_DISPOSABLE,
  },
];

const productCategoryOptionsMap: Record<ProductCategoryType, string[]> = {
  [ProductCategoryType.PERSONAL_CARE]: [
    'Toothpaste, toothbrush',
    'Shampoo, conditioner',
    'Soap, body wash',
    'Face wash, face cream',
    'Deodorants, perfumes',
    'Shaving creams, razors',
    'Sanitary napkins, baby diapers',
  ],
  [ProductCategoryType.HOUSEHOLD_CLEANING]: [
    'Detergents (powder/liquid)',
    'Dishwashing bars/liquids',
    'Floor cleaners',
    'Toilet cleaners',
    'Air fresheners',
    'Mosquito repellents',
  ],
  [ProductCategoryType.PACKAGED_FOODS]: [
    'Biscuits, cookies',
    'Chips, namkeen',
    'Instant noodles, pasta',
    'Breakfast cereals',
    'Bakery items',
    'Ready-to-eat meals',
  ],
  [ProductCategoryType.BEVERAGES]: [
    'Packaged drinking water',
    'Soft drinks',
    'Juices',
    'Energy drinks',
    'Tea, coffee',
  ],
  [ProductCategoryType.DAIRY_FROZEN]: [
    'Milk',
    'Butter, cheese, paneer',
    'Ice cream, frozen desserts',
    'Yogurt, curd',
    'Frozen snacks',
  ],
  [ProductCategoryType.CONFECTIONERY]: [
    'Chocolates',
    'Chewing gum',
    'Candies, toffees',
    'Lollipops',
  ],
  [ProductCategoryType.STAPLE_GROCERY]: [
    'Salt, sugar',
    'Edible oils',
    'Atta, rice',
    'Spices & masalas',
    'Pulses, lentils',
  ],
  [ProductCategoryType.PAPER_DISPOSABLE]: [
    'Tissues, napkins',
    'Toilet rolls',
    'Aluminum foil, cling film',
    'Disposable plates, cups',
  ],
};

// Combined Dropdown Data
export const dropDownData: DropDownDataType = {
  sourceOfLead: sourceOfLead,
  state: [], // Now handled dynamically
  city: [...Cities.Gujarat, ...Cities.Maharashtra],
  typeOfVisit: typeOfVisit,
  typeOfFirm: typeOfFirm,
  sector: sector,
  facilityType: facilityType,
  creditPeriod: creditPeriod,
  Product: productCategoryOptionsMap[
    ProductCategoryType.HOUSEHOLD_CLEANING
  ].map(item => ({
    label: item,
    value: item,
  })),
  UserResponse: Response,
  intent: intent,
  interested: interested,
};

// Form Titles
export const formTitles = {
  BasicDetails: 'Basic Details',
  ClientFirmScreen: 'Client & Firm Details',
  VendorScreen: 'Vendor Details',
  VisitScreen: 'Visit Details',
} as const;

// All Form Data
export const formInputDetails: FormInputListType = {
  BasicDetails: [
    {
      label: 'Source of Lead',
      name: 'sourceOfLead',
      type: FieldType.DROPDOWN,
    },
    {label: 'Firm Name', name: 'firmName', type: FieldType.INPUT},
    {label: 'State', name: 'state', type: FieldType.DROPDOWN},
    {label: 'City', name: 'city', type: FieldType.DROPDOWN},
    {label: 'Location', name: 'location', type: FieldType.INPUT},
    {label: 'Pin Code', name: 'pincode', type: FieldType.INPUT},
    {label: 'Type of Visit', name: 'typeOfVisit', type: FieldType.DROPDOWN},
    {label: 'Visit Number', name: 'visitNumber', type: FieldType.INPUT},
    {label: 'Date of Visit', name: 'dateOfVisit', type: FieldType.DATE},
    {label: 'Fill By', name: 'Fillby', type: FieldType.INPUT},
  ],
  ClientFirmScreen: [
    {label: 'Name of Client', name: 'clientName', type: FieldType.INPUT},
    {label: 'Contact number', name: 'contactNumber', type: FieldType.INPUT},
    {label: 'Type of Firm', name: 'typeOfFirm', type: FieldType.DROPDOWN},
    {
      label: 'Business Vintage (In years)',
      name: 'businessVintage',
      type: FieldType.INPUT,
    },
    {label: 'Sector', name: 'sector', type: FieldType.DROPDOWN},
    {label: 'Bank Name', name: 'bankName', type: FieldType.INPUT},
    {label: 'CIBIL Score', name: 'cibilScore', type: FieldType.INPUT},
    {label: 'Facility Type', name: 'facilityType', type: FieldType.DROPDOWN},
    {
      label: 'Existing Funding Sanctioned Amt',
      name: 'existingFunding',
      type: FieldType.INPUT,
      formatNumberWithCommas: true,
    },
    {
      label: 'Estimated Funding Required',
      name: 'estimatedFunding',
      type: FieldType.INPUT,
      formatNumberWithCommas: true,
    },
    {
      label: 'Credit Period Offer (In Days)',
      name: 'creditPeriod',
      type: FieldType.DROPDOWN,
    },
  ],
  VendorScreen: [
    {label: 'Product', name: 'Product', type: FieldType.DROPDOWN},
    {label: 'Vendor Name', name: 'vendorName', type: FieldType.INPUT},
    {label: 'Address', name: 'address', type: FieldType.INPUT},
    {label: 'City', name: 'city', type: FieldType.DROPDOWN},
    {label: 'State', name: 'state', type: FieldType.DROPDOWN},
    {label: 'Pincode', name: 'pincode', type: FieldType.INPUT},
    {
      label: 'Vendor Contact number',
      name: 'vendorContact',
      type: FieldType.INPUT,
    },
    {label: 'Vendor Contact Email', name: 'vendorEmail', type: FieldType.INPUT},
    {
      label: 'Monthly Sales Value',
      name: 'monthlySales',
      type: FieldType.INPUT,
      formatNumberWithCommas: true,
    },
  ],
  VisitScreen: [
    {label: 'User Response', name: 'UserResponse', type: FieldType.DROPDOWN},
    {label: 'Intent', name: 'intent', type: FieldType.DROPDOWN},
    {label: 'Date of Next Visit', name: 'nextVisitDate', type: FieldType.DATE},
    {label: 'Reason for Not Interested', name: 'reason', type: FieldType.INPUT},
    {
      label: 'Are you interested for?',
      name: 'interested',
      type: FieldType.DROPDOWN,
    },
  ],
};

// All Form Names in Array
export const formNames = Object.keys(formInputDetails) as Array<FormTypes>;
