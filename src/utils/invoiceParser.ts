import type {InvoiceFields} from '@type/Invoice';

const DATE_NUMERIC = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/;
const DATE_ISO = /\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/;
const DATE_MONTH_TEXT = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}\b/i;
const MONEY = /([0-9][0-9,]*\.?[0-9]*)/;
// Prefer exact heading: INVOICE : INVxxxx; fallback to any INVxxxx token
const INVOICE_NO_STRICT = /\bINVOICE\s*:\s*(INV[\w\-]+)\b/i;
const INVOICE_NO = /\bINV[\-]?[A-Z0-9]+\b/i;
const GST_REGEX = /\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z]\d\b/i;

function firstMatch(text: string, regs: RegExp[]): string | '' {
  for (const r of regs) {
    const m = text.match(r);
    if (m && m[1]) return m[1].trim();
  }
  return '';
}

export function parseInvoiceFields(text: string): Partial<InvoiceFields> {
  const cleaned = text.replace(/\t/g, ' ').replace(/[ ]{2,}/g, ' ');
  const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let invoiceNumber = '';
  const mStrict = cleaned.match(INVOICE_NO_STRICT);
  if (mStrict) invoiceNumber = mStrict[1];
  else {
    const m = cleaned.match(INVOICE_NO);
    if (m) invoiceNumber = m[0];
  }
  const invoiceDate = (cleaned.match(DATE_MONTH_TEXT)?.[0] || cleaned.match(DATE_NUMERIC)?.[1] || cleaned.match(DATE_ISO)?.[1] || '').trim();

  // Header amount (first number after AMOUNT heading)
  let amount = '';
  const amtHeaderIdx = lines.findIndex(l => /\bamount\b/i.test(l));
  if (amtHeaderIdx !== -1) {
    const candidate = lines.slice(amtHeaderIdx, amtHeaderIdx + 4).join(' ');
    amount = (candidate.match(MONEY)?.[1] || '').replace(/,/g, '');
  }

  // Specific labelled amounts
  const taxableAmount = (cleaned.match(/Taxable\s*Amount\s*:?\s*₹?\s*([0-9,]+\.?[0-9]*)/i)?.[1] || '').replace(/,/g, '');
  const finalAmount = (cleaned.match(/Final\s*Amount\s*:?\s*₹?\s*([0-9,]+\.?[0-9]*)/i)?.[1] || '').replace(/,/g, '');
  const paidAmount = (cleaned.match(/Paid\s*Amount\s*:?\s*₹?\s*([0-9,]+\.?[0-9]*)/i)?.[1] || '').replace(/,/g, '');
  const dueAmount = (cleaned.match(/Due\s*Amount\s*:?\s*₹?\s*([0-9,]+\.?[0-9]*)/i)?.[1] || '').replace(/,/g, '');

  // Member details
  const memberName = (cleaned.match(/\bName\s*:\s*(.+)/i)?.[1] || '').trim();
  const memberId = (cleaned.match(/\bMember\s*ID\s*:\s*([A-Za-z0-9\-]+)/i)?.[1] || '').trim();
  const phone = (cleaned.match(/\bPhone\s*:\s*([+]?\d[\d\s\-]{7,})/i)?.[1] || '').replace(/[^\d+]/g, '');
  const email = (cleaned.match(/\bEmail\s*:\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i)?.[1] || '').trim();

  // Program and dates (table-style: PROGRAM / START DATE / EXPIRY DATE)
  let program = '';
  let startDate = '';
  let expiryDate = '';
  // Try labelled matches first
  const startMatch = cleaned.match(/START\s*DATE[\s:\-]*([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4})/i);
  const expiryMatch = cleaned.match(/EXPIRY\s*DATE[\s:\-]*([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4})/i);
  if (startMatch) startDate = startMatch[1];
  if (expiryMatch) expiryDate = expiryMatch[1];
  const programIdx = lines.findIndex(l => /\bprogram\b/i.test(l));
  if (programIdx !== -1) {
    const window = lines.slice(programIdx, programIdx + 10).join(' ');
    if (!program) program = (window.match(/program\s*([A-Za-z0-9 ]{1,20})/i)?.[1] || '').trim();
    if (!startDate) startDate = (window.match(DATE_NUMERIC)?.[1] || '');
    if (!expiryDate) {
      const rest = window.replace(startDate, '');
      expiryDate = (rest.match(DATE_NUMERIC)?.[1] || '').trim();
    }
  }

  // Vendor heuristic: try to find a strong-caps line near top right; fallback to first non-empty line not starting with INVOICE
  let vendorName = '';
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const l = lines[i];
    if (/invoice/i.test(l)) continue;
    if (/^(name|address|email|phone)\b/i.test(l)) continue;
    if (/^[A-Z0-9 \-&]{6,}$/.test(l)) { vendorName = l; break; }
  }
  if (!vendorName && lines.length) vendorName = lines[0];

  const gstNumber = (cleaned.match(GST_REGEX)?.[0] || '').toUpperCase();

  return {
    vendorName,
    memberName,
    memberId,
    phone,
    email,
    invoiceNumber,
    invoiceDate,
    program,
    startDate,
    expiryDate,
    amount,
    taxableAmount,
    finalAmount,
    totalAmount: finalAmount || amount,
    paidAmount,
    dueAmount,
    gstNumber,
    // New fields (empty as regex parser doesn't extract these)
    items: [],
    dealer: '',
    dealerCode: '',
    odAccountNumber: '',
    associatedPO: '',
    invoiceDueDate: '',
    earlyPaymentDiscount: '',
    currency: '',
    remark: '',
    taxAmount: '',
    amountInWords: '',
  };
}


