import { request } from "../http";

export const authEndpoints = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, fullName: string) =>
    request<{ access_token: string; user: any }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name: fullName }),
    }),

  logout: () =>
    request<{ status: string }>("/api/auth/logout", { method: "POST" }),
};
