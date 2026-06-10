import api from "./axios";

export interface CashAdjustment {
  id: string;
  shiftId: string;
  currency: string;
  amount: number;
  type: "SURPLUS" | "SHORTAGE";
  reason: string;
  createdBy: string;
  createdAt: string;
  creator?: { fullName: string };
}

// Получить список корректировок для текущей смены
export const getAdjustments = async (): Promise<CashAdjustment[]> => {
  const { data } = await api.get("/cash-ledger/adjustments");
  return data;
};

// Создать корректировку (излишек/недостача)
export const createAdjustment = async (payload: {
  currency: string;
  amount: number;
  type: "SURPLUS" | "SHORTAGE";
  reason: string;
}): Promise<CashAdjustment> => {
  const { data } = await api.post("/cash-ledger/adjustments", payload);
  return data;
};
