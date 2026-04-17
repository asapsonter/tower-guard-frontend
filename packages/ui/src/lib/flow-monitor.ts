/**
 * Flow Monitor — global event bus for end-to-end observability.
 *
 * Every layer of the data flow emits events here:
 *   - useSimulation: WebSocket messages received from the FastAPI backend
 *   - useAlertDispatchBridge: outgoing Supabase mutations (success/failure)
 *   - useFlowMonitorSubscriptions: incoming Postgres realtime pushes
 *   - Field App actions: accept/reject/status changes
 *
 * The singleton holds an in-memory ring buffer of recent events. The
 * <LiveFlowMonitor /> UI component subscribes via the useFlowMonitor hook
 * and renders the stream in real time.
 *
 * Buffer is in-memory only. Refresh resets it.
 */
import { useEffect, useState } from "react";

export type FlowEventSource =
  | "websocket"        // FastAPI WS message from hardware
  | "supabase-write"   // outgoing INSERT/UPDATE
  | "supabase-realtime" // incoming postgres_changes push
  | "user-action"      // user-initiated (accept, reject, send msg)
  | "auth"             // session events
  | "error";

export type FlowEventCategory =
  | "incident"
  | "dispatch"
  | "message"
  | "location"
  | "sensor"
  | "system";

export type FlowEventLevel = "info" | "success" | "warning" | "error";

export interface FlowEvent {
  id: string;
  timestamp: number;
  source: FlowEventSource;
  category: FlowEventCategory;
  message: string;
  level: FlowEventLevel;
  details?: Record<string, unknown>;
  /** Source app identifier for cross-app debugging (set automatically) */
  app?: string;
}

const MAX_BUFFER = 200;

class FlowMonitor {
  private listeners = new Set<(event: FlowEvent) => void>();
  private buffer: FlowEvent[] = [];
  private appName = "unknown";

  /** Set once at app boot to tag emitted events with the source app. */
  setAppName(name: string) {
    this.appName = name;
  }

  emit(event: Omit<FlowEvent, "id" | "timestamp" | "app">) {
    const fullEvent: FlowEvent = {
      ...event,
      id: `fm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      app: this.appName,
    };
    this.buffer.unshift(fullEvent);
    if (this.buffer.length > MAX_BUFFER) this.buffer.pop();
    this.listeners.forEach((l) => {
      try {
        l(fullEvent);
      } catch {
        /* swallow listener errors so one bad consumer doesn't break others */
      }
    });
  }

  subscribe(listener: (event: FlowEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getBuffer(): FlowEvent[] {
    return [...this.buffer];
  }

  clear() {
    this.buffer = [];
    this.listeners.forEach((l) => {
      try {
        l({
          id: `fm_clear_${Date.now()}`,
          timestamp: Date.now(),
          source: "auth",
          category: "system",
          message: "[buffer cleared]",
          level: "info",
          app: this.appName,
        });
      } catch {
        /* swallow */
      }
    });
  }
}

/**
 * Module-level singleton. All code in the same browser tab shares this
 * instance regardless of which package imports it.
 */
export const flowMonitor = new FlowMonitor();

/**
 * React hook — subscribes to the singleton and re-renders when new events
 * arrive. Returns the buffered events newest-first.
 */
export function useFlowMonitor(): FlowEvent[] {
  const [events, setEvents] = useState<FlowEvent[]>(() => flowMonitor.getBuffer());

  useEffect(() => {
    return flowMonitor.subscribe((event) => {
      setEvents((prev) => [event, ...prev].slice(0, MAX_BUFFER));
    });
  }, []);

  return events;
}
