/**
 * Client data layer for the ITIPS Operator Command Dashboard.
 *
 * <OpsProvider> loads the estate snapshot from /api/ops once per session and
 * overlays local changes (approved dispatches). Every workspace reads it via
 * useOps(). Per-site Digital Twin detail is fetched on demand with useSite().
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  AccessStatus, AssetKind, AssetStatus, CaseStage, DispatchRecommendation, GuardianAnswer, Incident, IncidentStatus,
  IncidentType, InsiderFlag, OpsSnapshot, ResponseTeam, SearchHit, Severity, SiteDetail, SiteState, TeamStatus,
} from "../../server/types";

export type * from "../../server/types";
export { SITE_STATES, RESPONSE_STAGES, CASE_STAGES } from "../../server/types";

interface OpsContextValue {
  snap: OpsSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  incident: (id: string) => Incident | undefined;
  team: (id: string) => ResponseTeam | undefined;
  applyDispatch: (change: { incident: Incident; team: ResponseTeam }) => void;
}

const OpsContext = createContext<OpsContextValue | null>(null);

export function OpsProvider({ children }: { children: ReactNode }) {
  const [base, setBase] = useState<OpsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incOverrides, setIncOverrides] = useState<Record<string, Incident>>({});
  const [teamOverrides, setTeamOverrides] = useState<Record<string, ResponseTeam>>({});

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/ops?r=snapshot");
      if (!res.ok) throw new Error(`API ${res.status}`);
      setBase(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load operator data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load once per session — the demo backend anchors timestamps to request
  // time, so periodic re-fetches would make live countdowns jump back.
  useEffect(() => { refresh(); }, [refresh]);

  const snap = useMemo<OpsSnapshot | null>(() => {
    if (!base) return null;
    if (!Object.keys(incOverrides).length && !Object.keys(teamOverrides).length) return base;
    return {
      ...base,
      incidents: base.incidents.map((i) => incOverrides[i.id] ?? i),
      teams: base.teams.map((t) => teamOverrides[t.id] ?? t),
    };
  }, [base, incOverrides, teamOverrides]);

  const value = useMemo<OpsContextValue>(() => ({
    snap, loading, error, refresh,
    incident: (id) => snap?.incidents.find((i) => i.id === id),
    team: (id) => snap?.teams.find((t) => t.id === id),
    applyDispatch: ({ incident, team }) => {
      setIncOverrides((o) => ({ ...o, [incident.id]: incident }));
      setTeamOverrides((o) => ({ ...o, [team.id]: team }));
    },
  }), [snap, loading, error, refresh]);

  return <OpsContext.Provider value={value}>{children}</OpsContext.Provider>;
}

export function useOps(): OpsContextValue {
  const ctx = useContext(OpsContext);
  if (!ctx) throw new Error("useOps must be used inside <OpsProvider>");
  return ctx;
}

/** Site Security Digital Twin for one site (fetched on demand, cached per session). */
const siteCache = new Map<string, SiteDetail>();
export function useSite(siteId: string | null | undefined): { site: SiteDetail | null; loading: boolean; error: string | null } {
  const [site, setSite] = useState<SiteDetail | null>(siteId ? siteCache.get(siteId) ?? null : null);
  const [loading, setLoading] = useState(!!siteId && !siteCache.has(siteId));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!siteId) { setSite(null); return; }
    const cached = siteCache.get(siteId);
    if (cached) { setSite(cached); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/ops?r=site&id=${encodeURIComponent(siteId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`API ${r.status}`))))
      .then((d: SiteDetail) => { siteCache.set(siteId, d); if (!cancelled) { setSite(d); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load site"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [siteId]);
  return { site, loading, error };
}

// ── API calls ─────────────────────────────────────────────────────────────

export async function searchAnything(q: string): Promise<SearchHit[]> {
  const res = await fetch(`/api/ops?r=search&q=${encodeURIComponent(q)}`);
  return res.ok ? res.json() : [];
}

export async function fetchRecommendation(incidentId: string): Promise<DispatchRecommendation | null> {
  const res = await fetch(`/api/ops?r=recommend&incident=${encodeURIComponent(incidentId)}`);
  return res.ok ? res.json() : null;
}

export async function approveDispatch(incidentId: string, teamId: string, approvedBy: string): Promise<{ incident: Incident; team: ResponseTeam }> {
  const res = await fetch("/api/ops?r=dispatch", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ incidentId, teamId, approvedBy }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `API ${res.status}`);
  return res.json();
}

export async function askGuardian(question: string): Promise<GuardianAnswer> {
  const res = await fetch("/api/guardian", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `API ${res.status}`);
  return res.json();
}

// ── Formatting ────────────────────────────────────────────────────────────

export function fmtDuration(totalSec: number | null | undefined): string {
  if (totalSec == null || !Number.isFinite(totalSec)) return "—";
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(sec).padStart(2, "0")}s`;
}

export function fmtClock(sec: number): string {
  const neg = sec < 0;
  const s = Math.abs(Math.round(sec));
  const txt = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return neg ? `+${txt}` : txt;
}

export function fmtNaira(n: number): string {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}bn`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1000) return `₦${Math.round(n / 1000)}k`;
  return `₦${n}`;
}

export const fmtNum = (n: number) => n.toLocaleString("en-GB");

export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-GB", { timeZone: "Africa/Lagos", hour12: false });
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: "Africa/Lagos", day: "2-digit", month: "short", year: "numeric" });
}

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.round((now - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export const secondsBetween = (a?: string | null, b?: string | null) =>
  a && b ? (new Date(b).getTime() - new Date(a).getTime()) / 1000 : null;

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

// ── Labels & colours (hex so they also work in Leaflet/SVG) ───────────────

export const SITE_STATE_LABEL: Record<SiteState, string> = {
  normal: "Normal", warning: "Warning", incident: "Incident", critical: "Critical", offline: "Offline", maintenance: "Maintenance",
};
export const SITE_STATE_COLOR: Record<SiteState, string> = {
  normal: "#22c55e", warning: "#eab308", incident: "#f97316", critical: "#ef4444", offline: "#64748b", maintenance: "#a78bfa",
};

export const ASSET_STATUS_COLOR: Record<AssetStatus, string> = {
  healthy: "#22c55e", warning: "#eab308", tamper: "#f97316", offline: "#64748b", intrusion: "#ef4444", maintenance: "#a78bfa",
};
export const ASSET_LABEL: Record<AssetKind, string> = {
  tower: "Tower", generator: "Generator", battery: "Battery bank", diesel: "Diesel tank", solar: "Solar system",
  shelter: "Shelter", feeder: "Feeder cables", gate: "Gate", cabinet: "Security cabinet", itips: "ITIPS equipment",
};

export const INCIDENT_TYPE_LABEL: Record<IncidentType, string> = {
  vandalism: "Vandalism", battery_theft: "Battery theft", generator_theft: "Generator theft", diesel_theft: "Diesel theft",
  cable_theft: "Cable theft", solar_theft: "Solar theft", intrusion: "Intrusion", sabotage: "Sabotage",
};
export const INCIDENT_TYPE_COLOR: Record<IncidentType, string> = {
  vandalism: "#f97316", battery_theft: "#06b6d4", generator_theft: "#3b82f6", diesel_theft: "#eab308",
  cable_theft: "#a855f7", solar_theft: "#84cc16", intrusion: "#ef4444", sabotage: "#ec4899",
};
export const SEVERITY_COLOR: Record<Severity, string> = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e" };

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  detected: "Detected", verified: "Verified · awaiting dispatch", dispatched: "Dispatched", en_route: "En route",
  on_site: "On site", secured: "Site secured", closed: "Closed",
};

export const TEAM_STATUS_LABEL: Record<TeamStatus, string> = {
  available: "Available", assigned: "Assigned", en_route: "En route", on_site: "On-site", unavailable: "Unavailable", emergency: "Emergency",
};
export const TEAM_STATUS_COLOR: Record<TeamStatus, string> = {
  available: "#22c55e", assigned: "#3b82f6", en_route: "#06b6d4", on_site: "#f97316", unavailable: "#64748b", emergency: "#ef4444",
};

export const ACCESS_STATUS_COLOR: Record<AccessStatus, string> = {
  AUTHORIZED: "#22c55e", IN_PROGRESS: "#06b6d4", OUTSIDE_WINDOW: "#eab308", NO_WORK_ORDER: "#f97316", SCOPE_EXCEEDED: "#f97316", INSIDER_RISK: "#ef4444",
};
export const INSIDER_FLAG_LABEL: Record<InsiderFlag, string> = {
  outside_hours: "Access outside approved hours",
  no_work_order: "Access without work order",
  repeat_before_theft: "Repeated visits before theft",
  multi_site_affected: "Appears at multiple affected sites",
  vehicle_multi_incident: "Same vehicle near multiple incidents",
  unusual_dwell: "Unusual dwell time",
  out_of_scope_asset: "Accessed assets outside job scope",
  unknown_companions: "Accompanied by unknown persons",
  camera_obstructed_after: "Camera obstructed after authorised access",
  alarm_suppression: "Repeated alarm suppression",
};

export const CASE_STAGE_LABEL: Record<CaseStage, string> = {
  incident: "Incident", investigation: "Investigation", suspect: "Suspect", arrest: "Arrest", police_case: "Police case",
  charge: "Charge", court: "Court", judgment: "Judgment", sentence: "Sentence", asset_recovery: "Asset recovery", closed: "Closed",
};

// ── Generic relationship graph types (client-side Threat DNA graphs) ─────

export type GraphNodeKind = "person" | "phone" | "vehicle" | "contractor" | "site" | "incident" | "asset" | "case" | "dealer" | "tool";
export interface GraphNode { id: string; kind: GraphNodeKind; label: string; meta?: Record<string, string | number> }
export interface GraphEdge { from: string; to: string; relation: string; confidence: number; source: string }
export const GRAPH_KIND_COLOR: Record<GraphNodeKind, string> = {
  person: "#ef4444", phone: "#f59e0b", vehicle: "#3b82f6", contractor: "#a855f7", site: "#22c55e",
  incident: "#f97316", asset: "#06b6d4", case: "#e2e8f0", dealer: "#ec4899", tool: "#94a3b8",
};
