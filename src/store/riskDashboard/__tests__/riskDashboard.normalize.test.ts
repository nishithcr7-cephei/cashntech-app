import {
  alertStatusLabel,
  normalizeBankOptions,
  normalizeBankRiskDetail,
  normalizeBorrowerRiskRow,
  normalizeEcosystemRisk,
  normalizeProgramOptions,
} from '@utils/normalizeRiskDashboard';
import {buildAlertDispatchParams} from '@services/api/riskDashboard.api';
import {initialAlertFilters} from '../riskDashboard.types';
import {dpdText, formatCr, pct} from '@utils/riskFormat';

jest.mock('@services/api/api', () => ({__esModule: true, default: {}}));
jest.mock('@utils/crypto', () => ({
  decryptConditionally: (value: string) =>
    value === 'ENCRYPTED_NAME' ? 'Decrypted Name' : value,
}));

describe('buildAlertDispatchParams', () => {
  it('sends no params when every filter is empty', () => {
    expect(buildAlertDispatchParams(initialAlertFilters)).toEqual({});
  });

  it('sends only the filled filters', () => {
    expect(
      buildAlertDispatchParams({
        bankId: 'b1',
        programId: '',
        status: 'PARTIAL',
        date: '2026-10-12',
      }),
    ).toEqual({bankId: 'b1', status: 'PARTIAL', date: '2026-10-12'});
  });
});

describe('normalizeEcosystemRisk', () => {
  it('maps snake_case fields and coerces numbers', () => {
    const data = normalizeEcosystemRisk({
      overview: {
        bank_count: 8,
        total_exposure: '56500000',
        overdue_amount: 30000000,
        npa_amount: 700000,
        npa_bank_count: 3,
        flagged_parties: 6,
        multi_bank_flagged: 1,
        dpd_buckets: [{label: 'Current', color: '#C8CDD4', amount: 1, pct: 2}],
      },
      rows: [
        {
          bank_id: 'b1',
          bank_name: 'UGRO Capital Limited',
          products: ['Purchase Invoice Discounting'],
          total_exposure: 800000,
          overdue_amount: 0,
          flagged_parties: 0,
          npa_amount: 0,
          health_status: 'Stable',
        },
      ],
    });
    expect(data.overview.totalExposure).toBe(56500000);
    expect(data.overview.dpdBuckets).toHaveLength(1);
    expect(data.rows[0]).toMatchObject({
      bankId: 'b1',
      bankName: 'UGRO Capital Limited',
      healthStatus: 'Stable',
    });
  });

  it('survives an empty payload', () => {
    const data = normalizeEcosystemRisk(undefined);
    expect(data.rows).toEqual([]);
    expect(data.overview.bankCount).toBe(0);
  });
});

describe('normalizeBankRiskDetail', () => {
  it('returns null when the bank has no exposure', () => {
    expect(normalizeBankRiskDetail(null)).toBeNull();
  });

  it('maps parties with plain-text names unchanged', () => {
    const detail = normalizeBankRiskDetail({
      bank_id: 'b1',
      bank_name: 'UGRO',
      parties: [
        {
          party_id: 'p1',
          party_name: 'Hemant Enterprises Pvt',
          city: 'Pune',
          role: 'Anchor',
          products: ['PID'],
          outstanding: 200000,
          current_dpd: 0,
          cross_bank_note: 'Only with this bank',
          cross_bank_flagged: false,
          status: 'Standard',
        },
      ],
    });
    expect(detail?.parties[0]).toMatchObject({
      partyId: 'p1',
      partyName: 'Hemant Enterprises Pvt',
      crossBankFlagged: false,
      status: 'Standard',
    });
  });
});

describe('alert + borrower helpers', () => {
  it('labels dispatch statuses like web', () => {
    expect(alertStatusLabel('PARTIAL')).toBe('Partially Sent');
    expect(alertStatusLabel('SKIPPED_STALE')).toBe('Skipped');
    expect(alertStatusLabel('')).toBe('-');
  });

  it('defaults borrower statuses and decrypts the name', () => {
    expect(
      normalizeBorrowerRiskRow({distributor_id: 'd1', distributor_name: 'ENCRYPTED_NAME'}),
    ).toMatchObject({
      distributorName: 'Decrypted Name',
      riskCategory: 'None',
      alertStatus: 'None',
      stopSupplyStatus: 'Not recommended',
      resolutionStatus: 'No case',
    });
  });

  it('builds dropdown options', () => {
    expect(
      normalizeBankOptions({partnerBankList: [{id: 'b1', bank_name: 'SBI'}, {id: ''}]}),
    ).toEqual([{id: 'b1', label: 'SBI'}]);
    expect(normalizeProgramOptions([{id: 'p1', program_name: 'Cipla'}])).toEqual([
      {id: 'p1', label: 'Cipla'},
    ]);
  });
});

describe('riskFormat', () => {
  it('formats crores, percentages and DPD', () => {
    expect(formatCr(56500000)).toBe('₹5.65 Cr');
    expect(pct(3, 6)).toBe(50);
    expect(pct(1, 0)).toBe(0);
    expect(dpdText(0)).toBe('—');
    expect(dpdText(12)).toBe('12');
  });
});
