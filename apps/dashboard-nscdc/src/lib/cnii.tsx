/**
 * Client data layer for the CNII command dashboard.
 *
 * <CniiProvider> loads the snapshot from /api/cnii once per session
 * and overlays local changes (approved dispatches) on top, so every workspace
 * reads one consistent dataset through useCnii().
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  CniiSnapshot, DispatchRecommendation, GuardianAnswer, Incident, IncidentStatus, IncidentType, ResponseUnit,
  Severity, UnitStatus, ModusOperandi, GraphNodeKind, CaseStage, EvidenceKind,
} from "../../server/types";

export type * from "../../server/types";
export { SLA_STAGES } from "../../server/types";

interface CniiContextValue {
  snap: CniiSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  /** Lookups over the merged snapshot */
  incident: (id: string) => Incident | undefined;
  unit: (id: string) => ResponseUnit | undefined;
  /** Record a commander-approved dispatch returned by the API */
  applyDispatch: (change: { incident: Incident; unit: ResponseUnit }) => void;
}

const CniiContext = createContext<CniiContextValue | null>(null);

export function CniiProvider({ children }: { children: ReactNode }) {
  const [base, setBase] = useState<CniiSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incOverrides, setIncOverrides] = useState<Record<string, Incident>>({});
  const [unitOverrides, setUnitOverrides] = useState<Record<string, ResponseUnit>>({});

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cnii?r=snapshot");
      if (!res.ok) throw new Error(`API ${res.status}`);
      setBase(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load CNII data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load once per session. The demo backend anchors timestamps to request
  // time, so periodic re-fetches would make every live countdown jump back.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const snap = useMemo<CniiSnapshot | null>(() => {
    if (!base) return null;
    if (!Object.keys(incOverrides).length && !Object.keys(unitOverrides).length) return base;
    return {
      ...base,
      incidents: base.incidents.map((i) => incOverrides[i.id] ?? i),
      units: base.units.map((u) => unitOverrides[u.id] ?? u),
    };
  }, [base, incOverrides, unitOverrides]);

  const value = useMemo<CniiContextValue>(() => ({
    snap,
    loading,
    error,
    refresh,
    incident: (id) => snap?.incidents.find((i) => i.id === id),
    unit: (id) => snap?.units.find((u) => u.id === id),
    applyDispatch: ({ incident, unit }) => {
      setIncOverrides((o) => ({ ...o, [incident.id]: incident }));
      setUnitOverrides((o) => ({ ...o, [unit.id]: unit }));
    },
  }), [snap, loading, error, refresh]);

  return <CniiContext.Provider value={value}>{children}</CniiContext.Provider>;
}

export function useCnii(): CniiContextValue {
  const ctx = useContext(CniiContext);
  if (!ctx) throw new Error("useCnii must be used inside <CniiProvider>");
  return ctx;
}

// ── API calls ─────────────────────────────────────────────────────────────

export async function fetchRecommendation(incidentId: string): Promise<DispatchRecommendation | null> {
  const res = await fetch(`/api/cnii?r=recommend&incident=${encodeURIComponent(incidentId)}`);
  return res.ok ? res.json() : null;
}

export async function approveDispatch(incidentId: string, unitId: string, approvedBy: string): Promise<{ incident: Incident; unit: ResponseUnit }> {
  const res = await fetch("/api/cnii?r=dispatch", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ incidentId, unitId, approvedBy }),
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

/** 734 → "12m 14s"; 4000 → "1h 06m" */
export function fmtDuration(totalSec: number | null | undefined): string {
  if (totalSec == null || !Number.isFinite(totalSec)) return "—";
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(sec).padStart(2, "0")}s`;
}

/** mm:ss countdown text (negative → "+mm:ss" overdue) */
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

/** HH:MM:SS in West Africa Time */
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

// ── Labels & colours (hex so they also work inside Leaflet/SVG) ───────────

export const INCIDENT_TYPE_LABEL: Record<IncidentType, string> = {
  vandalism: "Confirmed vandalism",
  theft: "Theft",
  armed_intrusion: "Armed intrusion",
  cable_theft: "Cable theft",
  battery_generator_theft: "Battery / generator theft",
  tower_sabotage: "Tower sabotage",
};

export const INCIDENT_TYPE_COLOR: Record<IncidentType, string> = {
  vandalism: "#f97316",
  theft: "#eab308",
  armed_intrusion: "#ef4444",
  cable_theft: "#a855f7",
  battery_generator_theft: "#06b6d4",
  tower_sabotage: "#ec4899",
};

export const SEVERITY_COLOR: Record<Severity, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  detected: "Detected",
  verified: "Verified · awaiting dispatch",
  dispatched: "Dispatched",
  en_route: "En route",
  on_site: "On site",
  contained: "Contained",
  closed: "Closed",
};

export const UNIT_STATUS_LABEL: Record<UnitStatus, string> = {
  available: "Available",
  standby: "Standby",
  assigned: "Assigned",
  en_route: "En route",
  on_site: "On-site",
  returning: "Returning",
  unavailable: "Unavailable",
};

export const UNIT_STATUS_COLOR: Record<UnitStatus, string> = {
  available: "#22c55e",
  standby: "#84cc16",
  assigned: "#3b82f6",
  en_route: "#06b6d4",
  on_site: "#f97316",
  returning: "#a78bfa",
  unavailable: "#64748b",
};

export const MODUS_LABEL: Record<ModusOperandi, string> = {
  fence_cutting: "Fence cutting",
  gate_compromise: "Gate compromise",
  impersonation: "Impersonation",
  insider_assisted: "Insider-assisted access",
  battery_removal: "Battery removal",
  generator_theft: "Generator theft",
  diesel_siphoning: "Diesel siphoning",
  cable_cutting: "Cable cutting",
  solar_theft: "Solar theft",
  equipment_substitution: "Equipment substitution",
};

export const GRAPH_KIND_COLOR: Record<GraphNodeKind, string> = {
  person: "#ef4444",
  phone: "#f59e0b",
  vehicle: "#3b82f6",
  contractor: "#a855f7",
  site: "#22c55e",
  incident: "#f97316",
  asset: "#06b6d4",
  case: "#e2e8f0",
  dealer: "#ec4899",
  tool: "#94a3b8",
};

export const CASE_STAGE_LABEL: Record<CaseStage, string> = {
  investigation: "Investigation",
  arrest: "Arrest",
  charge: "Charge",
  prosecution: "Prosecution",
  hearing: "Hearing",
  judgment: "Judgment",
  sentence: "Sentence",
  appeal: "Appeal",
  closed: "Closed",
};

export const EVIDENCE_KIND_LABEL: Record<EvidenceKind, string> = {
  video: "Video",
  image: "Image",
  sensor_log: "Sensor log",
  access_log: "Access log",
  statement: "Statement",
  document: "Document",
  forensic: "Forensic record",
  gps_track: "GPS track",
};

/** Ticking clock for live countdowns; one interval per component. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
