/**
 * Shared dispatch service — Uber-like flow connecting all 3 tiers:
 * 1. Tower Guard (rider) → creates incident + dispatch assignment
 * 2. NSCDC Responder (driver) → accepts/rejects, updates status, sends messages
 * 3. NSCDC Command (operations) → monitors everything in realtime
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@tower-guard/supabase-client";
import type { Tables } from "@tower-guard/data";

export type Incident = Tables<"incidents">;
export type DispatchAssignment = Tables<"dispatch_assignments">;
export type ResponderMessage = Tables<"responder_messages">;

// ── Tower Guard: Create incident + dispatch assignment ──
// Demo Mode: All dispatches are routed to council_area="AMAC" so the single
// NSCDC field officer login can receive every alert nationwide. Replace with
// a state→council mapping when seeding additional responder accounts.
const DEMO_COUNCIL_AREA = "AMAC";

export async function createDispatchFromAlert(alert: {
  eventType: string;
  location: string;
  details: string;
  severity: string;
  state?: string;
  lga?: string;
  mastId?: string;
  councilArea?: string;
  source?: string;
}) {
  if (!supabase) {
    console.warn("Supabase not configured — dispatch skipped");
    return null;
  }

  // 1. Create incident
  const { data: incident, error: incErr } = await supabase
    .from("incidents")
    .insert({
      event_type: alert.eventType,
      details: alert.details,
      severity: alert.severity,
      location: alert.location,
      state: alert.state || "FCT",
      lga: alert.lga,
      mast_id: alert.mastId,
      source: alert.source || "CCTV Motion Detection",
      status: "pending",
    })
    .select()
    .single();

  if (incErr || !incident) {
    console.error("Failed to create incident:", incErr);
    return null;
  }

  // 2. Create dispatch assignment (goes to NSCDC responders like an Uber ride request)
  const { data: assignment, error: dispErr } = await supabase
    .from("dispatch_assignments")
    .insert({
      incident_id: incident.id,
      agency: "NSCDC",
      status: "pending",
      sla_seconds: 900, // 15 min SLA window
      council_area: alert.councilArea || DEMO_COUNCIL_AREA,
    })
    .select()
    .single();

  if (dispErr) {
    console.error("Failed to create dispatch:", dispErr);
  }

  return { incident, assignment };
}

// ── Result type — wraps every dispatch action so callers see real errors ──
//
// Previously every action returned a bare boolean. That hid the actual
// Supabase error (RLS rejection, schema mismatch, network failure) inside
// console.error, which the user never sees in the field. Now every action
// returns { ok, error } and the field app surfaces the error message in
// both the toast and the LiveFlowMonitor.
export interface DispatchResult {
  ok: boolean;
  error?: { message: string; code?: string; details?: string; hint?: string };
}

const toResult = (error: { message?: string; code?: string; details?: string; hint?: string } | null): DispatchResult => {
  if (!error) return { ok: true };
  return {
    ok: false,
    error: {
      message: error.message ?? "Unknown error",
      code: error.code,
      details: error.details,
      hint: error.hint,
    },
  };
};

// ── Responder: Accept/Reject assignment ──
export async function acceptAssignment(
  assignmentId: string,
  responderId: string,
  responderName: string,
): Promise<DispatchResult> {
  // sender_id is uuid-typed in the schema; pass null instead of an empty
  // string if the demo user has no real UUID, to avoid 22P02 (invalid uuid).
  if (!supabase) return { ok: false, error: { message: "Supabase not configured" } };
  const safeResponderId = responderId && responderId.length === 36 ? responderId : null;

  const { error } = await supabase
    .from("dispatch_assignments")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      responder_id: safeResponderId,
      responder_name: responderName,
    })
    .eq("id", assignmentId);

  if (error) console.error("[acceptAssignment] Supabase error:", error);
  return toResult(error);
}

export async function rejectAssignment(assignmentId: string): Promise<DispatchResult> {
  if (!supabase) return { ok: false, error: { message: "Supabase not configured" } };
  // Reset to pending so another responder can pick it up
  const { error } = await supabase
    .from("dispatch_assignments")
    .update({ status: "pending", responder_id: null, responder_name: null })
    .eq("id", assignmentId);

  if (error) console.error("[rejectAssignment] Supabase error:", error);
  return toResult(error);
}

export async function updateAssignmentStatus(
  assignmentId: string,
  newStatus: string,
): Promise<DispatchResult> {
  if (!supabase) return { ok: false, error: { message: "Supabase not configured" } };
  const updates: Record<string, unknown> = { status: newStatus };
  if (newStatus === "en-route") updates.en_route_at = new Date().toISOString();
  if (newStatus === "on-site") updates.on_site_at = new Date().toISOString();
  if (newStatus === "resolved") updates.resolved_at = new Date().toISOString();

  const { error } = await supabase
    .from("dispatch_assignments")
    .update(updates as never) // updates built dynamically; Supabase rejects loose Record types
    .eq("id", assignmentId);

  // Also update incident if resolved
  if (!error && newStatus === "resolved") {
    const { data: assignment } = await supabase
      .from("dispatch_assignments")
      .select("incident_id")
      .eq("id", assignmentId)
      .single();
    if (assignment) {
      await supabase
        .from("incidents")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", assignment.incident_id);
    }
  }

  if (error) console.error("[updateAssignmentStatus] Supabase error:", error);
  return toResult(error);
}

// ── Messages (text + voice) ──
export async function sendDispatchMessage(msg: {
  assignmentId: string;
  senderId?: string;
  senderName: string;
  senderRole: string;
  messageType: string;
  content: string;
  voiceDuration?: number;
}): Promise<DispatchResult> {
  if (!supabase) return { ok: false, error: { message: "Supabase not configured" } };
  // sender_id is uuid-typed; pass null for non-uuid demo IDs
  const safeSenderId = msg.senderId && msg.senderId.length === 36 ? msg.senderId : null;

  const { error } = await supabase.from("responder_messages").insert({
    assignment_id: msg.assignmentId,
    sender_id: safeSenderId,
    sender_name: msg.senderName,
    sender_role: msg.senderRole,
    message_type: msg.messageType,
    content: msg.content,
    voice_duration_seconds: msg.voiceDuration || null,
  });

  if (error) console.error("[sendDispatchMessage] Supabase error:", error);
  return toResult(error);
}

// ── GPS location reporting ──
export async function reportLocation(
  responderId: string,
  assignmentId: string,
  lat: number,
  lng: number,
  accuracy?: number,
): Promise<DispatchResult> {
  if (!supabase) return { ok: false, error: { message: "Supabase not configured" } };
  const safeResponderId = responderId && responderId.length === 36 ? responderId : null;

  const { error } = await supabase.from("responder_locations").insert({
    responder_id: safeResponderId,
    assignment_id: assignmentId,
    latitude: lat,
    longitude: lng,
    accuracy: accuracy || null,
  } as never);

  if (error) console.error("[reportLocation] Supabase error:", error);
  return toResult(error);
}

// ── Hooks for realtime data ──

// Set once a request to Supabase fails or times out, so components that
// remount (e.g. on every tab change) skip straight past the loading state.
let supabaseUnreachable = false;

/** Used by NSCDC Command to watch all assignments in realtime */
export function useRealtimeAssignments() {
  const [assignments, setAssignments] = useState<DispatchAssignment[]>([]);
  const [loading, setLoading] = useState(() => !supabaseUnreachable);

  const fetchAll = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    // Time-box the request: an unreachable Supabase project would otherwise
    // leave consumers on a loading spinner forever.
    if (supabaseUnreachable) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from("dispatch_assignments")
        .select("*")
        .order("dispatched_at", { ascending: false })
        .limit(50)
        .abortSignal(AbortSignal.timeout(5000));
      if (data) setAssignments(data);
      else if (error) supabaseUnreachable = true;
    } catch {
      supabaseUnreachable = true;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    fetchAll();
    const channel = supabase
      .channel("assignments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "dispatch_assignments" }, () => {
        fetchAll();
      })
      .subscribe();
    return () => { supabase!.removeChannel(channel); };
  }, [fetchAll]);

  return { assignments, loading };
}

/** Used by NSCDC Command to watch all messages in realtime */
export function useRealtimeMessages() {
  const [messages, setMessages] = useState<ResponderMessage[]>([]);

  const fetchAll = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("responder_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setMessages(data);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    fetchAll();
    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "responder_messages" }, () => {
        fetchAll();
      })
      .subscribe();
    return () => { supabase!.removeChannel(channel); };
  }, [fetchAll]);

  return { messages };
}

/** Used by Responder App to watch their pending assignments */
export function useResponderAssignments() {
  const [assignments, setAssignments] = useState<(DispatchAssignment & { incident?: Incident })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    // Get unresolved assignments (pending = available for any responder, or assigned to this user)
    const { data } = await supabase
      .from("dispatch_assignments")
      .select("*")
      .in("status", ["pending", "accepted", "en-route", "on-site"])
      .eq("council_area", "AMAC")
      .order("dispatched_at", { ascending: false })
      .limit(20);

    if (data) {
      // Fetch linked incidents
      const incidentIds = [...new Set(data.map(a => a.incident_id))];
      const { data: incidents } = await supabase
        .from("incidents")
        .select("*")
        .in("id", incidentIds);

      const incidentMap = new Map(incidents?.map(i => [i.id, i]) || []);
      setAssignments(data.map(a => ({ ...a, incident: incidentMap.get(a.incident_id) })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    fetchPending();
    const channel = supabase
      .channel("responder-assignments")
      .on("postgres_changes", { event: "*", schema: "public", table: "dispatch_assignments" }, () => {
        fetchPending();
      })
      .subscribe();
    return () => { supabase!.removeChannel(channel); };
  }, [fetchPending]);

  return { assignments, loading, refresh: fetchPending };
}

/** Used by Responder to watch messages for a specific assignment */
export function useAssignmentMessages(assignmentId: string | null) {
  const [messages, setMessages] = useState<ResponderMessage[]>([]);

  const fetchMsgs = useCallback(async () => {
    if (!assignmentId || !supabase) return;
    const { data } = await supabase
      .from("responder_messages")
      .select("*")
      .eq("assignment_id", assignmentId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  }, [assignmentId]);

  useEffect(() => {
    if (!assignmentId || !supabase) return;
    fetchMsgs();
    const channel = supabase
      .channel(`msgs-${assignmentId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "responder_messages",
        filter: `assignment_id=eq.${assignmentId}`,
      }, () => {
        fetchMsgs();
      })
      .subscribe();
    return () => { supabase!.removeChannel(channel); };
  }, [assignmentId, fetchMsgs]);

  return { messages, refresh: fetchMsgs };
}
