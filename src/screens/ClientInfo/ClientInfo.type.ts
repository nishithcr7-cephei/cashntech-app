export enum LeadSourceType {
  MARKET_KNOWLEDGE = 'Market Knowledge (D)',
  CUSTOMER_REFERENCE = 'Customer Reference (C)',
  TELECALLING = 'Telecalling (H)',
  OUTSOURCED_AGENCY = 'Outsourced Agency (H)',
  CHARETRED_ACCOUNTANT = 'Chartered Accountant (A)',
  INSURANCE = 'Insurance (I)',
  WEALTH_AND_INVESTMENT = 'Wealth & Investment (W)',
  INBOUND = 'Inbound (I)',
}

export enum ProgramType {
  STAND_ALONE = 'Stand-Alone',
  ANCHOR_BASED = 'Anchor-Based',
}

export enum ProductType {
  VF = 'VF',
  DF = 'DF',
  CF = 'CF',
  PID = 'PID',
  SID = 'SID',
  DYNAMIC_DISCOUNTING = 'Dynamic Discounting',
}

export enum ClientType {
  OWNER = 'Owner',
  DIRECTOR = 'Director',
  DESIGNATED_PARTNER = 'Designated Partner',
}

export enum FirmType {
  CHARITY = 'CHARITY',
  EDUCATIONAL_INSTITUTE = 'EDUCATIONAL_INSTITUTE',
  GOVERNMENT = 'GOVERNMENT',
  HUF = 'HUF',
  INDIVIDUAL_SALARIED = 'INDIVIDUAL/SALARIED',
  LIMITED_LIABILITY_PARTNERSHIP = 'LIMITED LIABILITY PARTNERSHIP',
  MNC = 'MNC',
  NON_GOVERNMENT_ORGANIZATION = 'NON GOVERNMENT ORGANIZATION',
  PARTNERSHIP = 'Partnership',
  PRIVATE_LTD = 'Private Ltd',
  PROPRIETORSHIP = 'Proprietorship',
  PUBLIC_LTD = 'Public Ltd',
  TRUST = 'TRUST',
}

export enum SectorType {
  FMCG = 'FMCG',
  PAINT = 'Paint',
  MANUFACTURING = 'Manufacturing',
  PHARMA = 'Pharma',
  ELECTRONIC = 'Electronic',
  AUTOMOBILE = 'Automobile',
  TEXTILE = 'Textile',
  CHEMICAL = 'Chemical',
  IT_SOFTWARE = 'IT & Software',
  TELECOM = 'Telecom',
  RETAIL = 'Retail',
  HOSPITALITY = 'Hospitality',
  EDUCATION = 'Education',
  REAL_ESTATE = 'Real Estate',
  CONSTRUCTION = 'Construction',
  AGRICULTURE = 'Agriculture',
  BANKING_FINANCE = 'Banking & Finance',
  HEALTHCARE = 'Healthcare',
  ENERGY = 'Energy',
  TRANSPORT_LOGISTICS = 'Transport & Logistics',
}

export enum FacilityType {
  OD = 'OD - Overdraft',
  CC = 'CC - Cash Credit',
  WCTL = 'WCTL - Working Capital Term Loan',
  CF = 'CF - Cashn Flow',
  OTHERS = 'Others',
}

export enum CreditPeriodOffer {
  DAYS_30 = '30',
  DAYS_45 = '45',
  DAYS_60 = '60',
  DAYS_90 = '90',
}

export enum ProductCategory {
  PERSONAL_CARE_HYGIENE = 'Personal Care & Hygiene',
  HOUSEHOLD_CLEANING = 'Household Cleaning',
  PACKAGED_FOODS = 'Packaged Foods',
  BEVERAGES = 'Beverages',
  DAIRY_FROZEN_FOODS = 'Dairy & Frozen Foods',
  CONFECTIONERY = 'Confectionery',
  STAPLE_GROCERY = 'Staple & Grocery',
  PAPER_DISPOSABLE = 'Paper & Disposable',
}

export const productTypeOptions: Record<ProductCategory, string[]> = {
  [ProductCategory.PERSONAL_CARE_HYGIENE]: [
    'Toothpaste',
    'Toothbrush',
    'Shampoo',
    'Conditioner',
    'Soap',
    'Body wash',
    'Face wash',
    'Face cream',
    'Deodorants',
    'Perfumes',
    'Shaving creams',
    'Razors',
    'Sanitary napkins',
    'Baby diapers',
  ],
  [ProductCategory.HOUSEHOLD_CLEANING]: [
    'Detergents (powder/liquid)',
    'Dishwashing bars/liquids',
    'Floor cleaners',
    'Toilet cleaners',
    'Air fresheners',
    'Mosquito repellents',
  ],
  [ProductCategory.PACKAGED_FOODS]: [
    'Biscuits',
    'Cookies',
    'Chips',
    'Namkeen',
    'Instant noodles',
    'Pasta',
    'Breakfast cereals',
    'Bakery items',
    'Ready-to-eat meals',
  ],
  [ProductCategory.BEVERAGES]: [
    'Packaged drinking water',
    'Soft drinks',
    'Juices',
    'Energy drinks',
    'Tea',
    'Coffee',
  ],
  [ProductCategory.DAIRY_FROZEN_FOODS]: [
    'Milk',
    'Butter',
    'Cheese',
    'Paneer',
    'Ice cream',
    'Frozen desserts',
    'Yogurt',
    'Curd',
    'Frozen snacks',
  ],
  [ProductCategory.CONFECTIONERY]: [
    'Chocolates',
    'Chewing gum',
    'Candies',
    'Toffees',
    'Lollipops',
  ],
  [ProductCategory.STAPLE_GROCERY]: [
    'Salt',
    'Sugar',
    'Edible oils',
    'Atta',
    'Rice',
    'Spices & masalas',
    'Pulses',
    'Lentils',
  ],
  [ProductCategory.PAPER_DISPOSABLE]: [
    'Tissues',
    'Napkins',
    'Toilet rolls',
    'Aluminum foil',
    'Cling film',
    'Disposable plates',
    'Cups',
  ],
};

export enum IntentType {
  HIGH = 'High',
  LOW = 'Low',
  MEDIUM = 'Medium',
}

export enum ReasonNotInterested {
  INSUREANCE = 'Insurance',
  ACCOUNTING = 'Accounting',
  CA_CONSULTING = 'CA Consulting',
  WEALTH_MANAGEMENT = 'Wealth (Fixed Deposit, Mutual Funds etc)',
}

export enum UserResponse {
  INTERESTED = 'Interested',
  NOT_INTERESTED = 'Not Interested',
}
