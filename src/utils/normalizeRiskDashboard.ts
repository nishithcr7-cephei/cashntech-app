import {decryptConditionally} from '@utils/crypto';
import type {
  AlertDispatchRow,
  BankRiskDetail,
  BorrowerRiskRow,
  DpdBucket,
  EcosystemRiskData,
  FilterOption,
  PartyRiskProfile,
} from '@store/riskDashboard/riskDashboard.types';

const num = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const str = (value: unknown): string =>
  value === null || value === undefined ? '' : String(value);

const strOrNull = (value: unknown): string | null =>
  value === null || value === undefined || value === '' ? null : String(value);

const arr = (value: unknown): any[] => (Array.isArray(value) ? value : []);

/** Party names come from PartyMaster.entity_name, which may be AES-encrypted. */
const partyName = (value: unknown): string => decryptConditionally(str(value));

const ALERT_STATUS_LABELS: Record<string, string> = {
  SENT: 'Sent',
  PARTIAL: 'Partially Sent',
  FAILED: 'Failed',
  PENDING: 'Pending',
  SKIPPED_NO_RECIPIENTS: 'Skipped',
  SKIPPED_NO_TEMPLATE: 'Skipped',
  SKIPPED_STALE: 'Skipped',
};

export const alertStatusLabel = (status: string): string =>
  ALERT_STATUS_LABELS[status] ?? (status || '-');

const normalizeBuckets = (raw: unknown): DpdBucket[] =>
  arr(raw).map(b => ({
    label: str(b?.label),
    color: str(b?.color),
    amount: num(b?.amount),
    pct: num(b?.pct),
  }));

export const normalizeEcosystemRisk = (raw: any): EcosystemRiskData => {
  const o = raw?.overview ?? {};
  return {
    overview: {
      bankCount: num(o.bank_count),
      totalExposure: num(o.total_exposure),
      overdueAmount: num(o.overdue_amount),
      npaAmount: num(o.npa_amount),
      npaBankCount: num(o.npa_bank_count),
      flaggedParties: num(o.flagged_parties),
      multiBankFlagged: num(o.multi_bank_flagged),
      dpdBuckets: normalizeBuckets(o.dpd_buckets),
    },
    rows: arr(raw?.rows).map(r => ({
      bankId: str(r?.bank_id),
      bankName: str(r?.bank_name),
      products: arr(r?.products).map(str),
      totalExposure: num(r?.total_exposure),
      overdueAmount: num(r?.overdue_amount),
      flaggedParties: num(r?.flagged_parties),
      npaAmount: num(r?.npa_amount),
      healthStatus: str(r?.health_status),
    })),
  };
};

/** `null` = bank has no exposure (backend returns data: null). */
export const normalizeBankRiskDetail = (raw: any): BankRiskDetail | null => {
  if (!raw) {
    return null;
  }
  return {
    bankId: str(raw.bank_id),
    bankName: str(raw.bank_name),
    products: arr(raw.products).map(str),
    totalExposure: num(raw.total_exposure),
    overdueAmount: num(raw.overdue_amount),
    npaAmount: num(raw.npa_amount),
    flaggedParties: num(raw.flagged_parties),
    stressFromElsewhere: num(raw.stress_from_elsewhere),
    dpdBuckets: normalizeBuckets(raw.dpd_buckets),
    productSummaries: arr(raw.product_summaries).map(p => ({
      product: str(p?.product),
      productShort: str(p?.product_short),
      monitoredPartyType: str(p?.monitored_party_type),
      programCount: num(p?.program_count),
      outstanding: num(p?.outstanding),
      atRisk: num(p?.at_risk),
      flaggedParties: num(p?.flagged_parties),
    })),
    parties: arr(raw.parties).map(p => ({
      partyId: str(p?.party_id),
      partyName: partyName(p?.party_name),
      city: strOrNull(p?.city),
      role: str(p?.role),
      products: arr(p?.products).map(str),
      outstanding: num(p?.outstanding),
      currentDpd: num(p?.current_dpd),
      crossBankNote: str(p?.cross_bank_note),
      crossBankFlagged: !!p?.cross_bank_flagged,
      status: str(p?.status),
    })),
  };
};

export const normalizePartyRiskProfile = (raw: any): PartyRiskProfile => ({
  partyName: partyName(raw?.party_name),
  city: strOrNull(raw?.city),
  role: str(raw?.role),
  totalOutstanding: num(raw?.total_outstanding),
  totalLimit: num(raw?.total_limit),
  worstDpd: num(raw?.worst_dpd),
  overduePrograms: num(raw?.overdue_programs),
  totalPrograms: num(raw?.total_programs),
  banksNotified: num(raw?.banks_notified),
  programs: arr(raw?.programs).map(p => ({
    bankId: str(p?.bank_id),
    bankName: str(p?.bank_name),
    product: str(p?.product),
    role: str(p?.role),
    programName: str(p?.program_name),
    limit: num(p?.limit),
    outstanding: num(p?.outstanding),
    currentDpd: num(p?.current_dpd),
    status: str(p?.status),
  })),
  history: arr(raw?.history).map(h => ({month: str(h?.month), dpd: num(h?.dpd)})),
  linked: arr(raw?.linked).map(l => ({
    name: partyName(l?.name),
    relationship: str(l?.relationship),
    note: str(l?.note),
    flagged: !!l?.flagged,
  })),
  alerts: arr(raw?.alerts).map(a => ({
    date: str(a?.date),
    what: str(a?.what),
    who: str(a?.who),
  })),
  dpdBuckets: normalizeBuckets(raw?.dpd_buckets),
});

export const normalizeAlertDispatchRow = (r: any): AlertDispatchRow => {
  const status = str(r?.status);
  return {
    id: str(r?.id),
    crossingDate: str(r?.crossing_date),
    triggerCode: str(r?.trigger_code),
    emailTriggerType: str(r?.email_trigger_type),
    program: str(r?.program),
    monitoredParty: partyName(r?.monitored_party),
    invoiceCount: num(r?.invoice_count),
    maxDpd: num(r?.max_dpd),
    totalOutstanding: num(r?.total_outstanding),
    status,
    statusLabel: alertStatusLabel(status),
    actionStatus: str(r?.action_status),
    caseId: strOrNull(r?.case_id),
    caseStatus: strOrNull(r?.case_status),
    closureDate: strOrNull(r?.closure_date),
    createdAt: str(r?.created_at),
  };
};

export const normalizeBorrowerRiskRow = (r: any): BorrowerRiskRow => ({
  distributorId: str(r?.distributor_id),
  distributorName: partyName(r?.distributor_name),
  activeCompanies: num(r?.active_companies),
  activeBanks: num(r?.active_banks),
  totalExposure: num(r?.total_exposure),
  currentDpd: num(r?.current_dpd),
  riskCategory: str(r?.risk_category) || 'None',
  alertStatus: str(r?.alert_status) || 'None',
  stopSupplyStatus: str(r?.stop_supply_status) || 'Not recommended',
  resolutionStatus: str(r?.resolution_status) || 'No case',
});

export const normalizeBankOptions = (raw: any): FilterOption[] =>
  arr(raw?.partnerBankList)
    .map(b => ({id: str(b?.id), label: str(b?.bank_name)}))
    .filter(b => b.id && b.label);

export const normalizeProgramOptions = (raw: unknown): FilterOption[] =>
  arr(raw)
    .map(p => ({id: str(p?.id), label: str(p?.program_name)}))
    .filter(p => p.id && p.label);
