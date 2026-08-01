import {Linking, Platform} from 'react-native';
import RNFS from 'react-native-fs';
import {FILE_DOWNLOAD_URL} from '@config/config';

export type InvoiceAttachmentItem = {
  id: number;
  attachment_url: string;
  fullUrl: string;
};

const DEFAULT_CDN_BASE = 'https://d2wayd1he5a7q1.cloudfront.net';

function getCdnBase(): string {
  return (
    (FILE_DOWNLOAD_URL || '').trim().replace(/\/$/, '') ||
    DEFAULT_CDN_BASE.replace(/\/$/, '')
  );
}

function isAttachmentRow(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return (
    row.attachment_url != null ||
    row.attachmentUrl != null ||
    row.url != null ||
    row.fullUrl != null ||
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
      // Prefer storage key / relative path over already-built fullUrl.
      const url = String(
        r.attachment_url ?? r.attachmentUrl ?? r.url ?? r.fullUrl ?? '',
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

/**
 * Extract object key from absolute S3 / CDN URLs so we can rebuild a CDN URL.
 */
function extractStorageKey(absoluteUrl: string): string | null {
  try {
    const u = new URL(absoluteUrl);
    let key = decodeURIComponent(u.pathname.replace(/^\//, ''));
    if (!key) return null;

    const host = u.hostname.toLowerCase();
    const isS3 =
      host.includes('amazonaws.com') ||
      host.startsWith('s3.') ||
      host.includes('.s3.') ||
      host.includes('.s3-');

    if (isS3) {
      // Path-style: s3.region.amazonaws.com/bucket/key → strip bucket
      if (
        host.startsWith('s3.') ||
        host === 's3.amazonaws.com' ||
        /^s3[-.]/.test(host)
      ) {
        const parts = key.split('/');
        if (parts.length > 1) {
          key = parts.slice(1).join('/');
        }
      }
      // Virtual-hosted: bucket.s3.region.amazonaws.com/key — pathname is key
      return key || null;
    }

    // CDN / other host — pathname is the key
    const cdnHost = getCdnBase()
      .replace(/^https?:\/\//i, '')
      .split('/')[0]
      .toLowerCase();
    if (host === cdnHost || host.endsWith('.cloudfront.net')) {
      return key || null;
    }

    return null;
  } catch {
    return null;
  }
}

function encodeStorageKey(key: string): string {
  return key
    .split('/')
    .filter(Boolean)
    .map(segment => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join('/');
}

/**
 * Build a publicly reachable CDN URL for an invoice attachment.
 * Accepts relative S3 keys or absolute S3/CDN URLs.
 */
export function buildInvoiceAttachmentUrl(relativePath: string): string {
  const path = (relativePath || '').trim();
  if (!path) return '';

  const base = getCdnBase();

  if (/^https?:\/\//i.test(path)) {
    const key = extractStorageKey(path);
    if (key) {
      return `${base}/${encodeStorageKey(key)}`;
    }
    // Unknown absolute URL — return as-is
    return path;
  }

  // Strip accidental host prefix without scheme
  const cdnHost = base.replace(/^https?:\/\//i, '');
  let key = path
    .replace(/^\/+/, '')
    .replace(new RegExp(`^${cdnHost.replace(/\./g, '\\.')}/?`, 'i'), '')
    .replace(/^d2wayd1he5a7q1\.cloudfront\.net\/?/i, '');

  key = key.replace(/^\/+/, '');
  if (!key) return '';

  return `${base}/${encodeStorageKey(key)}`;
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
  try {
    if (/^https?:\/\//i.test(u)) {
      const pathname = new URL(u).pathname;
      const parts = pathname.split('/').filter(Boolean);
      return decodeURIComponent(parts[parts.length - 1] || 'Attachment');
    }
  } catch {
    // fall through
  }
  const parts = u.split('/');
  return parts[parts.length - 1] || 'Attachment';
}

function safeEncodeUrl(url: string): string {
  try {
    return encodeURI(decodeURI(url));
  } catch {
    try {
      return encodeURI(url);
    } catch {
      return url;
    }
  }
}

/** Resolve a viewable CDN URL for an attachment path / absolute URL. */
export function resolveInvoiceAttachmentUrl(urlOrPath: string): string {
  const built = buildInvoiceAttachmentUrl(urlOrPath) || (urlOrPath || '').trim();
  if (!built) return '';
  return safeEncodeUrl(built);
}

export function isImageAttachmentUrl(urlOrPath: string): boolean {
  const name = fileNameFromAttachmentUrl(urlOrPath).toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(name);
}

export function isPdfAttachmentUrl(urlOrPath: string): boolean {
  return fileNameFromAttachmentUrl(urlOrPath).toLowerCase().endsWith('.pdf');
}

/**
 * Open an invoice attachment. Downloads to cache then opens locally when possible;
 * falls back to opening the CDN URL in the browser.
 */
export async function openInvoiceAttachment(
  urlOrPath: string,
): Promise<void> {
  const remoteUrl = resolveInvoiceAttachmentUrl(urlOrPath);
  if (!remoteUrl) {
    throw new Error('Invalid attachment URL');
  }

  const fileName = fileNameFromAttachmentUrl(remoteUrl).replace(
    /[^\w.\-()+ ]+/g,
    '_',
  );
  const localPath = `${RNFS.CachesDirectoryPath}/inv_att_${Date.now()}_${fileName}`;

  try {
    const result = await RNFS.downloadFile({
      fromUrl: remoteUrl,
      toFile: localPath,
    }).promise;

    const status = result.statusCode ?? 0;
    if (status >= 200 && status < 300) {
      const localUri =
        Platform.OS === 'android' ? `file://${localPath}` : localPath;
      try {
        await Linking.openURL(localUri);
        return;
      } catch {
        // Local open failed — try remote below.
      }
    } else if (status === 403) {
      throw new Error(
        'Access Denied — this attachment could not be downloaded from storage.',
      );
    }
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.toLowerCase().includes('access denied')
    ) {
      throw err;
    }
    // Network/download failure — try opening remote URL directly.
  }

  await Linking.openURL(remoteUrl);
}
