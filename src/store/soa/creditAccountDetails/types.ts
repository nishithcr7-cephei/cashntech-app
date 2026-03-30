import {ProgramSummaryApi, DealerListItemApi, TransactionDetailsApi, OpenInvoiceApi, ClosedInvoiceApi, RepaymentApi} from '@services/api/soa_details.api';

export interface CreditAccountDetailsState {
  programSummary: ProgramSummaryApi | null;
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
