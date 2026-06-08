import { create } from "zustand";
import type { IUser, ICashBalance } from "../types";
import { getCashBalances } from "../api/cashbox";
import { getCurrentShift, type ShiftInfo } from "../api/shifts";

interface AppState {
  currentCashier: IUser | null;
  cashBalances: ICashBalance[];
  currentShift: ShiftInfo | null;
  loadingBalances: boolean;
  errorBalances: string | null;
  loadingShift: boolean;
  setCurrentCashier: (user: IUser | null) => void;
  clearCurrentCashier: () => void;
  setCurrentShift: (shift: ShiftInfo | null) => void;
  updateCashBalance: (currencyCode: string, amount: number) => void;
  fetchCashBalances: () => Promise<void>;
  fetchCurrentShift: () => Promise<void>;
  logout: () => void;
  init: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  currentCashier: null,
  cashBalances: [],
  currentShift: null,
  loadingBalances: false,
  errorBalances: null,
  loadingShift: false,

  setCurrentCashier: (user) => set({ currentCashier: user }),
  clearCurrentCashier: () => set({ currentCashier: null }),
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

  fetchCurrentShift: async () => {
    set({ loadingShift: true });
    try {
      const shift = await getCurrentShift();
      set({ currentShift: shift, loadingShift: false });
    } catch (error) {
      console.error("Ошибка загрузки смены", error);
      set({ currentShift: null, loadingShift: false });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ currentCashier: null, cashBalances: [], currentShift: null });
  },

  init: async () => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        set({ currentCashier: user });
        await get().fetchCurrentShift();
        await get().fetchCashBalances();
      } catch (e) {
        console.error("Ошибка инициализации", e);
      }
    }
  },
}));
