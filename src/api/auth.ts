import api from "./axios";
import type { IUser } from "../types";

export interface LoginResponse {
  user: IUser;
  accessToken: string;
}

export interface LoginCredentials {
  tabNumber: string;
  password: string;
}

// Выполняем логин, но без вызова /auth/me
export const loginByTabNumber = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  const { data } = await api.post("/auth/login", credentials);
  return data; // { user, accessToken }
};

export const getMe = async (): Promise<IUser> => {
  const { data } = await api.get("/auth/me");
  return data.user;
};

export const logout = async (): Promise<void> => {
  await api.post("/auth/logout");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
