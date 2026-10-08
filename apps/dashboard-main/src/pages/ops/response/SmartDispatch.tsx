import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BrainCircuit, CheckCircle2, Loader2, ShieldCheck, UserCheck } from "lucide-react";
import { useAuth } from "@tower-guard/hooks";
import { Panel } from "@/components/ops/Panel";
import { Pill } from "@/components/ops/Pill";
import {
  INCIDENT_STATUS_LABEL, SEVERITY_COLOR, approveDispatch, fetchRecommendation, fmtDuration, fmtTime, useOps,
  type DispatchRecommendation, type Incident,
} from "@/lib/ops";
import { SlaMini } from "./SlaBits";

export interface DispatchApproval {
  incidentId: string;
  teamId: string;
  callsign: string;
  approvedBy: string;
  at: string;
  override: boolean;
}

interface SmartDispatchProps {
  awaiting: Incident[];
  preferredId?: string;
  approvals: DispatchApproval[];
  onApproved: (a: DispatchApproval) => void;
}

const DEMO_ID = "INC-2026-10495";

/** ITIPS recommends the closest compliant team; an authorised officer approves. */
export function SmartDispatch({ awaiting, preferredId, approvals, onApproved }: SmartDispatchProps) {
  const pick = (id?: string) => (id && awaiting.some((i) => i.id === id) ? id : undefined);
  const [chosenInc, setChosenInc] = useState<string | undefined>(undefined);
  const incId = pick(chosenInc) ?? pick(preferredId) ?? pick(DEMO_ID) ?? awaiting[0]?.id;
  const inc = awaiting.find((i) => i.id === incId);

  return (
    <Panel title="Smart dispatch" icon={BrainCircuit} actions={<span className="hud-chip">{awaiting.length} awaiting</span>}>
      <p className="mb-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-muted-foreground">
        <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-primary" />
        ITIPS <span className="text-foreground">recommends</span>; an authorised NOC officer <span className="text-foreground">decides</span>. No team is dispatched without explicit human approval, recorded with name and time.
      </p>
      {awaiting.length === 0 ? (
        <p className="text-xs text-muted-foreground">No incidents are awaiting dispatch.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {awaiting.map((i) => (
              <button key={i.id} onClick={() => setChosenInc(i.id)}
                className={`rounded-md border px-2 py-1 text-left ${i.id === incId ? "border-primary bg-primary/15" : "border-primary/15 hover:border-primary/40"}`}>
                <span className="block font-mono text-[10px] text-primary">{i.id}</span>
                <span className="block text-[10px]" style={{ color: SEVERITY_COLOR[i.severity] }}>{i.title}</span>
              </button>
            ))}
          </div>
          {inc && <Recommendation key={inc.id} inc={inc} onApproved={onApproved} />}
        </>
      )}
      {approvals.length > 0 && (
        <div className="mt-4 border-t border-primary/10 pt-3">
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1.5">Approval log (this session)</p>
          <ul className="space-y-1">
            {approvals.map((a) => (
              <li key={`${a.incidentId}-${a.at}`} className="flex flex-wrap items-center gap-2 text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                <Link to={`/response?incident=${a.incidentId}`} className="font-mono text-primary hover:underline">{a.incidentId}</Link>
                <span className="text-foreground">{a.callsign}</span>
                {a.override && <Pill color="#f59e0b">Operator override</Pill>}
                <span className="ml-auto text-muted-foreground">approved by <span className="text-foreground">{a.approvedBy}</span> · <span className="font-mono">{fmtTime(a.at)}</span></span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

function Recommendation({ inc, onApproved }: { inc: Incident; onApproved: (a: DispatchApproval) => void }) {
  const { applyDispatch, team } = useOps();
  const { user } = useAuth();
  const [rec, setRec] = useState<DispatchRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [approver, setApprover] = useState(user?.full_name ?? "");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchRecommendation(inc.id)
      .then((r) => { if (!cancelled) { setRec(r); setError(r ? null : "No compliant team available — escalate to cluster manager."); } })
      .catch(() => { if (!cancelled) setError("Recommendation service unavailable."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [inc.id]);

  const options = rec ? [{ teamId: rec.teamId, callsign: rec.callsign, distanceKm: rec.distanceKm, etaSeconds: rec.etaSeconds }, ...rec.alternatives] : [];
  const selected = options.find((o) => o.teamId === (choice ?? rec?.teamId));
  const override = !!rec && !!selected && selected.teamId !== rec.teamId;

  const approve = async () => {
    if (!selected || !approver.trim() || !confirmed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await approveDispatch(inc.id, selected.teamId, approver.trim());
      const t = team(selected.teamId) ?? res.team;
      applyDispatch({
        incident: {
          ...res.incident,
          response: { ...res.incident.response, distanceKm: selected.distanceKm, predictedEtaSec: selected.etaSeconds, gpsTrack: [t.location] },
        },
        team: res.team,
      });
      onApproved({ incidentId: inc.id, teamId: selected.teamId, callsign: selected.callsign, approvedBy: approver.trim(), at: new Date().toISOString(), override });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dispatch failed");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link to={`/incidents/${inc.id}`} className="font-mono text-[12px] text-primary hover:underline">{inc.id}</Link>
        <span className="text-[12px] font-semibold text-foreground">{inc.title}</span>
        <span className="text-[11px] text-muted-foreground">{inc.siteName} · {inc.state}</span>
        <Pill color="#f59e0b">{INCIDENT_STATUS_LABEL[inc.status]}</Pill>
        <span className="ml-auto text-[10px] text-muted-foreground">SLA <SlaMini inc={inc} /></span>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-[11px] text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Scoring available armed teams…</p>
      ) : rec && selected ? (
        <>
          <div className="rounded-md border border-success/40 bg-success/5 p-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-success">ITIPS recommendation</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <Link to={`/response?team=${rec.teamId}`} className="text-[15px] font-bold text-foreground hover:text-primary">{rec.callsign}</Link>
              <span className="font-mono text-[12px] text-muted-foreground">{rec.distanceKm} km</span>
              <span className="font-mono text-[12px] text-primary">ETA {fmtDuration(rec.etaSeconds)}</span>
            </div>
            <ul className="mt-2 space-y-0.5">
              {rec.rationale.map((r) => <li key={r} className="text-[11px] text-foreground/90">• {r}</li>)}
            </ul>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-[9px] uppercase tracking-[0.14em] text-muted-foreground border-b border-primary/10">
                  <th className="py-1.5 pr-2 font-medium" />
                  <th className="py-1.5 pr-2 font-medium">Team</th><th className="py-1.5 pr-2 font-medium">Distance</th>
                  <th className="py-1.5 pr-2 font-medium">ETA</th><th className="py-1.5 font-medium">Why not top</th>
                </tr>
              </thead>
              <tbody>
                {options.map((o, k) => (
                  <tr key={o.teamId} onClick={() => setChoice(o.teamId)}
                    className={`cursor-pointer border-b border-primary/5 ${o.teamId === selected.teamId ? "bg-primary/10" : "hover:bg-primary/5"}`}>
                    <td className="py-1.5 pr-2"><input type="radio" readOnly checked={o.teamId === selected.teamId} className="accent-[hsl(var(--primary))]" /></td>
                    <td className="py-1.5 pr-2 font-semibold text-foreground">{o.callsign}</td>
                    <td className="py-1.5 pr-2 font-mono">{o.distanceKm} km</td>
                    <td className="py-1.5 pr-2 font-mono">{fmtDuration(o.etaSeconds)}</td>
                    <td className="py-1.5 text-muted-foreground">{k === 0 ? <span className="text-success">Recommended</span> : rec.alternatives[k - 1].reasonNotTop}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-md border border-warning/40 bg-warning/5 p-3 space-y-2">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground"><UserCheck className="h-4 w-4 text-warning" />Human approval required</p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground" htmlFor="approver">Approving officer</label>
              <input id="approver" value={approver} onChange={(e) => setApprover(e.target.value)} placeholder="Full name"
                className="h-8 min-w-[180px] flex-1 rounded-md border border-primary/25 bg-background/60 px-2 text-[12px] text-foreground outline-none focus:border-primary" />
            </div>
            <label className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 accent-[hsl(var(--primary))]" />
              I am authorised to dispatch armed response and approve sending <span className="text-foreground font-semibold">{selected.callsign}</span> to {inc.siteName}.
              {override && <span className="text-warning"> (override of ITIPS recommendation)</span>}
            </label>
            <button onClick={approve} disabled={busy || !approver.trim() || !confirmed}
              className="w-full rounded-md bg-primary px-4 py-2 text-[12px] font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed">
              {busy ? "Dispatching…" : `Approve dispatch · ${selected.callsign}`}
            </button>
          </div>
        </>
      ) : null}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
