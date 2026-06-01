import { useState, useCallback } from "react";
import { searchClients, createClient, updateClient } from "../api/clients";
import type { IClient } from "../types";
import toast from "react-hot-toast";

export const useClients = () => {
  const [clients, setClients] = useState<IClient[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const result = await searchClients(query || undefined);
      setClients(result);
    } catch (err) {
      console.error(err);
      // ошибка уже показывается в interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  const addClient = useCallback(
    async (clientData: Omit<IClient, "id" | "createdAt">) => {
      const newClient = await createClient(clientData);
      toast.success("Клиент добавлен");
      return newClient;
    },
    []
  );

  const editClient = useCallback(async (id: string, data: Partial<IClient>) => {
    const updated = await updateClient(id, data);
    toast.success("Данные клиента обновлены");
    return updated;
  }, []);

  return { clients, loading, search, addClient, editClient };
};
