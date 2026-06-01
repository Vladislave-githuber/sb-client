import api from "./axios";
import type { ITransaction, IExchangePayload } from "../types";

export const createTransaction = async (
  payload: IExchangePayload
): Promise<ITransaction> => {
  const { data } = await api.post("/exchange", payload);
  return data;
};

export const getTransactions = async (): Promise<ITransaction[]> => {
  const { data } = await api.get("/exchange");
  return data;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await api.delete(`/exchange/${id}`);
};

export const stornoTransaction = async (
  id: string,
  reason: string
): Promise<any> => {
  const { data } = await api.post(`/exchange/${id}/storno`, { reason });
  return data;
};

export const refundTransaction = async (
  id: string,
  reason: string
): Promise<any> => {
  const { data } = await api.post(`/exchange/${id}/refund`, { reason });
  return data;
};
