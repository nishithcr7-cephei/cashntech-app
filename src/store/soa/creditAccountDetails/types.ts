import {ProgramSummaryApi, DealerListItemApi, TransactionDetailsApi, OpenInvoiceApi, ClosedInvoiceApi, RepaymentApi} from '@services/api/soa_details.api';
import type {ProgramCounterPartySummary} from '@store/soa/dealer/dealer.types';

export interface CreditAccountDetailsState {
  programSummary: ProgramSummaryApi | null;
  /** Account-level LOAN DETAILS (DUE/RECEIVED) from counter-party summary API */
  accountLoanSummary: ProgramCounterPartySummary | null;
  dealerList: DealerListItemApi[];
  transactionList: TransactionDetailsApi[];
  openInvoiceList: OpenInvoiceApi[];
  closedInvoiceList: ClosedInvoiceApi[];
  repaymentList: RepaymentApi[];
  loading: boolean;
  error: string | null;
  openInvoiceMessage: string | null;
  closedInvoiceMessage: string | null;
  repaymentMessage: string | null;
}
