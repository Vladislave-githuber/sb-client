import api from "./axios";
import type { IClient } from "../types";

export const searchClients = async (search?: string): Promise<IClient[]> => {
  const params = search ? { search } : {};
  const { data } = await api.get("/clients", { params });
  return data;
};

export const getClient = async (id: string): Promise<IClient> => {
  const { data } = await api.get(`/clients/${id}`);
  return data;
};

export const createClient = async (
  client: Omit<IClient, "id" | "createdAt">
): Promise<IClient> => {
  const { data } = await api.post("/clients", client);
  return data;
};

export const updateClient = async (
  id: string,
  client: Partial<IClient>
): Promise<IClient> => {
  const { data } = await api.put(`/clients/${id}`, client);
  return data;
};

export const deleteClient = async (id: string): Promise<void> => {
  await api.delete(`/clients/${id}`);
};
