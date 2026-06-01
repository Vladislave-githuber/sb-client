import { useEffect } from "react";
import { useStore } from "../store/useStore";
import { getCurrentShift } from "../api/shifts";

export const useShift = () => {
  const { currentShift, setCurrentShift } = useStore();

  const loadShift = async () => {
    try {
      const shift = await getCurrentShift();
      setCurrentShift(shift);
    } catch (err) {
      console.error("Ошибка загрузки смены", err);
      setCurrentShift(null);
    }
  };

  useEffect(() => {
    loadShift();
    // Автообновление каждые 10 секунд (опционально)
    const interval = setInterval(loadShift, 10000);
    return () => clearInterval(interval);
  }, []);

  return { currentShift, reloadShift: loadShift };
};
