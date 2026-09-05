import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {CreditAccountDetailsState} from './types';
import {
  ProgramSummaryApi,
  DealerListItemApi,
  TransactionDetailsApi,
  OpenInvoiceApi,
  ClosedInvoiceApi,
  RepaymentApi,
} from '@services/api/soa_details.api';
import type {ProgramCounterPartySummary} from '@store/soa/dealer/dealer.types';

const initialState: CreditAccountDetailsState = {
  programSummary: null,
  accountLoanSummary: null,
  dealerList: [],
  transactionList: [],
  openInvoiceList: [],
  closedInvoiceList: [],
  repaymentList: [],
  loading: false,
  error: null,
  openInvoiceMessage: null,
  closedInvoiceMessage: null,
  repaymentMessage: null,
};

const creditAccountDetailsSlice = createSlice({
  name: 'creditAccountDetails',
  initialState,
  reducers: {
    fetchCreditAccountDetailsRequest: (
      state,
      _action: PayloadAction<{id: string; programId: string}>,
    ) => {
      state.loading = true;
      state.error = null;
    },
    fetchCreditAccountDetailsSuccess: (
      state,
      action: PayloadAction<{
        summary: ProgramSummaryApi;
        accountLoanSummary: ProgramCounterPartySummary | null;
        dealers: DealerListItemApi[];
        transactions: TransactionDetailsApi[];
        openInvoices: OpenInvoiceApi[];
        closedInvoices: ClosedInvoiceApi[];
        repayments: RepaymentApi[];
        openMessage?: string;
        closedMessage?: string;
        repaymentMessage?: string;
      }>,
    ) => {
      state.programSummary = action.payload.summary;
      state.accountLoanSummary = action.payload.accountLoanSummary;
      state.dealerList = action.payload.dealers;
      state.transactionList = action.payload.transactions;
      state.openInvoiceList = action.payload.openInvoices;
      state.closedInvoiceList = action.payload.closedInvoices;
      state.repaymentList = action.payload.repayments;
      state.openInvoiceMessage = action.payload.openMessage || null;
      state.closedInvoiceMessage = action.payload.closedMessage || null;
      state.repaymentMessage = action.payload.repaymentMessage || null;
      state.loading = false;
    },
    fetchCreditAccountDetailsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    resetCreditAccountDetails: (state) => {
      state.programSummary = null;
      state.accountLoanSummary = null;
      state.dealerList = [];
      state.transactionList = [];
      state.openInvoiceList = [];
      state.closedInvoiceList = [];
      state.repaymentList = [];
      state.loading = false;
      state.error = null;
      state.openInvoiceMessage = null;
      state.closedInvoiceMessage = null;
      state.repaymentMessage = null;
    },
  },
});

export const {
  fetchCreditAccountDetailsRequest,
  fetchCreditAccountDetailsSuccess,
  fetchCreditAccountDetailsFailure,
  resetCreditAccountDetails,
} = creditAccountDetailsSlice.actions;

export const creditAccountDetailsReducer = creditAccountDetailsSlice.reducer;
