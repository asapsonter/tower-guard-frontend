import { request } from "../http";

export const alarmEndpoints = {
  armSystem: () => request<any>("/api/alarm/arm", { method: "POST" }),
  disarmSystem: () => request<any>("/api/alarm/disarm", { method: "POST" }),
};
