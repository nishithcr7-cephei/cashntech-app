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
  method: string;
  role: string;
  status: string;
};

export type BankProgram = {
  id: string;
  name: string;
  /** workflow_config.level for current user on this product (from GET /user/scope) */
  approval_level?: number | null;
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
            method: 'Push',
            role: 'Dealer Maker',
            status: 'Active',
          },
          {
            id: 'DF_FY26',
            name: 'DF Program FY26',
            userType: 'dealer',
            method: 'Push',
            role: 'Dealer Maker',
            status: 'Active',
          },
          {
            id: 'DF_FY27',
            name: 'DF Program FY27',
            userType: 'dealer',
            method: 'Push',
            role: 'Dealer Maker',
            status: 'Active',
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
            method: 'Push',
            role: 'Dealer Maker',
            status: 'Active',
          },
          {
            id: 'TCL_DF_ERISPHARMA',
            name: 'DF Program Eris Pharma',
            userType: 'dealer',
            method: 'Push',
            role: 'Dealer Maker',
            status: 'Active',
          },
          {
            id: 'TCL_DF_CIPLA',
            name: 'DF Program Cipla',
            userType: 'dealer',
            method: 'Push',
            role: 'Dealer Maker',
            status: 'Active',
          },
        ],
      },
    ],
  },
];
