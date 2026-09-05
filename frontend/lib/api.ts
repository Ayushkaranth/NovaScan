import axios from "axios";
import { jwtDecode } from "jwt-decode";

// Dynamic API Base URL for Dev vs Production
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getUserFromToken = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      return jwtDecode(token); // Returns { sub: email, role: 'hr', exp: ... }
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Automatic Interceptor: Attach bearer token to requests if present
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;