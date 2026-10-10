import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import axios from "axios";
import {
  SESSION_EXPIRED_MESSAGE,
  getToken,
  isTokenExpired,
  logout,
} from "./auth.js";

// axios.defaults.baseURL = "http://localhost:5000/api";
axios.defaults.baseURL = "https://jenyfer-paints-bill.onrender.com/api";

const isAuthRoute = (url = "") =>
  url.includes("/login") || url.includes("/register");

axios.interceptors.request.use((config) => {
  if (isAuthRoute(config.url)) return config;

  const token = getToken();
  if (!token || isTokenExpired(token)) {
    logout(token ? SESSION_EXPIRED_MESSAGE : undefined);
    return Promise.reject(new Error("Session expired"));
  }

  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status ?? error.status;
    const url = error.config?.url || "";
    if (!isAuthRoute(url) && (status === 401 || status === 403)) {
      logout(SESSION_EXPIRED_MESSAGE);
    }
    return Promise.reject(error);
  },
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
