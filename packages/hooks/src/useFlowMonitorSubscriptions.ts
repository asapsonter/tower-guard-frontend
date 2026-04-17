/**
 * useFlowMonitorSubscriptions — opens a single Supabase realtime channel
 * that listens to every relevant table and forwards every change into
 * the FlowMonitor singleton.
 *
 * Each app calls this once at boot. The hook returns nothing — it's a
 * side-effect-only subscription that powers the LiveFlowMonitor UI.
 *
 * Tables watched:
 *   - dispatch_assignments  (the core dispatch flow)
 *   - responder_messages    (chat between command and responder)
 *   - responder_locations   (GPS pings from field officers)
 *   - incidents             (root incident records)
 *
 * The channel name is shared, so all 4 apps see the same stream.
 * (Postgres realtime broadcasts to every subscriber regardless of app.)
 */
import { useEffect } from "react";
import { supabase } from "@tower-guard/supabase-client";
import { flowMonitor, type FlowEventCategory } from "@tower-guard/ui";

const TABLE_TO_CATEGORY: Record<string, FlowEventCategory> = {
  dispatch_assignments: "dispatch",
  responder_messages: "message",
  responder_locations: "location",
  incidents: "incident",
};

const TABLES = Object.keys(TABLE_TO_CATEGORY) as Array<keyof typeof TABLE_TO_CATEGORY>;

interface UseFlowMonitorSubscriptionsOptions {
  /** Optional: only subscribe to a subset of tables */
  tables?: string[];
  /** Optional: tag this hook instance for debugging */
  appName?: string;
}

export function useFlowMonitorSubscriptions(opts: UseFlowMonitorSubscriptionsOptions = {}) {
  useEffect(() => {
    if (opts.appName) {
      flowMonitor.setAppName(opts.appName);
    }

    if (!supabase) return;

    const watchTables = opts.tables ?? TABLES;
    const channel = supabase.channel("flow-monitor-global");

    watchTables.forEach((table) => {
      // supabase-js typing for postgres_changes uses overloads we can't satisfy
      // statically, so cast the channel to any for the .on() call only.
      (channel as unknown as { on: (...args: unknown[]) => unknown }).on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload: { eventType: string; new?: Record<string, unknown>; old?: Record<string, unknown> }) => {
          const eventType = payload.eventType;
          const row = payload.new || payload.old || {};
          const id = (row as { id?: string }).id ?? "?";
          const category = TABLE_TO_CATEGORY[table] ?? "system";

          flowMonitor.emit({
            source: "supabase-realtime",
            category,
            level: eventType === "INSERT" ? "success" : "info",
            message: `${table} ${eventType} (id=${String(id).slice(0, 8)})`,
            details: row,
          });
        },
      );
    });

    channel.subscribe((status) => {
      flowMonitor.emit({
        source: "auth",
        category: "system",
        level: status === "SUBSCRIBED" ? "success" : status === "CHANNEL_ERROR" ? "error" : "warning",
        message: `Realtime channel: ${status}`,
      });
    });

    return () => {
      supabase!.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
