import type {Bank} from '@constants/programSelection';
import type {InvoiceOverviewSummaryItem} from '@store/invoiceOverview';
import type {ProductTabType, MetricItem, DashboardKpis} from '../types';

/**
 * Format date as DD MMM YYYY (e.g., 15 Apr 2026)
 */
export const formatDateDDMmmYYYY = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (error) {
    return dateStr || '-';
  }
};

/**
 * Get program IDs for a specific product tab
 */
export const getProgramIdsForTab = (
  tab: ProductTabType,
  banks: Bank[] | null,
): string[] => {
  if (!banks || banks.length === 0) return [];
  const ids: string[] = [];
  banks.forEach(bank => {
    bank.products.forEach(product => {
      const isDFProduct = product.name.toLowerCase().includes('dealer finance');
      product.programs.forEach(program => {
        const isDFProgram =
          program.name.toLowerCase().includes('df') ||
          program.name.toLowerCase().includes('dealer finance');
        const includeInAll = tab === 'all_product';
        const includeInDF =
          tab === 'dealer_finance' && (isDFProduct || isDFProgram);
        if (includeInAll || includeInDF) {
          ids.push(program.id);
        }
      });
    });
  });
  return Array.from(new Set(ids));
};

/**
 * Calculate and format metrics for the dashboard cards
 */
export const getCardMetrics = (
  productTab: ProductTabType,
  kpis?: DashboardKpis | null,
  summaryData?: InvoiceOverviewSummaryItem[],
): MetricItem[] => {
  const parsed = {
    totalLimit: parseFloat(kpis?.total_program_limit ?? '0') || 0,
    utilizedAmount: parseFloat(kpis?.utilized_amount ?? '0') || 0,
    utilizedRate: parseFloat(kpis?.utilized_rate ?? '0') || 0,
    activeDealerRatio: parseFloat(kpis?.active_dealer_ratio ?? '0') || 0,
    availableLimit: parseFloat(kpis?.available_limit ?? '0') || 0,
    overdueAmount: parseFloat(kpis?.overdue_amount ?? '0') || 0,
    principalOverdue: parseFloat(kpis?.principal_overdue ?? '0') || 0,
    interestOverdue: parseFloat(kpis?.interest_overdue ?? '0') || 0,
    dpdDays: parseFloat(kpis?.dpd_days ?? '0') || 0,
  };

  const sumTotalLimit = (summaryData || []).reduce((acc, curr) => acc + (Number(curr.sanctioned_limit) || 0), 0);
  const sumUtilizedAmount = (summaryData || []).reduce((acc, curr) => acc + (Number(curr.utilized_amount) || 0), 0);
  const sumOverdueAmount = (summaryData || []).reduce((acc, curr) => acc + (Number(curr.overdue_amount) || 0), 0);
  const sumPrincipalOverdue = (summaryData || []).reduce((acc, curr) => acc + (Number(curr.principal_overdue) || 0), 0);
  const sumInterestOverdue = (summaryData || []).reduce((acc, curr) => acc + (Number(curr.interest_overdue) || 0), 0);
  const totalDealers = (summaryData || []).length;
  const activeDealers = (summaryData || []).filter(d => (Number(d.utilized_amount) || 0) > 0).length;

  const finalTotalLimit = parsed.totalLimit || sumTotalLimit;
  const finalUtilizedAmount = parsed.utilizedAmount || sumUtilizedAmount;
  const finalOverdueAmount = parsed.overdueAmount || sumOverdueAmount;
  const finalPrincipalOverdue = parsed.principalOverdue || sumPrincipalOverdue;
  const finalInterestOverdue = parsed.interestOverdue || sumInterestOverdue;

  const formatCurrency = (amount: number) =>
    `₹ ${amount.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;

  const formatPercentage = (value: number) =>
    `${value.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}%`;

  return [
    {label: 'Total Program Limit', value: formatCurrency(finalTotalLimit)},
    {label: 'Utilized Amount', value: formatCurrency(finalUtilizedAmount)},
    {
      label: 'Utilized Rate',
      value: formatPercentage(
        (parsed.utilizedRate || (finalTotalLimit > 0 ? finalUtilizedAmount / finalTotalLimit : 0)) * 100
      ),
    },
    {
      label: 'Active Dealer Ratio',
      value: totalDealers > 0 ? `${activeDealers}/${totalDealers}` : '0/0',
    },
    {label: 'Available Limit', value: formatCurrency(finalTotalLimit - finalUtilizedAmount)},
    {label: 'DPD Days', value: (parsed.dpdDays || 0).toString()},
    {
      label: 'Overdue Amount',
      value: formatCurrency(finalOverdueAmount),
      subValues: [
        { label: 'Principal Overdue', value: formatCurrency(finalPrincipalOverdue) },
        { label: 'Interest Overdue', value: formatCurrency(finalInterestOverdue) },
      ]
    },
  ];
};
