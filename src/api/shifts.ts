import api from "./axios";

export interface ShiftInfo {
  id: string;
  cashierId: string;
  startTime: string;
  endTime: string | null;
  status: "OPEN" | "CLOSED" | "BLOCKED";
  startingBalanceBYN: number;
}

export const getCurrentShift = async (): Promise<ShiftInfo | null> => {
  try {
    const { data } = await api.get("/shifts/current");
    return data;
  } catch (err: any) {
    // 404 - смена не найдена, 403 - недостаточно прав (с нашими правками не должно быть 403, но на всякий случай)
    if (err.response?.status === 404 || err.response?.status === 403) {
      return null;
    }
    throw err;
  }
};

export const startShift = async (): Promise<ShiftInfo> => {
  const { data } = await api.post("/shifts/start");
  return data;
};

export const endShift = async (): Promise<void> => {
  await api.put("/shifts/end");
};
