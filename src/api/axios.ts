import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: "http://localhost:3000",
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
    const message = error.response?.data?.message || "Ошибка сети";
    toast.error(message);
    return Promise.reject(error);
  }
);

export default api;
