// src/services/base.ts
import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://iot-central.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔹 Interceptor: añade automáticamente el token a cada petición
api.interceptors.request.use((config) => {
  try {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  } catch (err) {
    console.warn("No se pudo obtener el token:", err);
  }
  return config;
});

export default api;
