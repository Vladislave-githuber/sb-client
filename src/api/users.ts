import api from "./axios";
import type { IUser } from "../types";

export const getUsers = async (): Promise<IUser[]> => {
  const { data } = await api.get("/users");
  return data;
};
