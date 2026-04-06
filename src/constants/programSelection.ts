/**
 * Program Selection Constants
 * Static data structure for banks, products, and programs
 * Future: Will be replaced with API data
 */

export type UserType = 'dealer' | 'vendor';

export type Program = {
  id: string;
  name: string;
  userType: UserType; // 'dealer' or 'vendor'
};

export type BankProgram = {
  id: string;
  name: string;
  programs: Program[];
};

export type Bank = {
  id: string;
  name: string;
  partyId: string; // Anchor Party UUID
  products: BankProgram[]; // Dealer Finance, Vendor Finance, etc.
};

// Static data - future ma API se replace hoga
export const BANKS_DATA: Bank[] = [
  {
    id: 'UGRO',
    name: 'UGRO',
    partyId: 'ugro-party-uuid',
    products: [
      {
        id: 'dealer_finance',
        name: 'Dealer Finance',
        programs: [
          {
            id: 'DF_FY25',
            name: 'DF Program FY25',
            userType: 'dealer',
          },
          {
            id: 'DF_FY26',
            name: 'DF Program FY26',
            userType: 'dealer',
          },
          {
            id: 'DF_FY27',
            name: 'DF Program FY27',
            userType: 'dealer',
          },
        ],
      },
    ],
  },
  {
    id: 'TCL',
    name: 'Tata Capital Limited',
    partyId: 'tcl-party-uuid',
    products: [
      {
        id: 'dealer_finance',
        name: 'Dealer Finance',
        programs: [
          {
            id: 'TCL_DF_SUNPHARMA',
            name: 'DF Program Sun Pharma',
            userType: 'dealer',
          },
          {
            id: 'TCL_DF_ERISPHARMA',
            name: 'DF Program Eris Pharma',
            userType: 'dealer',
          },
          {
            id: 'TCL_DF_CIPLA',
            name: 'DF Program Cipla',
            userType: 'dealer',
          },
        ],
      },
    ],
  },
];
