// src/api/logs.ts
import api from "./axios";

export interface LogEntry {
  id: string;
  userId: string | null;
  userFullName: string;
  action: string;
  details: string;
  createdAt: string;
  amount?: number | null;
  currency?: string | null;
  shiftId?: string | null;
  result: "SUCCESS" | "ERROR" | "CANCEL";
  transactionId?: string | null;
}

export const getLogs = async (params?: {
  startDate?: string;
  endDate?: string;
  userId?: string;
  action?: string;
  result?: string;
  transactionId?: string;
  shiftId?: string;
}): Promise<LogEntry[]> => {
  const { data } = await api.get("/logs", { params });
  return data;
};
