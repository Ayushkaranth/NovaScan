import axios from "axios";
import { jwtDecode } from "jwt-decode";

// This points to your running Backend
const API_URL = "https://novascan-backend.onrender.com/api/v1";

const api = axios.create({
  baseURL: API_URL,
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

// Automatic Interceptor:
// Before sending any request, check if we have a Token saved in the browser.
// If yes, attach it to the header.
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