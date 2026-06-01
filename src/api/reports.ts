import api from "./axios";
import type { ITransaction } from "../types";

export interface ReportSummary {
  totalOperations: number;
  totalTurnoverBYN: number;
  byType: { BUY: number; SELL: number; CONVERT: number };
  byCurrencyIn: Record<string, number>;
  byCurrencyOut: Record<string, number>;
}

export interface EnrichedTransaction extends ITransaction {
  cashierName: string;
}

export interface CashierReportData {
  cashierName: string;
  period: { from: string; to: string };
  transactions: EnrichedTransaction[];
  summary: ReportSummary;
}

export interface AdminReportData {
  period: { from: string; to: string };
  transactions: EnrichedTransaction[];
  summary: ReportSummary;
  byCashier: Array<{
    cashierName: string;
    totalOperations: number;
    totalTurnoverBYN: number;
  }>;
}

export const getCashierReport = async (
  startDate?: string,
  endDate?: string
): Promise<CashierReportData> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const { data } = await api.get("/reports/cashier", { params });
  return data;
};

export const getAdminReport = async (
  startDate?: string,
  endDate?: string,
  cashierId?: string
): Promise<AdminReportData> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (cashierId) params.cashierId = cashierId;
  const { data } = await api.get("/reports/admin", { params });
  return data;
};

export const exportPdf = async (params: {
  startDate?: string;
  endDate?: string;
  cashierId?: string;
}) => {
  const query = new URLSearchParams();
  if (params.startDate) query.append("startDate", params.startDate);
  if (params.endDate) query.append("endDate", params.endDate);
  if (params.cashierId) query.append("cashierId", params.cashierId);
  const url = `/reports/export/pdf?${query.toString()}`;
  const response = await api.get(url, { responseType: "blob" });
  const blob = new Blob([response.data], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "report.pdf";
  link.click();
  URL.revokeObjectURL(link.href);
};

export const exportExcel = async (params: {
  startDate?: string;
  endDate?: string;
  cashierId?: string;
}) => {
  const query = new URLSearchParams();
  if (params.startDate) query.append("startDate", params.startDate);
  if (params.endDate) query.append("endDate", params.endDate);
  if (params.cashierId) query.append("cashierId", params.cashierId);
  const url = `/reports/export/excel?${query.toString()}`;
  const response = await api.get(url, { responseType: "blob" });
  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "report.xlsx";
  link.click();
  URL.revokeObjectURL(link.href);
};

// Контрольная лента (только финансовые операции)
export const getControlTape = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  const { data } = await api.get(`/reports/control-tape?${params.toString()}`);
  return data; // массив ControlTapeItem
};

// Системный аудит (логины, экспорты, смена лимитов и т.д.)
export const getSystemAudit = async (
  startDate?: string,
  endDate?: string,
  action?: string
) => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (action) params.append("action", action);
  const { data } = await api.get(`/reports/system-audit?${params.toString()}`);
  return data; // массив SystemAuditLogItem
};
