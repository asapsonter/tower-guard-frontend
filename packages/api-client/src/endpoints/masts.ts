import { request } from "../http";

export const mastsEndpoints = {
  getMasts: (params?: { state?: string; lga?: string; zone?: string }) =>
    request<any[]>(`/api/masts?${new URLSearchParams(params as any)}`),

  getMastById: (id: string) => request<any>(`/api/masts/${id}`),

  getMastTelemetry: (id: string) => request<any>(`/api/masts/${id}/telemetry`),

  getSiteEnergy: (siteId: string) => request<any>(`/api/sites/${siteId}/energy`),

  getEnergyHistory: (siteId: string, range: "day" | "month" | "year") =>
    request<any[]>(`/api/sites/${siteId}/energy/history?range=${range}`),

  getSensors: (siteId: string) => request<any[]>(`/api/sites/${siteId}/sensors`),
};
