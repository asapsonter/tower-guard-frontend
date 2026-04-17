export type AlarmAction = "arm" | "disarm";

type ErrorKey =
  | "404"
  | "500"
  | "timeout"
  | "connection_refused"
  | "device_offline"
  | "unknown";

const ACTION_LABEL: Record<AlarmAction, { present: string; past: string }> = {
  arm: { present: "Arming", past: "Arm" },
  disarm: { present: "Disarming", past: "Disarm" },
};

const MESSAGES: Record<ErrorKey, (action: AlarmAction) => string> = {
  "404": () => "Device not found. Check the panel configuration.",
  "500": (a) => `${ACTION_LABEL[a].past} failed on the server. Please try again.`,
  timeout: (a) => `${ACTION_LABEL[a].present} failed, please wait and try again.`,
  connection_refused: () => "Security panel is unreachable. Check its network connection.",
  device_offline: (a) => `Panel is offline — cannot ${a} the system right now.`,
  unknown: (a) => `Unable to ${a} the system. Please try again.`,
};

function classify(raw: unknown, httpStatus?: number): ErrorKey {
  if (httpStatus === 404) return "404";
  if (httpStatus === 500 || httpStatus === 502) return "500";
  if (httpStatus === 504) return "timeout";

  const msg = String((raw as { message?: string })?.message ?? raw ?? "").toLowerCase();
  if (!msg) return "unknown";
  if (msg.includes("timeout") || msg.includes("not responding")) return "timeout";
  if (msg.includes("connection refused") || msg.includes("econnrefused")) return "connection_refused";
  if (msg.includes("offline") || msg.includes("unreachable") || msg.includes("host is down")) return "device_offline";
  if (msg.includes("404") || msg.includes("not found")) return "404";
  if (msg.includes("500") || msg.includes("internal server error")) return "500";
  return "unknown";
}

export function friendlyAlarmError(
  action: AlarmAction,
  err: unknown,
  httpStatus?: number,
): string {
  return MESSAGES[classify(err, httpStatus)](action);
}
