export type AlertSeverity = "critical" | "warning" | "info";
export type SensorStatus = "online" | "offline" | "low-battery" | "unknown";

export interface Alert {
  id: string;
  eventType: string;
  sensorName: string;
  timestamp: string;
  severity: AlertSeverity;
}

export interface EventLog {
  id: string;
  timestamp: string;
  eventType: string;
  source: string;
  details: string;
  hasSnapshot: boolean;
  snapshotUrl?: string;
}

export interface Sensor {
  id: string;
  name: string;
  type: "gate" | "generator" | "battery" | "tower" | "fence" | "pir" | "vibration" | "camera";
  status: SensorStatus;
  battery?: number;
  lastSeen: string;
  location: { x: number; y: number };
}

export const mockAlerts: Alert[] = [
  { id: "a1", eventType: "INTRUDER", sensorName: "Perimeter", timestamp: "2026-03-17 22:14:38", severity: "critical" },
  { id: "a2", eventType: "INTRUDER", sensorName: "Perimeter", timestamp: "2026-03-17 22:12:05", severity: "critical" },
  { id: "a3", eventType: "INTRUDER", sensorName: "Perimeter", timestamp: "2026-03-17 22:08:19", severity: "critical" },
  { id: "a4", eventType: "INTRUDER", sensorName: "Perimeter", timestamp: "2026-03-17 21:45:00", severity: "critical" },
  { id: "a5", eventType: "INTRUDER", sensorName: "Perimeter", timestamp: "2026-03-17 22:14:40", severity: "critical" },
];

export const mockEventLog: EventLog[] = [
  { id: "e1", timestamp: "2026-03-17 22:14:40", eventType: "Intruder", source: "CCTV Motion Detection", details: "2 individuals detected breaching compound perimeter. Motion tracking active.", hasSnapshot: true },
  { id: "e2", timestamp: "2026-03-17 22:14:38", eventType: "Intruder", source: "CCTV Motion Detection", details: "Unauthorized person detected climbing perimeter fence. Duration: 3.8s", hasSnapshot: true },
  { id: "e3", timestamp: "2026-03-17 22:12:05", eventType: "Intruder", source: "CCTV Motion Detection", details: "Intruder detected via thermal sensor. Body heat signature confirmed. Recording in progress.", hasSnapshot: true },
  { id: "e4", timestamp: "2026-03-17 22:08:19", eventType: "Intruder", source: "CCTV Motion Detection", details: "Perimeter breach detected. Individual spotted moving toward equipment. Alert dispatched.", hasSnapshot: true },
  { id: "e5", timestamp: "2026-03-17 21:45:00", eventType: "Intruder", source: "CCTV Motion Detection", details: "Unauthorized entry attempt detected. CCTV snapshot captured. Threat level: HIGH.", hasSnapshot: true },
  { id: "e6", timestamp: "2026-03-17 21:30:12", eventType: "Intruder", source: "CCTV Motion Detection", details: "3 individuals detected near southern perimeter. Thermal signatures confirmed.", hasSnapshot: true },
  { id: "e7", timestamp: "2026-03-17 20:15:44", eventType: "Intruder", source: "CCTV Motion Detection", details: "Motion detected along eastern fence line. 1 person. Recording captured.", hasSnapshot: true },
  { id: "e8", timestamp: "2026-03-17 19:58:30", eventType: "Intruder", source: "CCTV Motion Detection", details: "Perimeter breach attempt detected at main gate area. CCTV snapshot saved.", hasSnapshot: true },
];

export const mockSensors: Sensor[] = [
  { id: "1", name: "Vibration Sensor", type: "vibration", status: "offline", battery: 100, lastSeen: "Waiting...", location: { x: 15, y: 30 } },
  { id: "2", name: "PIR Sensor", type: "pir", status: "offline", battery: 100, lastSeen: "Waiting...", location: { x: 38, y: 30 } },
  { id: "3", name: "Camera 1", type: "camera", status: "offline", battery: 100, lastSeen: "Waiting...", location: { x: 61, y: 30 } },
  { id: "4", name: "Camera 2", type: "camera", status: "offline", battery: 100, lastSeen: "Waiting...", location: { x: 84, y: 30 } },
];
