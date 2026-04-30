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
    penalOverdue: parseFloat(kpis?.penal_overdue ?? '0') || 0,
    dpdDays: parseFloat(kpis?.dpd_days ?? '0') || 0,
  };

  const sumTotalLimit = (summaryData || []).reduce((acc, curr) => acc + (Number(curr.sanctioned_limit) || 0), 0);
  const sumUtilizedAmount = (summaryData || []).reduce((acc, curr) => acc + (Number(curr.utilized_amount) || 0), 0);
  const sumOverdueAmount = (summaryData || []).reduce((acc, curr) => acc + (Number(curr.overdue_amount) || 0), 0);
  const sumPrincipalOverdue = (summaryData || []).reduce((acc, curr) => acc + (Number(curr.principal_overdue) || 0), 0);
  const sumInterestOverdue = (summaryData || []).reduce((acc, curr) => acc + (Number(curr.interest_overdue) || 0), 0);
  const sumPenalOverdue = (summaryData || []).reduce((acc, curr) => acc + (Number(curr.penal_overdue) || 0), 0);
  const totalDealers = (summaryData || []).length;
  const activeDealers = (summaryData || []).filter(d => (Number(d.utilized_amount) || 0) > 0).length;

  const finalTotalLimit = parsed.totalLimit || sumTotalLimit;
  const finalUtilizedAmount = parsed.utilizedAmount || sumUtilizedAmount;
  const finalOverdueAmount = parsed.overdueAmount || sumOverdueAmount;
  const finalPrincipalOverdue = parsed.principalOverdue || sumPrincipalOverdue;
  const finalInterestOverdue = parsed.interestOverdue || sumInterestOverdue;
  const finalPenalOverdue = parsed.penalOverdue || sumPenalOverdue;

  const formatCurrency = (amount: number) =>
    `₹ ${amount.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;

  const formatPercentage = (value: number) =>
    `${value.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}%`;

  const totalLimitVal = kpis?.total_program_limit ? formatCurrency(parseFloat(kpis.total_program_limit)) : (sumTotalLimit > 0 ? formatCurrency(sumTotalLimit) : '-');
  const utilizedAmountVal = kpis?.utilized_amount ? formatCurrency(parseFloat(kpis.utilized_amount)) : (sumUtilizedAmount > 0 ? formatCurrency(sumUtilizedAmount) : '-');
  const availableLimitVal = kpis?.available_limit ? formatCurrency(parseFloat(kpis.available_limit)) : (finalTotalLimit > 0 ? formatCurrency(finalTotalLimit - finalUtilizedAmount) : '-');
  const activeDealerRatioVal = kpis?.active_dealer_ratio ? `${parseFloat(kpis.active_dealer_ratio).toFixed(2)}%` : (totalDealers > 0 ? `${activeDealers}/${totalDealers}` : '-');

  const utilizedRateVal = kpis?.utilized_rate ? `${parseFloat(kpis.utilized_rate).toFixed(2)}%` : (finalTotalLimit > 0 ? formatPercentage((finalUtilizedAmount / finalTotalLimit) * 100) : '-');
  
  // Always show these, default to '-' if not present or 0
  const overdueAmountVal = (parseFloat(kpis?.overdue_amount ?? '0') > 0) ? formatCurrency(parseFloat(kpis!.overdue_amount)) : (sumOverdueAmount > 0 ? formatCurrency(sumOverdueAmount) : '-');
  const principalOverdueVal = (parseFloat(kpis?.principal_overdue ?? '0') > 0) ? formatCurrency(parseFloat(kpis!.principal_overdue)) : (sumPrincipalOverdue > 0 ? formatCurrency(sumPrincipalOverdue) : '-');
  const interestOverdueVal = (parseFloat(kpis?.interest_overdue ?? '0') > 0) ? formatCurrency(parseFloat(kpis!.interest_overdue)) : (sumInterestOverdue > 0 ? formatCurrency(sumInterestOverdue) : '-');
  const penalOverdueVal = (parseFloat(kpis?.penal_overdue ?? '0') > 0) ? formatCurrency(parseFloat(kpis!.penal_overdue)) : (sumPenalOverdue > 0 ? formatCurrency(sumPenalOverdue) : '-');
  
  const dpdDaysVal = kpis?.dpd_days ? kpis.dpd_days : '-';

  const metrics: MetricItem[] = [
    {label: 'Total Program Limit', value: totalLimitVal},
    {label: 'Utilized Amount', value: utilizedAmountVal},
    {label: 'Utilized Rate', value: utilizedRateVal},
    {label: 'Active Dealer Ratio', value: activeDealerRatioVal},
    {label: 'Available Limit', value: availableLimitVal},
    {
      label: 'Overdue Amount',
      value: '',
      subValues: [
        { label: 'Principal Amount', value: principalOverdueVal },
        { label: 'Interest Amount', value: interestOverdueVal },
        { label: 'Penal Interest Amount', value: penalOverdueVal },
      ]
    }
  ];

  return metrics;
};
