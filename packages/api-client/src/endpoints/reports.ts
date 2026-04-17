import { request } from "../http";

export const reportsEndpoints = {
  getReports: (params?: { page?: number; search?: string }) =>
    request<any[]>(`/api/reports?${new URLSearchParams(params as any)}`),

  createReport: (data: { title: string; content: string }) =>
    request<any>("/api/reports", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
