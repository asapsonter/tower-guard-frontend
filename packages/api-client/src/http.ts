/**
 * Shared HTTP fetch wrapper used by all endpoint modules.
 *
 * Responsibilities:
 *   - Reads VITE_API_BASE_URL from the consuming app's env
 *   - Attaches the auth token from localStorage on every request
 *   - On 401, clears auth and redirects to /login
 *   - Centralizes JSON error handling so each endpoint stays declarative
 */

const API_BASE_URL =
  ((import.meta as unknown as { env: Record<string, string | undefined> }).env
    .VITE_API_BASE_URL as string | undefined) || "http://localhost:5050";

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };

  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem("auth_token");
      window.localStorage.removeItem("auth_user");
      window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    }
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API Error: ${res.status}`);
  }

  return res.json();
}
