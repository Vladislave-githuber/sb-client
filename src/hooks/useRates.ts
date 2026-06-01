import { useState, useEffect } from "react";
import type { ICurrency } from "../types";
import { getRates } from "../api/rates";

export const useRates = () => {
  const [rates, setRates] = useState<ICurrency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const data = await getRates();
      const normalized = data.map((rate) => ({
        ...rate,
        rateBuy: Number(rate.rateBuy),
        rateSell: Number(rate.rateSell),
        scale: Number(rate.scale),
      }));
      setRates(normalized);
      setError(null);
    } catch (err) {
      setError("Не удалось загрузить курсы");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  return { rates, loading, error, refetch: fetchRates };
};
