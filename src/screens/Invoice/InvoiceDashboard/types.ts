import type {InvoiceOverviewSummaryItem} from '@store/invoiceOverview';
import type {Bank} from '@constants/programSelection';

export type ProductTabType =
  | 'all_product'
  | 'dealer_finance'
  | 'vendor_finance'
  | 'pid'
  | 'sid';

export type MetricSubValue = {
  label: string;
  value: string;
};

export type MetricItem = {
  label: string;
  value: string;
  subValues?: MetricSubValue[];
};

export interface DashboardKpis {
  total_program_limit: string;
  utilized_amount: string;
  utilized_rate: string;
  active_dealer_ratio: string;
  available_limit: string;
  overdue_amount: string;
  principal_overdue: string;
  interest_overdue: string;
  penal_overdue: string;
  dpd_days: string;
}
