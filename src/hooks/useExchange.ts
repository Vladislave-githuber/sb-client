// hooks/useExchange.ts
import { useCallback } from "react";
import type { ICurrency } from "../types";

interface CalculateParams {
  type: "BUY" | "SELL" | "CONVERT";
  fromCurrency: string;
  toCurrency: string;
  amount: number;
}

export const useExchange = (rates: ICurrency[]) => {
  const getRate = useCallback(
    (
      code: string,
      operation: "buy" | "sell"
    ): { rate: number; scale: number } => {
      const currency = rates.find((r) => r.code === code);
      if (!currency) throw new Error(`Валюта ${code} не найдена`);
      const rate = operation === "buy" ? currency.rateBuy : currency.rateSell;
      return { rate, scale: currency.scale };
    },
    [rates]
  );

  const calculate = useCallback(
    ({ type, fromCurrency, toCurrency, amount }: CalculateParams): number => {
      if (amount <= 0) throw new Error("Сумма должна быть больше 0");

      // Конверсия (одна инвалюта → другая инвалюта)
      if (type === "CONVERT") {
        if (fromCurrency === toCurrency) {
          throw new Error("Нельзя конвертировать одинаковые валюты");
        }
        // Продаём fromCurrency по курсу продажи банка (с учётом scale)
        const { rate: sellRate, scale: sellScale } = getRate(
          fromCurrency,
          "sell"
        );
        const { rate: buyRate, scale: buyScale } = getRate(toCurrency, "buy");
        // Сумма в BYN с учётом номинала: (amount / sellScale) * sellRate
        const amountInBYN = (amount / sellScale) * sellRate;
        // Получаем toCurrency: amountInBYN / (buyRate / buyScale) = amountInBYN * buyScale / buyRate
        return (amountInBYN * buyScale) / buyRate;
      }

      // Покупка: клиент отдаёт BYN, получает иностранную валюту
      if (type === "BUY") {
        if (fromCurrency !== "BYN") {
          throw new Error("При покупке отдаваемая валюта должна быть BYN");
        }
        const { rate: buyRate, scale: buyScale } = getRate(toCurrency, "buy");
        // amount BYN → количество валюты: (amount / buyRate) * buyScale
        return (amount / buyRate) * buyScale;
      }

      // Продажа: клиент отдаёт иностранную валюту, получает BYN
      if (type === "SELL") {
        if (toCurrency !== "BYN") {
          throw new Error("При продаже получаемая валюта должна быть BYN");
        }
        const { rate: sellRate, scale: sellScale } = getRate(
          fromCurrency,
          "sell"
        );
        // (amount / sellScale) * sellRate
        return (amount / sellScale) * sellRate;
      }

      throw new Error("Неверный тип операции");
    },
    [getRate]
  );

  return { calculate };
};
