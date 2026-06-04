import {FILE_DOWNLOAD_URL} from '@config/config';

export type InvoiceAttachmentItem = {
  id: number;
  attachment_url: string;
  fullUrl: string;
};

const DEFAULT_CDN_BASE = 'https://d2wayd1he5a7q1.cloudfront.net';

function isAttachmentRow(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return (
    row.attachment_url != null ||
    row.attachmentUrl != null ||
    row.url != null ||
    row.id != null
  );
}

function normalizeAttachmentRows(source: unknown): unknown[] {
  if (!source) return [];

  if (Array.isArray(source)) {
    return source;
  }

  if (typeof source === 'string') {
    return [source];
  }

  if (typeof source === 'object') {
    const obj = source as Record<string, unknown>;
    if (isAttachmentRow(obj)) {
      return [obj];
    }
    if (Array.isArray(obj.items)) {
      return obj.items;
    }
    if (Array.isArray(obj.data)) {
      return obj.data;
    }
    return Object.values(obj).filter(
      v => typeof v === 'string' || isAttachmentRow(v),
    );
  }

  return [];
}

/** Collect attachment rows from invoice details / list payloads. */
export function extractInvoiceAttachments(
  raw: unknown,
): Array<{id: number; attachment_url: string}> {
  const source =
    (raw as any)?.attachment ??
    (raw as any)?.attachments ??
    (raw as any)?.data?.attachment ??
    (raw as any)?.data?.attachments;

  const rows = normalizeAttachmentRows(source);

  return rows
    .map((row, index) => {
      if (typeof row === 'string') {
        const url = row.trim();
        return url ? {id: index, attachment_url: url} : null;
      }
      if (!row || typeof row !== 'object') return null;
      const r = row as Record<string, unknown>;
      const url = String(
        r.attachment_url ?? r.attachmentUrl ?? r.url ?? '',
      ).trim();
      if (!url) return null;
      const idRaw = r.id ?? r.attachmentId ?? index;
      const id = Number(idRaw);
      return {
        id: Number.isFinite(id) ? id : index,
        attachment_url: url,
      };
    })
    .filter((row): row is {id: number; attachment_url: string} => row != null);
}

export function buildInvoiceAttachmentUrl(relativePath: string): string {
  const path = (relativePath || '').trim();
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;

  const base =
    (FILE_DOWNLOAD_URL || '').trim().replace(/\/$/, '') ||
    DEFAULT_CDN_BASE.replace(/\/$/, '');

  return `${base}/${path.replace(/^\//, '')}`;
}

export function mapInvoiceAttachmentsWithUrls(
  raw: unknown,
): InvoiceAttachmentItem[] {
  return extractInvoiceAttachments(raw).map(row => ({
    ...row,
    fullUrl: buildInvoiceAttachmentUrl(row.attachment_url),
  }));
}

export function fileNameFromAttachmentUrl(url: string): string {
  const u = (url || '').trim();
  if (!u) return 'Attachment';
  const parts = u.split('/');
  return parts[parts.length - 1] || 'Attachment';
}
