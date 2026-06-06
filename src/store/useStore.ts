import { create } from "zustand";
import type { IUser, ICashBalance } from "../types";
import { getCashBalances } from "../api/cashbox";

export interface ShiftInfo {
  id: string;
  cashierId: string;
  startTime: string;
  endTime: string | null;
  status: "OPEN" | "CLOSED" | "BLOCKED";
  startingBalanceBYN: number;
}

interface AppState {
  currentCashier: IUser | null;
  cashBalances: ICashBalance[];
  currentShift: ShiftInfo | null;
  loadingBalances: boolean;
  errorBalances: string | null;
  setCurrentCashier: (user: IUser | null) => void;
  clearCurrentCashier: () => void; // ← новый метод
  setCurrentShift: (shift: ShiftInfo | null) => void;
  updateCashBalance: (currencyCode: string, amount: number) => void;
  fetchCashBalances: () => Promise<void>;
  logout: () => void;
}

export const useStore = create<AppState>((set, _get) => ({
  currentCashier: null,
  cashBalances: [],
  currentShift: null,
  loadingBalances: false,
  errorBalances: null,
  setCurrentCashier: (user) => set({ currentCashier: user }),
  clearCurrentCashier: () => set({ currentCashier: null }), // ← реализация
  setCurrentShift: (shift) => set({ currentShift: shift }),
  updateCashBalance: (currencyCode, amount) =>
    set((state) => ({
      cashBalances: state.cashBalances.map((bal) =>
        bal.currencyCode === currencyCode ? { ...bal, amount } : bal
      ),
    })),
  fetchCashBalances: async () => {
    set({ loadingBalances: true, errorBalances: null });
    try {
      const balances = await getCashBalances();
      set({ cashBalances: balances, loadingBalances: false });
    } catch (error) {
      set({
        errorBalances: "Не удалось загрузить остатки кассы",
        loadingBalances: false,
      });
    }
  },
  logout: () => {
    localStorage.removeItem("token");
    set({ currentCashier: null, cashBalances: [], currentShift: null });
  },
}));
