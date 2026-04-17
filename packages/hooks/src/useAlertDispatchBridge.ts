/**
 * useAlertDispatchBridge — bridges the live alert stream to the NSCDC dispatch system.
 *
 * When a critical alert arrives in the telecom_admin dashboard, this hook
 * automatically creates an incident + dispatch_assignment in Supabase, which
 * propagates in real-time to:
 *   - NSCDC Station Dashboard (via useRealtimeAssignments)
 *   - Field App                (via useResponderAssignments, filtered by council_area)
 *
 * The dispatched incident is attributed to a specific telecom mast site.
 * In the demo, the office hardware (AX-Pro PIR) maps to ONE mast configured
 * via VITE_HARDWARE_MAST_ID. The bridge looks up that mast and writes its
 * name, address, state, and lga into the incident — so the dashboards show
 * the alert as coming from a real telecom mast site (e.g. "MTN Maitama Tower")
 * rather than a generic placeholder.
 *
 * Design notes:
 *   - Alerts are de-duplicated by ID using a useRef Set, so re-renders never
 *     re-dispatch the same alert (the alerts array from useSimulation is a
 *     fresh array on every WebSocket message).
 *   - Only severity="critical" alerts dispatch. Warnings and info are ignored
 *     to prevent flooding the field app.
 *   - The hook accepts an `enabled` flag so it only runs for the telecom_admin
 *     role, not for NSCDC roles (which would otherwise see their own dispatches
 *     re-fired in a loop).
 *   - Network failures are caught and logged but never throw — the dashboard
 *     remains usable even if Supabase is down.
 */
import { useEffect, useRef } from "react";
import type { Alert, TelecomMast } from "@tower-guard/data";
import { createDispatchFromAlert } from "./useDispatchService";
import { flowMonitor } from "@tower-guard/ui";

interface BridgeOptions {
  enabled: boolean;
  alerts: Alert[];
  /**
   * The telecom mast that this hardware represents. Every dispatch the bridge
   * creates is attributed to this mast. Look the mast up via VITE_HARDWARE_MAST_ID
   * in the consuming component (e.g. App.tsx) and pass it here.
   */
  hardwareMast?: TelecomMast;
}

export function useAlertDispatchBridge({
  enabled,
  alerts,
  hardwareMast,
}: BridgeOptions) {
  // Tracks IDs of alerts that have already been dispatched in this session.
  // Persists across re-renders so the same alert is never dispatched twice,
  // even though `alerts` is a new array reference on every WebSocket message.
  const dispatchedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || alerts.length === 0) return;

    // Find new critical alerts that haven't been dispatched yet
    const newCritical = alerts.filter(
      (a) => a.severity === "critical" && !dispatchedIdsRef.current.has(a.id),
    );

    if (newCritical.length === 0) return;

    // Mark them as dispatched IMMEDIATELY (synchronous) before the async work
    // begins, so a fast re-render can't fire a duplicate while the network
    // request is in flight.
    newCritical.forEach((a) => dispatchedIdsRef.current.add(a.id));

    // Resolve mast info up-front so each dispatch uses consistent data
    const mastName = hardwareMast?.name ?? "Unknown Mast Site";
    const mastAddress = hardwareMast?.address ?? "Location unspecified";
    const mastState = hardwareMast?.state ?? "FCT";
    const mastLga = hardwareMast?.lga;
    const mastId = hardwareMast?.id;

    // Fire the dispatches in parallel; failures are isolated per alert
    newCritical.forEach((alert) => {
      flowMonitor.emit({
        source: "supabase-write",
        category: "dispatch",
        level: "info",
        message: `Bridge: creating dispatch for ${alert.eventType} at ${mastName}`,
        details: {
          alertId: alert.id,
          severity: alert.severity,
          mast: mastName,
          sensor: alert.sensorName,
        },
      });

      createDispatchFromAlert({
        eventType: alert.eventType,
        // Location = the mast site (this is what NSCDC dashboards show as the title).
        // Format: "<mast name> — <address>" so the operator sees both at a glance.
        location: `${mastName} — ${mastAddress}`,
        // Details = the actual sensor that fired plus a timestamp, so operators
        // can correlate to the specific physical sensor at the mast.
        details: `${alert.eventType} detected by ${alert.sensorName} at ${mastName} (${alert.timestamp})`,
        severity: alert.severity,
        state: mastState,
        lga: mastLga,
        mastId,
        source: "Tower Guard Live Monitoring",
      })
        .then((result) => {
          if (result?.assignment) {
            console.log(
              `[AlertDispatchBridge] Dispatched ${alert.eventType} → assignment ${result.assignment.id}`,
            );
            flowMonitor.emit({
              source: "supabase-write",
              category: "dispatch",
              level: "success",
              message: `Bridge: dispatch INSERT OK (assignment ${result.assignment.id.slice(0, 8)})`,
              details: {
                assignmentId: result.assignment.id,
                incidentId: result.incident?.id,
                councilArea: result.assignment.council_area,
                status: result.assignment.status,
                mast: mastName,
              },
            });
          } else {
            // result was null — createDispatchFromAlert logged an error but didn't throw
            flowMonitor.emit({
              source: "error",
              category: "dispatch",
              level: "error",
              message: "Bridge: dispatch returned null (incident insert failed — check Supabase RLS or schema)",
              details: { alertId: alert.id },
            });
            dispatchedIdsRef.current.delete(alert.id);
          }
        })
        .catch((err) => {
          // Roll back the de-dupe entry so a manual retry can succeed
          dispatchedIdsRef.current.delete(alert.id);
          console.error(
            `[AlertDispatchBridge] Failed to dispatch alert ${alert.id}:`,
            err,
          );
          flowMonitor.emit({
            source: "error",
            category: "dispatch",
            level: "error",
            message: `Bridge: dispatch FAILED — ${(err as Error).message ?? "unknown error"}`,
            details: { alertId: alert.id, error: String(err) },
          });
        });
    });
  }, [enabled, alerts, hardwareMast]);
}
