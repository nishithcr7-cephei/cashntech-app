/**
 * Permission keys for the nested GET /user/permissions payload.
 *
 * Encoding (see `evaluatePermissionKey`):
 *   - `resource.action`  e.g. invoice_list.create_invoice
 *   - `module:<key>`     e.g. module:lms
 *   - `any:<resource>`   any action on that resource
 *   - `anyReport:view`   any report resource view grant
 *
 * Use with useHasPermission(PERMISSIONS.INVOICE_LIST_CREATE) etc.
 * Product scope (DF/VF) is applied inside the hook via workspace productId.
 */
export const PERMISSIONS = {
  LMS: 'module:lms',
  DASHBOARD_MANAGEMENT: 'any:dashboard_management',
  MASTER_DATA_MANAGEMENT: 'module:lms',
  SCF_MASTER: 'any:supply_chain_finance',
  LMS_ID_CREATION: 'any:lms_id_creation',
  LMS_ID_CREATION_ADD: 'lms_id_creation.add_new_id',
  LMS_ID_CREATION_FILTER: 'lms_id_creation.filter',
  BANK_ID_LIST: 'any:bank_id_list',
  PRIMARY_COUNTER_PARTY: 'any:primary_party_and_counter_party',
  TRANSACTIONS: 'module:lms',
  TRANSACTIONS_OVERVIEW: 'overview.view',
  INVOICE_LIST: 'invoice_list.view',
  INVOICE_LIST_EXPORT: 'invoice_list.export',
  INVOICE_LIST_APPROVAL_HISTORY: 'invoice_list.approval_history',
  INVOICE_LIST_IMPORT: 'invoice_list.import',
  INVOICE_LIST_EDIT: 'invoice_list.edit',
  INVOICE_LIST_RECREATE: 'invoice_list.recreate_invoice',
  INVOICE_LIST_ATTACHMENT: 'invoice_list.attachment',
  INVOICE_LIST_PRINT: 'invoice_list.print',
  INVOICE_LIST_DELETE: 'invoice_list.delete',
  /** Backend seed uses a single approve_reject action for both. */
  INVOICE_LIST_APPROVE: 'invoice_list.approve_reject',
  INVOICE_LIST_REJECT: 'invoice_list.approve_reject',
  INVOICE_LIST_FILTER: 'invoice_list.filter',
  INVOICE_LIST_CREATE: 'invoice_list.create_invoice',
  /** Same resource/action — product UUID on the grant scopes DF vs VF. */
  DF_CREATE_INVOICE: 'invoice_list.create_invoice',
  VF_CREATE_INVOICE: 'invoice_list.create_invoice',
  INVOICE_LIST_ADMIN_VERIFICATION: 'invoice_list.invoice_verification',
  INVOICE_LIST_FINANCE_REQUEST: 'invoice_list.finance_request',
  INVOICE_LIST_UPLOAD_VERIFY: 'invoice_list.upload_verify',
  VF_INVOICE_LIST_UPLOAD_VERIFY: 'invoice_list.upload_verify',
  CREATE_INVOICE: 'invoice_list.create_invoice',
  INTEREST_ACCRUALS: 'interest_accruals.view',
  INTEREST_ACCRUALS_VIEW_DAILY: 'interest_accruals.view_daily_interest',
  DISBURSEMENT: 'disbursement.view',
  DISBURSEMENT_MARK_AS_DISBURSED: 'disbursement.mark_as_disbursed',
  DISBURSEMENT_SEND_MAIL: 'disbursement.send_mail_to_bank',
  /** Not in current backend catalog — stays false until seeded. */
  DISBURSEMENT_DELETE: 'disbursement.delete',
  DISBURSEMENT_EXPORT: 'disbursement.export',
  DISBURSEMENT_FILTER: 'disbursement.filter',
  REPAYMENT_SETTLEMENT: 'repayment_settlement.view',
  DPD_PENAL_NPA: 'dpd.view',
  SOA: 'soa.view',
  REPORTING_ANALYSIS: 'anyReport:view',
  REPORT_ALL_LOANS: 'all_loans_report.view',
  REPORT_DISBURSEMENT: 'disbursement_report.view',
  REPORT_DPD: 'dpd_report.view',
  REPORT_DAILY_ACCRUAL: 'daily_accrual_report.view',
  REPORT_MONTHLY_INTEREST: 'monthly_interest_report.view',
  REPORT_REPAYMENT: 'repayment_report.view',
  REPORT_INVOICE_OUTSTANDING: 'invoice_outstanding_report.view',
  REPORT_LOAN_STATUS: 'loan_status_report.view',
  REPORT_ALL_PRODUCT_OUTSTANDING: 'all_product_outstanding_report.view',
  REPORT_UTILIZATION: 'utilization_report.view',
} as const;

export type PermissionConstant =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
