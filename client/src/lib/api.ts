import { queryClient } from "./queryClient";

const SESSION_TOKEN_KEY = "wespr_session_token";

export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function setSessionToken(token: string | null) {
  if (token) {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  }
}

export async function apiRequest(url: string, options?: RequestInit) {
  const token = getSessionToken();
  const extraHeaders: Record<string, string> = {};
  if (token) extraHeaders["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...extraHeaders },
    ...options,
    ...(options?.headers
      ? { headers: { "Content-Type": "application/json", ...extraHeaders, ...(options.headers as Record<string, string>) } }
      : {}),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export function formatTime(dateStr: string | null) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 1) {
    return "Gisteren";
  } else if (diffDays < 7) {
    return date.toLocaleDateString("nl-NL", { weekday: "long" });
  } else {
    return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  }
}

export function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "zojuist";
  if (diffMins < 60) return `${diffMins} min geleden`;
  if (diffHours < 24) return `${diffHours} uur geleden`;
  if (diffDays < 7) return `${diffDays} dagen geleden`;
  return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}