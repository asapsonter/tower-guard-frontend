import { request } from "../http";

export const incidentsEndpoints = {
  getIncidents: (limit = 50) => request<any[]>(`/api/incidents?limit=${limit}`),
};
