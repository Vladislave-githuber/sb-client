import api from "./axios";
import type { ICashBalance } from "../types";

export const getCashBalances = async (): Promise<ICashBalance[]> => {
  const { data } = await api.get("/cashbox/balances");
  return data;
};

export const updateCashLimit = async (
  currencyCode: string,
  newLimit: number
): Promise<void> => {
  await api.put(`/cashbox/limits/${currencyCode}`, { limit: newLimit });
};
