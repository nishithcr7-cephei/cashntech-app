import {UserType} from '@constants/programSelection';
import type {Bank} from '@constants/programSelection';

export type SelectedProgram = {
  bankId: string;
  bankName: string;
  productId: string;
  productName: string;
  programId: string;
  programName: string;
  userType: UserType;
};

export type ProgramSelectionState = {
  // UI scope: "all programs" vs "specific program"
  programScope: 'all' | 'selected';
  bankId: string | null;
  bankName: string | null;
  productId: string | null;
  productName: string | null;
  programId: string | null;
  programName: string | null;
  userType: UserType | null;
  // Multiple program selections
  selectedPrograms: SelectedProgram[];
  // User scope (GET /user/scope) - banks, products, programs
  scopeData: Bank[] | null;
  scopeLoading: boolean;
  scopeError: string | null;
  /** All program IDs when scope loaded (for "All Program" → invoice/summary on next page) */
  allProgramIds: string[] | null;
};
