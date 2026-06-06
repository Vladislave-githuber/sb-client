import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: "https://api-sberbank-af152.up.railway.app",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  // Исключаем публичные эндпоинты, куда не нужно передавать токен
  const isPublic =
    config.url?.includes("/auth/login") || config.url?.includes("/auth/logout");
  if (!isPublic) {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "Ошибка сети";

    // При 401 (Unauthorized) – токен истёк или невалиден
    if (status === 401) {
      const url = error.config?.url || "";
      // Не выполняем редирект для эндпоинтов логина и проверки токена,
      // чтобы избежать циклического редиректа
      if (!url.includes("/auth/login") && !url.includes("/auth/me")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.error("Сессия истекла. Войдите заново.");
        window.location.href = "/login";
      }
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
