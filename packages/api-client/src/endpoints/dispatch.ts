import { request } from "../http";

export const dispatchEndpoints = {
  dispatchResponders: (alertId: string, responderIds: string[]) =>
    request<any>("/api/dispatch", {
      method: "POST",
      body: JSON.stringify({ alert_id: alertId, responder_ids: responderIds }),
    }),
};
