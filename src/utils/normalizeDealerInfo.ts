import type {
  DealerInfoParticipant,
  DealerInfoResponse,
  PartyBankDetail,
} from '@store/invoice/inv.types';
import {decryptValue} from '@utils/decrypt';

function isBankAccountUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  );
}

/** Stable map key: prefer decrypted account number so ENC + plain rows merge. */
function bankAccountMapKey(accountNumber: string): string {
  const raw = String(accountNumber ?? '').trim();
  if (!raw) return '';
  return (decryptValue(raw) || raw).trim() || raw;
}

function pick(row: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && v !== '') {
      return v;
    }
  }
  return undefined;
}

function parseBasicParameters(
  val: unknown,
): DealerInfoResponse['basic_parameters'] {
  if (val == null) {
    return undefined;
  }
  if (typeof val === 'object') {
    return val as DealerInfoResponse['basic_parameters'];
  }
  if (typeof val === 'string') {
    try {
      return JSON.parse(val) as DealerInfoResponse['basic_parameters'];
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function toNumber(val: unknown): number {
  if (val === undefined || val === null || val === '') {
    return 0;
  }
  const n = typeof val === 'string' ? parseFloat(val) : Number(val);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Parse the unified party-info `bankAccounts` JSON aggregate (array or JSON
 * string, returned for DF + VF alike) into PartyBankDetail[]. Prefers the
 * real UUID `id` when present (required for credit_to_account_id on
 * create/edit — PR6). Falls back to account number as id only for legacy
 * flat rows that predate the bankAccounts aggregate.
 */
function parseBankAccounts(val: unknown): PartyBankDetail[] {
  if (val == null || val === '') {
    return [];
  }

  let list: unknown = val;
  if (typeof val === 'string') {
    try {
      list = JSON.parse(val);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(list)) {
    return [];
  }

  const out: PartyBankDetail[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const row = entry as Record<string, unknown>;
    const account = String(
      pick(row, 'account_number', 'accountNumber') ?? '',
    ).trim();
    if (!account) {
      continue;
    }
    const idRaw = pick(row, 'id');
    const id = idRaw != null && String(idRaw).trim() !== ''
      ? String(idRaw)
      : account;
    out.push({id, account_number: account});
  }
  return out;
}

function preferBankDetail(
  existing: PartyBankDetail | undefined,
  next: PartyBankDetail,
): PartyBankDetail {
  if (!existing) return next;
  const existingIsUuid = isBankAccountUuid(existing.id);
  const nextIsUuid = isBankAccountUuid(next.id);
  // Prefer real bankAccounts.id UUID over account-number fallback ids.
  if (nextIsUuid && !existingIsUuid) return next;
  if (existingIsUuid && !nextIsUuid) return existing;
  return next;
}

function collectBankDetails(
  row: Record<string, unknown>,
  bankMap: Map<string, PartyBankDetail>,
): void {
  const fromAgg = parseBankAccounts(
    pick(row, 'bankAccounts', 'bank_accounts'),
  );
  if (fromAgg.length > 0) {
    for (const b of fromAgg) {
      const key = bankAccountMapKey(b.account_number);
      if (!key) continue;
      bankMap.set(key, preferBankDetail(bankMap.get(key), b));
    }
    return;
  }

  // Legacy flat rows: one account_number column per row (no bankAccounts agg).
  const account = String(pick(row, 'account_number', 'accountNumber') ?? '').trim();
  if (account) {
    const key = bankAccountMapKey(account);
    if (!key) return;
    bankMap.set(
      key,
      preferBankDetail(bankMap.get(key), {
        id: account,
        account_number: account,
      }),
    );
  }
}

/**
 * Available limit aligned with backend: sanctioned - utilized - pipeline_requests.
 */
export function getParticipantAvailableLimit(
  participant: Pick<
    DealerInfoParticipant,
    'sanctioned_limit' | 'utilized_amount' | 'pipeline_requests'
  >,
): number {
  const sanctioned = toNumber(participant.sanctioned_limit);
  const utilized = toNumber(participant.utilized_amount);
  const pipeline = toNumber(participant.pipeline_requests);
  return sanctioned - utilized - pipeline;
}

/**
 * Maps flat SQL rows from the unified party-info endpoint to nested
 * DealerInfoResponse. Accepts `bankAccounts` aggregates with UUID ids
 * (DF + VF alike).
 */
export function normalizeDealerInfoResponse(
  programId: string,
  raw: unknown,
): DealerInfoResponse | null {
  if (!raw) {
    return null;
  }

  if (
    typeof raw === 'object' &&
    !Array.isArray(raw) &&
    Array.isArray((raw as DealerInfoResponse).participants)
  ) {
    return raw as DealerInfoResponse;
  }

  const rows: unknown[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as {data?: unknown}).data)
      ? ((raw as {data: unknown[]}).data ?? [])
      : [];

  if (rows.length === 0) {
    return null;
  }

  const first = rows[0] as Record<string, unknown>;
  const basic_parameters = parseBasicParameters(
    pick(first, 'basic_parameters', 'basicParameters'),
  );
  const bankMap = new Map<string, PartyBankDetail>();

  const participants: DealerInfoParticipant[] = rows.map((row, index) => {
    const r = row as Record<string, unknown>;
    collectBankDetails(r, bankMap);

    const pipelineRaw = pick(r, 'pipeline_requests', 'pipelineRequests');

    return {
      id: String(pick(r, 'mappingId', 'mappingid', 'id') ?? index),
      company_code: String(pick(r, 'company_code', 'companyCode') ?? ''),
      company_code_given_by_party: String(
        pick(r, 'company_code_given_by_party', 'companyCodeGivenByParty') ?? '',
      ),
      od_account_no: String(pick(r, 'od_account_no', 'odAccountNo') ?? ''),
      default_payment_terms_days: pick(
        r,
        'default_payment_terms_days',
        'defaultPaymentTermsDays',
      ) as number | string | undefined,
      party: {
        id: String(pick(r, 'party_id', 'partyId') ?? ''),
        entity_name: String(pick(r, 'entity_name', 'entityName') ?? ''),
      },
      sanctioned_limit: pick(
        r,
        'sanctioned_limit',
        'sanctionedLimit',
      ) as number | string | undefined,
      utilized_amount: pick(
        r,
        'utilized_amount',
        'utilizedAmount',
      ) as number | string | undefined,
      pipeline_requests: pipelineRaw as number | string | undefined,
      eligibility: pick(r, 'eligibility') as number | string | undefined,
      interest_parameters: pick(
        r,
        'interestParameters',
        'interest_parameters',
        'interestparameters',
      ),
    };
  });

  const party_bank_details = Array.from(bankMap.values());
  const interestChargeTypeRaw = pick(
    first,
    'interest_charge_type',
    'interestChargeType',
    'product_config.interest_charge_type',
  );

  return {
    id: programId,
    program_name: String(pick(first, 'program_name', 'programName') ?? ''),
    basic_parameters,
    interest_charge_type:
      interestChargeTypeRaw != null && String(interestChargeTypeRaw).trim() !== ''
        ? String(interestChargeTypeRaw)
        : null,
    party: {
      id: String(pick(first, 'anchorPartyId', 'anchorpartyid') ?? ''),
      party_bank_details,
    },
    bank_details: party_bank_details,
    participants,
  };
}
