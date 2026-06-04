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
 * Maps flat SQL rows from GET /invoice/dealer-info/:programId to nested DealerInfoResponse.
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
    const account = String(pick(r, 'account_number', 'accountNumber') ?? '');
    if (account) {
      bankMap.set(account, {id: account, account_number: account});
    }

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
