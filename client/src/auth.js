const TOKEN_KEY = "token";
const AUTH_MESSAGE_KEY = "authMessage";
const MAX_TIMER_DELAY = 2147483647;
const SESSION_CHECK_MS = 15000;

export const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please log in again.";

let expiryTimer = null;
let loggingOut = false;
let watchersStarted = false;

function parseJwtPayload(token) {
  const part = token.split(".")[1];
  if (!part) throw new Error("Invalid token");
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  return JSON.parse(atob(padded));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  loggingOut = false;
  scheduleSessionExpiry();
}

export function isTokenExpired(token = getToken()) {
  if (!token) return true;
  try {
    const payload = parseJwtPayload(token);
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export function isAuthenticated() {
  return Boolean(getToken()) && !isTokenExpired();
}

export function isAuthFailure(error) {
  const status = error?.response?.status ?? error?.status;
  return (
    status === 401 ||
    status === 403 ||
    error?.message === "Session expired"
  );
}

function msUntilExpiry(token) {
  const payload = parseJwtPayload(token);
  if (!payload.exp) return null;
  return payload.exp * 1000 - Date.now();
}

export function scheduleSessionExpiry() {
  if (expiryTimer) {
    clearTimeout(expiryTimer);
    expiryTimer = null;
  }

  const token = getToken();
  if (!token) return;

  let remaining;
  try {
    remaining = msUntilExpiry(token);
  } catch {
    logout(SESSION_EXPIRED_MESSAGE);
    return;
  }

  if (remaining == null) return;
  if (remaining <= 0) {
    logout(SESSION_EXPIRED_MESSAGE);
    return;
  }

  expiryTimer = setTimeout(() => {
    expiryTimer = null;
    if (isTokenExpired()) logout(SESSION_EXPIRED_MESSAGE);
    else scheduleSessionExpiry();
  }, Math.min(remaining, MAX_TIMER_DELAY));
}

function checkSession() {
  const token = getToken();
  if (!token || loggingOut) return;
  if (isTokenExpired(token)) logout(SESSION_EXPIRED_MESSAGE);
}

function startSessionWatchers() {
  if (watchersStarted || typeof window === "undefined") return;
  watchersStarted = true;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkSession();
  });
  window.addEventListener("focus", checkSession);
  window.addEventListener("storage", (event) => {
    if (event.key !== TOKEN_KEY) return;
    if (!event.newValue) {
      if (!window.location.pathname.startsWith("/login")) {
        window.location.replace("/login");
      }
      return;
    }
    loggingOut = false;
    scheduleSessionExpiry();
  });
  window.setInterval(checkSession, SESSION_CHECK_MS);
}

export function consumeAuthMessage() {
  const message = sessionStorage.getItem(AUTH_MESSAGE_KEY);
  if (message) sessionStorage.removeItem(AUTH_MESSAGE_KEY);
  return message;
}

export function logout(message) {
  if (loggingOut) return;
  loggingOut = true;

  if (expiryTimer) {
    clearTimeout(expiryTimer);
    expiryTimer = null;
  }

  localStorage.removeItem(TOKEN_KEY);

  if (message) {
    sessionStorage.setItem(AUTH_MESSAGE_KEY, message);
  }

  const onLoginPage = window.location.pathname.startsWith("/login");
  if (!onLoginPage) {
    window.location.replace("/login");
  } else {
    loggingOut = false;
  }
}

scheduleSessionExpiry();
startSessionWatchers();
