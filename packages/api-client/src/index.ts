/**
 * @tower-guard/api-client — typed REST + WebSocket client.
 *
 * Exposes a single `api` object that aggregates all endpoint modules,
 * preserving the legacy import shape `api.getAlerts()`, `api.login()`, etc.
 * The endpoint modules are also exported individually for tree-shaking.
 */
import { authEndpoints } from "./endpoints/auth";
import { alertsEndpoints } from "./endpoints/alerts";
import { mastsEndpoints } from "./endpoints/masts";
import { incidentsEndpoints } from "./endpoints/incidents";
import { dispatchEndpoints } from "./endpoints/dispatch";
import { reportsEndpoints } from "./endpoints/reports";
import { alarmEndpoints } from "./endpoints/alarm";
import { connectWebSocket } from "./websocket";

export const api = {
  ...authEndpoints,
  ...alertsEndpoints,
  ...mastsEndpoints,
  ...incidentsEndpoints,
  ...dispatchEndpoints,
  ...reportsEndpoints,
  ...alarmEndpoints,
  connectWebSocket,
};

export default api;

// Individual modules for tree-shaking imports
export { authEndpoints } from "./endpoints/auth";
export { alertsEndpoints } from "./endpoints/alerts";
export { mastsEndpoints } from "./endpoints/masts";
export { incidentsEndpoints } from "./endpoints/incidents";
export { dispatchEndpoints } from "./endpoints/dispatch";
export { reportsEndpoints } from "./endpoints/reports";
export { alarmEndpoints } from "./endpoints/alarm";
export { connectWebSocket } from "./websocket";
export { request, getApiBaseUrl } from "./http";
