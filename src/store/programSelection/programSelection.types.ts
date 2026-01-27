import {UserType} from '@constants/programSelection';

export type ProgramSelectionState = {
  bankId: string | null;
  bankName: string | null;
  productId: string | null; // 'dealer_finance' or 'vendor_finance'
  productName: string | null; // 'Dealer Finance' or 'Vendor Finance'
  programId: string | null;
  programName: string | null;
  userType: UserType | null;
};
