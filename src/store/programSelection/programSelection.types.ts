import {UserType} from '@constants/programSelection';
import type {Bank} from '@constants/programSelection';

export type ProgramSelectionState = {
  bankId: string | null;
  bankName: string | null;
  productId: string | null;
  productName: string | null;
  programId: string | null;
  programName: string | null;
  userType: UserType | null;
  // User scope (GET /user/scope) - banks, products, programs
  scopeData: Bank[] | null;
  scopeLoading: boolean;
  scopeError: string | null;
};
