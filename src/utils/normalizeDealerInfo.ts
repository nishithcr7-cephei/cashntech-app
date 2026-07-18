import type {
  DealerInfoParticipant,
  DealerInfoResponse,
  PartyBankDetail,
} from '@store/invoice/inv.types';

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
 * Parse VF/CWF `bankAccounts` JSON aggregate (array or JSON string) into
 * PartyBankDetail[]. Prefers real UUID `id` when present (needed for
 * credit_to_account_id on create). Falls back to account number as id for DF.
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

function collectBankDetails(
  row: Record<string, unknown>,
  bankMap: Map<string, PartyBankDetail>,
): void {
  const fromAgg = parseBankAccounts(
    pick(row, 'bankAccounts', 'bank_accounts'),
  );
  if (fromAgg.length > 0) {
    for (const b of fromAgg) {
      // Prefer UUID id when the same account appears with only account-number id
      const existing = bankMap.get(b.account_number);
      if (!existing || (existing.id === existing.account_number && b.id !== b.account_number)) {
        bankMap.set(b.account_number, b);
      }
    }
    return;
  }

  // Main DF flat rows: one account_number column per row
  const account = String(pick(row, 'account_number', 'accountNumber') ?? '').trim();
  if (account) {
    if (!bankMap.has(account)) {
      bankMap.set(account, {id: account, account_number: account});
    }
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
 * Maps flat SQL rows from dealer-info / anchor-info / party-info to nested
 * DealerInfoResponse. Accepts VF/CWF `bankAccounts` aggregates with UUID ids.
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
    };
  });

  const party_bank_details = Array.from(bankMap.values());

  return {
    id: programId,
    program_name: String(pick(first, 'program_name', 'programName') ?? ''),
    basic_parameters,
    party: {
      id: String(pick(first, 'anchorPartyId', 'anchorpartyid') ?? ''),
      party_bank_details,
    },
    bank_details: party_bank_details,
    participants,
  };
}
