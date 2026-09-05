import {RootState} from '@store/app/store';

export const selectCreditAccountDetailsState = (state: RootState) => state.creditAccountDetails;
export const selectProgramSummary = (state: RootState) => state.creditAccountDetails.programSummary;
export const selectAccountLoanSummary = (state: RootState) =>
  state.creditAccountDetails.accountLoanSummary;
export const selectDealerListDetails = (state: RootState) => state.creditAccountDetails.dealerList;
export const selectCreditAccountDetailsLoading = (state: RootState) => state.creditAccountDetails.loading;
export const selectCreditAccountDetailsError = (state: RootState) => state.creditAccountDetails.error;
export const selectTransactionList = (state: RootState) => state.creditAccountDetails.transactionList;
export const selectOpenInvoiceList = (state: RootState) => state.creditAccountDetails.openInvoiceList;
export const selectClosedInvoiceList = (state: RootState) => state.creditAccountDetails.closedInvoiceList;
export const selectRepaymentList = (state: RootState) => state.creditAccountDetails.repaymentList;
export const selectOpenInvoiceMessage = (state: RootState) => state.creditAccountDetails.openInvoiceMessage;
export const selectClosedInvoiceMessage = (state: RootState) => state.creditAccountDetails.closedInvoiceMessage;
export const selectRepaymentMessage = (state: RootState) => state.creditAccountDetails.repaymentMessage;
