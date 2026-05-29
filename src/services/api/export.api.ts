import ApiEndPoints from '@constants/ApiEndPoints';
import axios, {type AxiosError} from 'axios';
import axiosInstance, {type CustomRequestConfig} from './api';

export type GenericExcelExportColumn = {
  header: string;
  key: string;
};

export type GenericExcelHeaderData = {
  companyName?: string;
  reportName?: string;
  program?: string;
  fromDate?: string;
  toDate?: string;
  lender?: string;
  branch?: string;
  reportPeriod?: string;
  asOnDate?: string;
  generatedOn?: string;
  generatedBy?: string;
};

export type GenericExcelExportPayload = {
  data: Record<string, unknown>[];
  columns: GenericExcelExportColumn[];
  filename?: string;
  headerFlag?: boolean;
  headerData?: GenericExcelHeaderData | null;
};

const EXPORT_TIMEOUT_MS = 120000;

function parseExportErrorMessage(data: unknown): string {
  if (!data) {
    return 'Export failed';
  }
  if (typeof data === 'object' && data !== null && 'message' in data) {
    return String((data as {message?: string}).message || 'Export failed');
  }
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data) as {message?: string};
      return parsed.message || data;
    } catch {
      return data;
    }
  }
  return 'Export failed';
}

export async function postGenericExcelExport(
  payload: GenericExcelExportPayload,
): Promise<ArrayBuffer> {
  try {
    const response = await axiosInstance.post(
      ApiEndPoints.apiGenericExcelExport,
      payload,
      {
        authRequired: true,
        skipResponseTransform: true,
        responseType: 'arraybuffer',
        timeout: EXPORT_TIMEOUT_MS,
        headers: {
          Accept:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json',
        },
      } as CustomRequestConfig,
    );

    const contentType = String(
      response.headers?.['content-type'] ||
        response.headers?.['Content-Type'] ||
        '',
    );

    if (contentType.includes('application/json')) {
      const text = new TextDecoder().decode(response.data as ArrayBuffer);
      throw new Error(parseExportErrorMessage(text));
    }

    return response.data as ArrayBuffer;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axErr = error as AxiosError<ArrayBuffer>;
      const data = axErr.response?.data;
      if (data instanceof ArrayBuffer) {
        const text = new TextDecoder().decode(data);
        throw new Error(parseExportErrorMessage(text));
      }
      const msg = (axErr.response?.data as {message?: string})?.message;
      if (msg) {
        throw new Error(msg);
      }
    }
    throw error instanceof Error ? error : new Error('Export failed');
  }
}
