import { useState, useEffect, useCallback, useRef } from "react";
import type { Alert, EventLog, Sensor, AlertSeverity } from "@tower-guard/data";
import { mockAlerts, mockEventLog, mockSensors } from "@tower-guard/data";
import { mockTelecomMasts, type TelecomMast } from "@tower-guard/data";
import { api } from "@tower-guard/api-client";
import { flowMonitor } from "@tower-guard/ui";

const now = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10) + " " + d.toTimeString().slice(0, 8);
};

function playAlertSound(severity: AlertSeverity) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (severity === "critical") {
      osc.type = "square";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(0, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    }

    osc.onended = () => ctx.close();
  } catch {
    // Audio not available
  }
}

export function useSimulation() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [events, setEvents] = useState<EventLog[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>(mockSensors); 
  const [masts, setMasts] = useState<TelecomMast[]>(mockTelecomMasts);
  const [triggeredSensors, setTriggeredSensors] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isArmed, setIsArmed] = useState<boolean>(false); // NEW STATE to hold arm status

  const clearUnread = useCallback(() => setUnreadCount(0), []);
  const toggleSound = useCallback(() => setSoundEnabled((p) => !p), []);

  const addEvent = useCallback(() => {
    // mock addEvent if still needed by UI buttons
  }, []);

  const soundRef = useRef(soundEnabled);
  useEffect(() => { soundRef.current = soundEnabled; }, [soundEnabled]);

  // Live WebSocket Integration
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let isSubscribed = true;
    let reconnectDelay = 3000;

    const connect = () => {
      if (!isSubscribed) return;

      try {
        ws = api.connectWebSocket();
      } catch {
        // connectWebSocket can throw if the URL is invalid
        reconnectTimer = setTimeout(connect, reconnectDelay);
        return;
      }

      ws.onopen = () => {
        console.log("Connected to security WS");
        reconnectDelay = 3000;
        flowMonitor.emit({
          source: "websocket",
          category: "system",
          level: "success",
          message: "WebSocket connected to FastAPI backend",
        });
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          // Emit a flow event for every WS message so the user sees what
          // arrives from hardware in real time, even if downstream parsing
          // changes the shape.
          flowMonitor.emit({
            source: "websocket",
            category: payload.type === "system_status" ? "sensor" : "incident",
            level: "info",
            message: `WS: ${payload.type ?? "unknown"}`,
            details: payload.data ?? payload,
          });

          if (payload.type === "system_status") {
             const axproData = payload.data?.host_status?.AlarmHostStatus;
             if (axproData) {
                 const zoneList = axproData.ZoneList || [];
                 const ipcZoneList = axproData.IPCZoneList || [];
                 const sirenList = axproData?.ExDevStatus?.SirenList || [];

                 // Friendly names + icon type per hardware zone id. These match
                 // what's actually bound to the panel today.
                 const ZONE_MAP: Record<number, { name: string; type: Sensor["type"] }> = {
                   0: { name: "Generator Area Detector", type: "pir" },
                   1: { name: "Gate Detector", type: "fence" },
                 };

                 // Build sensors for regular wireless zones.
                 const liveZones: Record<number, Record<string, unknown>> = {};
                 for (const z of zoneList) {
                   const zid = z?.Zone?.id;
                   if (zid == null) continue;
                   liveZones[zid] = z.Zone;
                 }

                 const allZoneIds = new Set<number>([
                   ...Object.keys(ZONE_MAP).map(Number),
                   ...Object.keys(liveZones).map(Number),
                 ]);

                 const zoneSensors: Sensor[] = Array.from(allZoneIds)
                   .sort((a, b) => a - b)
                   .map((zoneId, idx) => {
                    const mapped = ZONE_MAP[zoneId] || { name: `Zone ${zoneId}`, type: "fence" as const };
                    const live = liveZones[zoneId];
                    return {
                      id: String(zoneId),
                      name: mapped.name,
                      type: mapped.type,
                      status: live ? "online" : "unknown",
                      lastSeen: live ? "Just now" : "Waiting...",
                      battery: (live?.chargeValue as number | undefined) ?? 100,
                      location: { x: 15 + (idx % 4) * 23, y: 30 + Math.floor(idx / 4) * 30 },
                    };
                  });

                 // Cameras come through IPCZoneList, not ZoneList. All bound
                 // IPC channels are surfaced as active devices.
                 const cameraSensors: Sensor[] = ipcZoneList.map((c: Record<string, unknown>, idx: number) => ({
                   id: `ipc-${c.channelID ?? idx}`,
                   name: (c.name as string) || `IPC ${c.channelID ?? idx}`,
                   type: "camera",
                   status: "online",
                   lastSeen: "Just now",
                   battery: 100,
                   location: { x: 15 + ((zoneSensors.length + idx) % 4) * 23, y: 30 + Math.floor((zoneSensors.length + idx) / 4) * 30 },
                 }));

                 // Sirens — surfaced so the operator sees the full device list.
                 const sirenSensors: Sensor[] = sirenList.map((s: { Siren?: Record<string, unknown> }, idx: number) => {
                   const siren = s?.Siren || {};
                   return {
                     id: `siren-${siren.id ?? idx}`,
                     name: (siren.name as string) || `Siren ${siren.id ?? idx}`,
                     type: "gate",
                     status: "online",
                     lastSeen: "Just now",
                     battery: (siren.chargeValue as number | undefined) ?? 100,
                     location: { x: 15 + ((zoneSensors.length + cameraSensors.length + idx) % 4) * 23, y: 30 + Math.floor((zoneSensors.length + cameraSensors.length + idx) / 4) * 30 },
                   };
                 });

                 const newSensors: Sensor[] = [...zoneSensors, ...cameraSensors, ...sirenSensors];

                 setSensors(prev => {
                     const isSame = prev.length === newSensors.length && prev.every((p, i) => p.status === newSensors[i].status && p.battery === newSensors[i].battery && p.id === newSensors[i].id);
                     return isSame ? prev : newSensors;
                 });

                 // Check if any SubSys is armed
                 const subsys = axproData.SubSysList || [];
                 const armedState = subsys.some((s: any) => s.SubSys.arming === "away" || s.SubSys.arming === "stay");
                 setIsArmed(armedState);
             }
          }
          else if (payload.type === "ai_detection") {
             const data = payload.data;
             const ts = now();
             const isHuman = data.threat_type === "human_detected";
             const isVehicle = data.threat_type === "vehicle_detected";
             const severity: AlertSeverity = (isHuman || isVehicle) ? "critical" : "warning";

             const eventTypeMap: Record<string, string> = {
               human_detected: "INTRUSION",
               vehicle_detected: "VEHICLE_INTRUSION",
               animal_detected: "ANIMAL_DETECTION",
             };

             const newAlert: Alert = {
               id: `ai-${data.object_id}-${Date.now()}`,
               eventType: eventTypeMap[data.threat_type] || "AI_DETECTION",
               sensorName: data.sensor_description || data.sensor_id || "AI Camera",
               timestamp: ts,
               severity,
             };

             const eventLabelMap: Record<string, string> = {
               human_detected: "Human Detected",
               vehicle_detected: "Vehicle Detected",
               animal_detected: "Animal Detected",
             };

             const newEvent: EventLog = {
               id: `ev-ai-${data.object_id}-${Date.now()}`,
               timestamp: ts,
               eventType: eventLabelMap[data.threat_type] || "AI Detection",
               source: `${data.site_name} — ${data.sensor_description || data.sensor_id}`,
               details: data.description,
               hasSnapshot: false,
             };

             setAlerts((prev) => [newAlert, ...prev].slice(0, 15));
             setEvents((prev) => [newEvent, ...prev].slice(0, 25));
             setUnreadCount((prev) => prev + 1);

             if (soundRef.current) playAlertSound(severity);
          }
          else if (payload.type === "zone_alarm" || payload.type === "tamper_alarm") {
             const data = payload.data;
             if (data.status === "trigger" || payload.type === "tamper_alarm") {
                const ts = now();
                const newAlert: Alert = {
                   id: `al-${data.zone_id}-${Date.now()}`,
                   eventType: payload.type === "tamper_alarm" ? "TAMPERING" : "INTRUSION",
                   sensorName: data.zone_name,
                   timestamp: ts,
                   severity: "critical"
                };
                const snapshots: string[] = data.snapshots || [];
                const snapshotUrl = snapshots.length > 0 ? snapshots[0] : undefined;
                const newEvent: EventLog = {
                   id: `ev-${data.zone_id}-${Date.now()}`,
                   timestamp: ts,
                   eventType: payload.type === "tamper_alarm" ? "Tamper Detected" : "Zone Triggered",
                   source: data.zone_name,
                   details: `Status changed to ${data.status || data.tamper_status}`,
                   hasSnapshot: snapshots.length > 0,
                   snapshotUrl,
                };

                setAlerts((prev) => [newAlert, ...prev].slice(0, 15));
                setEvents((prev) => [newEvent, ...prev].slice(0, 25));
                setUnreadCount((prev) => prev + 1);

                setTriggeredSensors((prev) => new Set(prev).add(data.zone_name));

                if (soundRef.current) playAlertSound("critical");

                setTimeout(() => {
                  setTriggeredSensors((prev) => {
                    const next = new Set(prev);
                    next.delete(data.zone_name);
                    return next;
                  });
                }, 10000);
             }
          }
        } catch (e) {
          console.error("Failed to parse WS:", e);
          flowMonitor.emit({
            source: "error",
            category: "system",
            level: "error",
            message: `WS parse error: ${(e as Error).message}`,
          });
        }
      };

      ws.onclose = () => {
        if (!isSubscribed) return;
        console.log(`WS closed, reconnecting in ${reconnectDelay / 1000}s`);
        flowMonitor.emit({
          source: "websocket",
          category: "system",
          level: "warning",
          message: `WebSocket closed, reconnecting in ${reconnectDelay / 1000}s`,
        });
        reconnectTimer = setTimeout(connect, reconnectDelay);
        // Exponential backoff: 3s → 6s → 12s → … capped at 30s
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      };

      ws.onerror = () => {
        // onerror is always followed by onclose, so no action needed here
      };
    };

    connect();

    return () => {
      isSubscribed = false;
      clearTimeout(reconnectTimer);
      if (ws) {
          ws.onclose = null;
          ws.close();
      }
    };
  }, []);

  // Extend return for isArmed
  return { alerts, events, sensors, masts, triggeredSensors, unreadCount, clearUnread, soundEnabled, toggleSound, addEvent, isArmed };
}
