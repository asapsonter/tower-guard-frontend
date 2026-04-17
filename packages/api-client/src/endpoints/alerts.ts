import { request } from "../http";

export const alertsEndpoints = {
  getAlerts: (params?: { site_id?: string; severity?: string; limit?: number }) =>
    request<any[]>(`/api/alerts?${new URLSearchParams(params as any)}`),

  getEvents: (params?: { site_id?: string; event_type?: string; limit?: number }) =>
    request<any[]>(`/api/events?${new URLSearchParams(params as any)}`),
};
