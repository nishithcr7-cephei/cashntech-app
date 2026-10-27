import moment from 'moment';
import {decryptValue} from '@utils/decrypt';
import {
  fileNameFromAttachmentUrl,
  mapInvoiceAttachmentsWithUrls,
} from '@utils/invoiceAttachments';

const DATE_FORMATS = ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] as const;

export type NoaAttachmentRow = {
  id: string;
  fileName: string;
  url: string;
};

/** Recorded consent after Notice of Assignment was served (view mode). */
export type NoaServedConsent = {
  noticeDateDisplay: string;
  consentedAtDisplay: string;
  signatoryEmail: string;
  remark: string;
  consentText: string;
};

/** One run of notice preview text; bold matches web Notice Preview emphasis. */
export type NoaNoticeSegment = {
  text: string;
  bold?: boolean;
};

export type NoaPreviewModel = {
  invoiceRef: string;
  assignorName: string;
  assigneeBankName: string;
  programName: string;
  debtorName: string;
  debtorCode: string;
  invoiceDateDisplay: string;
  /** Moment-parseable invoice date for notice_date min bound */
  invoiceDateRaw: string;
  poRef: string;
  dueDateDisplay: string;
  tenorLabel: string;
  assignedAmountDisplay: string;
  assignedAmountRaw: string;
  escrowAccount: string;
  paymentBank: string;
  consentText: string;
  /** Plain notice letter (web parity) — useful for length / search. */
  noticeBody: string;
  /** Same letter as styled runs for bold fields in the modal. */
  noticeSegments: NoaNoticeSegment[];
  attachments: NoaAttachmentRow[];
  /** Present when a consent row already exists — modal opens read-only. */
  servedConsent: NoaServedConsent | null;
};

function dash(value?: string | number | null): string {
  if (value == null) return '-';
  const s = String(value).trim();
  return s ? s : '-';
}

function decryptField(value?: string | null): string {
  if (value == null || String(value).trim() === '') return '';
  const raw = String(value);
  return decryptValue(raw) || raw;
}

function formatAmount(value?: string | number | null): string {
  if (value == null || value === '') return '-';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateDDMMYYYY(value?: string | null): string {
  if (!value) return '-';
  const m = moment(String(value).trim(), DATE_FORMATS, true);
  if (m.isValid()) return m.format('DD-MM-YYYY');
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return moment(d).format('DD-MM-YYYY');
  } catch {
    return String(value);
  }
}

/** Locked Phase 0 consent template — must match checkbox label sent as consent_text. */
export function buildNoaConsentText(assigneeBankName: string): string {
  const bank = assigneeBankName.trim() || 'the bank';
  return `I confirm the above receivable is assigned to ${bank} and the debtor is being instructed to pay into the escrow account.`;
}

function formatDateTimeDisplay(value?: string | null): string {
  if (!value) return '-';
  const m = moment(value);
  if (!m.isValid()) return formatDateDDMMYYYY(value);
  return m.format('DD-MM-YYYY HH:mm');
}

/**
 * Normalize consent from details.assignment_consent or
 * GET /invoice/assignment-consent data payload.
 */
export function extractAssignmentConsent(source: any): NoaServedConsent | null {
  if (!source || typeof source !== 'object') return null;

  const payload =
    source.assignment_consent != null
      ? source
      : source.data != null && typeof source.data === 'object'
        ? source.data
        : source;

  if (payload.has_assignment_consent === false) {
    return null;
  }

  const raw = payload.assignment_consent;
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const consentText = String(raw.consent_text || '').trim();
  if (!consentText && !raw.notice_date && !raw.consented_at) {
    return null;
  }

  return {
    noticeDateDisplay: formatDateDDMMYYYY(
      raw.notice_date != null ? String(raw.notice_date) : null,
    ),
    consentedAtDisplay: formatDateTimeDisplay(
      raw.consented_at != null ? String(raw.consented_at) : null,
    ),
    signatoryEmail: dash(raw.signatory_email),
    remark: dash(raw.remark && raw.remark !== '-' ? raw.remark : ''),
    consentText: consentText || '-',
  };
}

type NoaNoticeInput = {
  debtorName: string;
  invoiceRef: string;
  invoiceDateDisplay: string;
  assignorName: string;
  assignedAmountDisplay: string;
  assigneeBankName: string;
  dueDateDisplay: string;
  escrowAccount: string;
};

/**
 * Web-parity Notice Preview (full letter + bold variable fields).
 * Matches LMS web Notice Preview wording and emphasis.
 */
export function buildNoaNoticeSegments(input: NoaNoticeInput): NoaNoticeSegment[] {
  const debtor = dash(input.debtorName);
  const invoiceRef = dash(input.invoiceRef);
  const invoiceDate = dash(input.invoiceDateDisplay);
  const assignor = dash(input.assignorName);
  const amount = dash(input.assignedAmountDisplay);
  const assignee = dash(input.assigneeBankName);
  const dueDate = dash(input.dueDateDisplay);
  const escrow = dash(input.escrowAccount);

  return [
    {text: 'To, '},
    {text: debtor, bold: true},
    {text: '\n\n'},
    {text: 'Subject: Notice of assignment of receivable under Invoice No. '},
    {text: invoiceRef, bold: true},
    {text: ' dated '},
    {text: invoiceDate, bold: true},
    {text: '\n\n'},
    {text: 'We, '},
    {text: assignor, bold: true},
    {
      text: ' (the "Assignor"), hereby give you notice that we have assigned and transferred to ',
    },
    {text: assignee, bold: true},
    {
      text: ' (the "Assignee") all our rights, title and interest in the amount of ',
    },
    {text: amount, bold: true},
    {
      text: ' due from you under the invoice referred to above, payable on ',
    },
    {text: dueDate, bold: true},
    {text: '.\n\n'},
    {
      text: 'You are required to pay the full amount only into escrow account no. ',
    },
    {text: escrow, bold: true},
    {
      text: ' on or before the due date, without any set-off, deduction or counterclaim. Payment made to the Assignor or to any other account will not discharge your liability. Please acknowledge receipt of this notice.',
    },
  ];
}

export function buildNoaNoticeBody(input: NoaNoticeInput): string {
  return buildNoaNoticeSegments(input)
    .map(seg => seg.text)
    .join('');
}

/** Truncate styled segments for collapsed preview while keeping bold runs. */
export function truncateNoaNoticeSegments(
  segments: NoaNoticeSegment[],
  maxLen: number,
): NoaNoticeSegment[] {
  let used = 0;
  const out: NoaNoticeSegment[] = [];
  for (const seg of segments) {
    if (used >= maxLen) break;
    const remaining = maxLen - used;
    if (seg.text.length <= remaining) {
      out.push(seg);
      used += seg.text.length;
      continue;
    }
    const cut = seg.text.slice(0, remaining).replace(/\s+$/, '');
    out.push({text: `${cut}…`, bold: seg.bold});
    break;
  }
  return out;
}

/**
 * Map GET /invoice/details (mobile api wrapper) → NOA modal model.
 * Assignor: prefer program.party.entity_name; interim party.entity_name (Phase 0 gap).
 * @param consentSource optional GET assignment-consent body (or details with assignment_consent)
 */
export function mapNoaPreviewFromDetails(
  details: any,
  consentSource?: any,
): NoaPreviewModel {
  const program = details?.program ?? {};
  const pvd = details?.programVendorDetails ?? {};
  const partnerBank = details?.partnerBank ?? {};
  const bankDetails = program?.bank_details;
  const bankDetailsOne = Array.isArray(bankDetails)
    ? bankDetails[0]
    : bankDetails;

  const assignorName =
    decryptField(program?.party?.entity_name) ||
    decryptField(details?.party?.entity_name) ||
    '';

  const assigneeBankName =
    String(partnerBank?.bank_name || '').trim() ||
    String(bankDetailsOne?.bank_name || '').trim() ||
    '';

  const debtorName =
    decryptField(pvd?.vendor_name) ||
    decryptField(details?.counter_party_name) ||
    '';

  const debtorCode = String(
    pvd?.vendor_code || details?.counter_party_code || '',
  ).trim();

  const programName = String(program?.program_name || '').trim();
  const invoiceRef = String(
    details?.invoice_ref_no || details?.invoiceNumber || '',
  ).trim();

  const invoiceDateRaw = String(
    details?.invoice_date || details?.invoiceDate || '',
  ).trim();
  const dueRaw = String(
    details?.invoice_due_date || details?.invoiceDueDate || '',
  ).trim();

  const tenorNum = details?.tenor;
  const tenorLabel =
    tenorNum == null || tenorNum === ''
      ? '-'
      : `${tenorNum} day${Number(tenorNum) === 1 ? '' : 's'}`;

  const assignedRaw = details?.final_total ?? details?.grandTotal ?? '';
  const assignedAmountDisplay = formatAmount(assignedRaw);

  const loanAccount = decryptField(
    program?.basic_parameters?.loan_account_no ??
      details?.counter_party_od_account ??
      '',
  );

  const paymentBank = assigneeBankName || dash(bankDetailsOne?.bank_name);

  const invoiceDateDisplay = formatDateDDMMYYYY(invoiceDateRaw);
  const dueDateDisplay = formatDateDDMMYYYY(dueRaw);

  const servedConsent =
    extractAssignmentConsent(consentSource) ||
    extractAssignmentConsent(details);

  const consentText =
    servedConsent?.consentText && servedConsent.consentText !== '-'
      ? servedConsent.consentText
      : buildNoaConsentText(assigneeBankName || paymentBank);
  const noticeInput = {
    debtorName: debtorName || '-',
    invoiceRef: invoiceRef || '-',
    invoiceDateDisplay,
    assignorName: assignorName || '-',
    assignedAmountDisplay,
    assigneeBankName: assigneeBankName || paymentBank || '-',
    dueDateDisplay,
    escrowAccount: loanAccount || '-',
  };
  const noticeSegments = buildNoaNoticeSegments(noticeInput);
  const noticeBody = buildNoaNoticeBody(noticeInput);

  const attachmentSource =
    Array.isArray(details?.attachment) && details.attachment.length > 0
      ? details
      : details;
  const mapped = mapInvoiceAttachmentsWithUrls(attachmentSource);
  const attachments: NoaAttachmentRow[] = mapped.map((att, idx) => {
    const url = String(att.fullUrl || att.attachment_url || '');
    return {
      id: String(att.id ?? `att-${idx}`),
      fileName: fileNameFromAttachmentUrl(url) || 'Invoice',
      url,
    };
  });

  return {
    invoiceRef: dash(invoiceRef),
    assignorName: dash(assignorName),
    assigneeBankName: dash(assigneeBankName || paymentBank),
    programName: dash(programName),
    debtorName: dash(debtorName),
    debtorCode: dash(debtorCode),
    invoiceDateDisplay,
    invoiceDateRaw,
    poRef: dash(details?.po_ref_no),
    dueDateDisplay,
    tenorLabel,
    assignedAmountDisplay,
    assignedAmountRaw: String(assignedRaw ?? ''),
    escrowAccount: dash(loanAccount),
    paymentBank: dash(paymentBank),
    consentText,
    noticeBody,
    noticeSegments,
    attachments,
    servedConsent,
  };
}
