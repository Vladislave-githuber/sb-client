import api from "./axios";
import type { ICurrency } from "../types";

export const getRates = async (): Promise<ICurrency[]> => {
  const { data } = await api.get("/rates");
  return data;
};
