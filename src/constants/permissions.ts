/**
 * Permission strings from /user/permissions API.
 * Use with useHasPermission(PERMISSIONS.INVOICE_LIST_EXPORT) etc.
 */
export const PERMISSIONS = {
  LMS: 'lms',
  TRANSACTIONS: 'lms.transactions',
  TRANSACTIONS_OVERVIEW: 'lms.transactions.overview',
  INVOICE_LIST: 'lms.transactions.invoice_list',
  INVOICE_LIST_EXPORT: 'lms.transactions.invoice_list.action.export',
  INVOICE_LIST_APPROVAL_HISTORY: 'lms.transactions.invoice_list.action.approval_history',
  INVOICE_LIST_IMPORT: 'lms.transactions.invoice_list.action.import',
  INVOICE_LIST_EDIT: 'lms.transactions.invoice_list.action.edit',
  INVOICE_LIST_RECREATE: 'lms.transactions.invoice_list.action.recreate_invoice',
  INVOICE_LIST_ATTACHMENT: 'lms.transactions.invoice_list.action.attachment',
  INVOICE_LIST_PRINT: 'lms.transactions.invoice_list.action.print',
  INVOICE_LIST_DELETE: 'lms.transactions.invoice_list.action.delete',
  INVOICE_LIST_APPROVE: 'lms.transactions.invoice_list.action.approve',
  INVOICE_LIST_REJECT: 'lms.transactions.invoice_list.action.reject',
  INVOICE_LIST_FILTER: 'lms.transactions.invoice_list.action.filter',
  INVOICE_LIST_CREATE: 'lms.transactions.invoice_list.action.create_invoice',
  INTEREST_ACCRUALS: 'lms.transactions.interest_accruals',
  INTEREST_ACCRUALS_VIEW_DAILY: 'lms.transactions.interest_accruals.action.view_daily_interest',
  DISBURSEMENT: 'lms.transactions.disbursement',
  DISBURSEMENT_MARK_AS_DISBURSED: 'lms.transactions.disbursement.action.mark_as_disbursed',
  DISBURSEMENT_SEND_MAIL: 'lms.transactions.disbursement.action.send_mail_to_bank',
  DISBURSEMENT_DELETE: 'lms.transactions.disbursement.action.delete',
  DISBURSEMENT_EXPORT: 'lms.transactions.disbursement.action.export',
  DISBURSEMENT_FILTER: 'lms.transactions.disbursement.action.filter',
  REPAYMENT_SETTLEMENT: 'lms.transactions.repayment_settlement',
} as const;
