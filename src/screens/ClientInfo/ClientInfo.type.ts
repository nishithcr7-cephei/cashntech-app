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
  LIMITED_LIABILITY_PARTNERSHIP = 'Limited Liability Partnership (LLP)',
  MNC = 'MNC',
  NON_GOVERNMENT_ORGANIZATION = 'NON GOVERNMENT ORGANIZATION',
  PARTNERSHIP = 'Partnership',
  PRIVATE_LTD = 'Private Ltd',
  PROPRIETORSHIP = 'Proprietorship',
  PUBLIC_LTD = 'Public Ltd',
  TRUST = 'TRUST',
}

export enum IndustryType {
  AGRICULTURE_ALLIED = 'Agriculture & Allied',
  MANUFACTURING = 'Manufacturing',
  PHARMACEUTICALS_HEALTHCARE = 'Pharmaceuticals & Healthcare',
  INFORMATION_TECHNOLOGY_SERVICES = 'Information Technology & Services',
  FINANCIAL_SERVICES = 'Financial Services',
  ENERGY_UTILITIES = 'Energy & Utilities',
  INFRASTRUCTURE_CONSTRUCTION = 'Infrastructure & Construction',
  CONSUMER_RETAIL = 'Consumer & Retail',
  TELECOM_COMMUNICATION = 'Telecom & Communication',
  LOGISTICS_TRANSPORTATION = 'Logistics & Transportation',
  EDUCATION_SKILL_DEVELOPMENT = 'Education & Skill Development',
  GOVERNMENT_PUBLIC_SECTOR = 'Government & Public Sector',
}

export enum SectorType {
  // Agriculture & Allied
  FARMING_CROP_PRODUCTION = 'Farming & Crop Production',
  DAIRY_POULTRY_FISHERIES = 'Dairy, Poultry, Fisheries',
  AGRI_INPUTS = 'Agri Inputs (Fertilizers, Seeds, Pesticides)',
  AGRI_EQUIPMENT = 'Agri Equipment',
  
  // Manufacturing
  AUTOMOBILES_AUTO_COMPONENTS = 'Automobiles & Auto Components',
  CHEMICALS_PETROCHEMICALS = 'Chemicals & Petrochemicals',
  CEMENT_BUILDING_MATERIALS = 'Cement & Building Materials',
  CONSUMER_DURABLES_ELECTRONICS = 'Consumer Durables & Electronics',
  TEXTILES_APPAREL = 'Textiles & Apparel',
  ENGINEERING_CAPITAL_GOODS = 'Engineering & Capital Goods',
  METALS_MINING = 'Metals & Mining',
  
  // Pharmaceuticals & Healthcare
  PHARMACEUTICALS_FORMULATIONS_APIS = 'Pharmaceuticals (Formulations, APIs)',
  BIOTECHNOLOGY_BIOSIMILARS = 'Biotechnology & Biosimilars',
  HOSPITALS_DIAGNOSTICS = 'Hospitals & Diagnostics',
  MEDICAL_DEVICES = 'Medical Devices',
  
  // Information Technology & Services
  IT_SERVICES_CONSULTING = 'IT Services & Consulting',
  SOFTWARE_SAAS = 'Software & SaaS',
  BPO_BPM_KPO = 'BPO / BPM / KPO',
  FINTECH_DIGITAL_PLATFORMS = 'Fintech & Digital Platforms',
  
  // Financial Services
  BANKS = 'Banks',
  NBFCs = 'NBFCs',
  INSURANCE = 'Insurance',
  ASSET_MANAGEMENT_MUTUAL_FUNDS = 'Asset Management / Mutual Funds',
  CAPITAL_MARKETS = 'Capital Markets',
  
  // Energy & Utilities
  POWER_GENERATION = 'Power Generation (Thermal, Hydro, Renewable)',
  OIL_GAS = 'Oil & Gas (Exploration, Refining, Distribution)',
  RENEWABLE_ENERGY = 'Renewable Energy (Solar, Wind, Bioenergy)',
  WATER_SUPPLY_SANITATION = 'Water Supply & Sanitation',
  
  // Infrastructure & Construction
  REAL_ESTATE = 'Real Estate (Residential, Commercial)',
  ROADS_HIGHWAYS = 'Roads & Highways',
  PORTS_AIRPORTS = 'Ports & Airports',
  RAILWAYS_METRO = 'Railways & Metro',
  URBAN_INFRASTRUCTURE = 'Urban Infrastructure',
  
  // Consumer & Retail
  FMCG = 'FMCG (Food, Beverages, Personal Care)',
  RETAIL = 'Retail (Organised, E-commerce)',
  HOSPITALITY = 'Hospitality (Hotels, Restaurants, Tourism)',
  MEDIA_ENTERTAINMENT = 'Media & Entertainment',
  
  // Telecom & Communication
  TELECOM_SERVICES = 'Telecom Services (Mobile, Broadband)',
  DIGITAL_COMMUNICATION_NETWORKING = 'Digital Communication & Networking',
  SATELLITE_COMMUNICATION = 'Satellite Communication',
  
  // Logistics & Transportation
  SHIPPING_PORTS = 'Shipping & Ports',
  AVIATION = 'Aviation',
  WAREHOUSING_COLD_CHAIN = 'Warehousing & Cold Chain',
  ROAD_TRANSPORT_LOGISTICS = 'Road Transport & Logistics',
  
  // Education & Skill Development
  SCHOOLS_COLLEGES = 'Schools & Colleges',
  EDTECH_PLATFORMS = 'EdTech Platforms',
  VOCATIONAL_TRAINING = 'Vocational Training',
  
  // Government & Public Sector
  DEFENCE_AEROSPACE = 'Defence & Aerospace',
  PSUs = 'PSUs',
  SOCIAL_INFRASTRUCTURE = 'Social Infrastructure (Healthcare, Education, Welfare Schemes)',
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

// Industry to Sector mapping
export const industrySectorMapping: Record<IndustryType, SectorType[]> = {
  [IndustryType.AGRICULTURE_ALLIED]: [
    SectorType.FARMING_CROP_PRODUCTION,
    SectorType.DAIRY_POULTRY_FISHERIES,
    SectorType.AGRI_INPUTS,
    SectorType.AGRI_EQUIPMENT,
  ],
  [IndustryType.MANUFACTURING]: [
    SectorType.AUTOMOBILES_AUTO_COMPONENTS,
    SectorType.CHEMICALS_PETROCHEMICALS,
    SectorType.CEMENT_BUILDING_MATERIALS,
    SectorType.CONSUMER_DURABLES_ELECTRONICS,
    SectorType.TEXTILES_APPAREL,
    SectorType.ENGINEERING_CAPITAL_GOODS,
    SectorType.METALS_MINING,
  ],
  [IndustryType.PHARMACEUTICALS_HEALTHCARE]: [
    SectorType.PHARMACEUTICALS_FORMULATIONS_APIS,
    SectorType.BIOTECHNOLOGY_BIOSIMILARS,
    SectorType.HOSPITALS_DIAGNOSTICS,
    SectorType.MEDICAL_DEVICES,
  ],
  [IndustryType.INFORMATION_TECHNOLOGY_SERVICES]: [
    SectorType.IT_SERVICES_CONSULTING,
    SectorType.SOFTWARE_SAAS,
    SectorType.BPO_BPM_KPO,
    SectorType.FINTECH_DIGITAL_PLATFORMS,
  ],
  [IndustryType.FINANCIAL_SERVICES]: [
    SectorType.BANKS,
    SectorType.NBFCs,
    SectorType.INSURANCE,
    SectorType.ASSET_MANAGEMENT_MUTUAL_FUNDS,
    SectorType.CAPITAL_MARKETS,
  ],
  [IndustryType.ENERGY_UTILITIES]: [
    SectorType.POWER_GENERATION,
    SectorType.OIL_GAS,
    SectorType.RENEWABLE_ENERGY,
    SectorType.WATER_SUPPLY_SANITATION,
  ],
  [IndustryType.INFRASTRUCTURE_CONSTRUCTION]: [
    SectorType.REAL_ESTATE,
    SectorType.ROADS_HIGHWAYS,
    SectorType.PORTS_AIRPORTS,
    SectorType.RAILWAYS_METRO,
    SectorType.URBAN_INFRASTRUCTURE,
  ],
  [IndustryType.CONSUMER_RETAIL]: [
    SectorType.FMCG,
    SectorType.RETAIL,
    SectorType.HOSPITALITY,
    SectorType.MEDIA_ENTERTAINMENT,
  ],
  [IndustryType.TELECOM_COMMUNICATION]: [
    SectorType.TELECOM_SERVICES,
    SectorType.DIGITAL_COMMUNICATION_NETWORKING,
    SectorType.SATELLITE_COMMUNICATION,
  ],
  [IndustryType.LOGISTICS_TRANSPORTATION]: [
    SectorType.SHIPPING_PORTS,
    SectorType.AVIATION,
    SectorType.WAREHOUSING_COLD_CHAIN,
    SectorType.ROAD_TRANSPORT_LOGISTICS,
  ],
  [IndustryType.EDUCATION_SKILL_DEVELOPMENT]: [
    SectorType.SCHOOLS_COLLEGES,
    SectorType.EDTECH_PLATFORMS,
    SectorType.VOCATIONAL_TRAINING,
  ],
  [IndustryType.GOVERNMENT_PUBLIC_SECTOR]: [
    SectorType.DEFENCE_AEROSPACE,
    SectorType.PSUs,
    SectorType.SOCIAL_INFRASTRUCTURE,
  ],
};

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
