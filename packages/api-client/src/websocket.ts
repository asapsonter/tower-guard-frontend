/**
 * Shared WebSocket factory.
 * Reuses the API base URL but switches scheme to ws://.
 */
import { getApiBaseUrl } from "./http";

export function connectWebSocket(siteId?: string): WebSocket {
  const wsBase = getApiBaseUrl().replace(/^http/, "ws");
  const path = siteId ? `/ws/site/${siteId}` : "/ws/alerts";
  const token = typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
  const qs = token ? `?token=${encodeURIComponent(token)}` : "";
  return new WebSocket(`${wsBase}${path}${qs}`);
}
