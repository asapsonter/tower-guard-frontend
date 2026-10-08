import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bot, ListOrdered, Map as MapIcon, Radio, Search, Users } from "lucide-react";
import { PageHeader, Panel } from "@/components/cnii/Panel";
import { Pill } from "@/components/cnii/Pill";
import { SlaCountdown } from "@/components/cnii/SlaCountdown";
import {
  INCIDENT_TYPE_LABEL, SEVERITY_COLOR, UNIT_STATUS_COLOR, UNIT_STATUS_LABEL, fetchRecommendation, useCnii, type UnitStatus,
} from "@/lib/cnii";
import { AWAITING_DISPATCH, SEVERITY_RANK, placeName } from "./incident/roomUtils";
import { DispatchMap } from "./dispatch/DispatchMap";
import { RecommendationPanel, type RecState } from "./dispatch/RecommendationPanel";
import { UnitBoard } from "./dispatch/UnitBoard";
import { UNIT_STATUS_ORDER, roadKm } from "./dispatch/dispatchUtils";

export default function DispatchCommand() {
  const { snap } = useCnii();
  const [params, setParams] = useSearchParams();
  const incidentId = params.get("incident") ?? undefined;
  const focusId = params.get("focus") ?? params.get("unit") ?? undefined;

  const [statusFilter, setStatusFilter] = useState<Set<UnitStatus>>(new Set());
  const [query, setQuery] = useState("");
  const [rec, setRec] = useState<RecState>({ loading: false, rec: null, error: null });
  const [approvals, setApprovals] = useState<Record<string, { unitId: string; by: string }>>({});

  const selected = incidentId ? snap?.incidents.find((i) => i.id === incidentId) : undefined;
  const selectedAwaiting = selected ? AWAITING_DISPATCH(selected) : false;

  // Fetch the ITIPS recommendation whenever an awaiting incident is selected.
  useEffect(() => {
    if (!incidentId || !selectedAwaiting) { setRec({ loading: false, rec: null, error: null }); return; }
    let cancelled = false;
    setRec({ loading: true, rec: null, error: null });
    fetchRecommendation(incidentId)
      .then((r) => { if (!cancelled) setRec({ loading: false, rec: r, error: null }); })
      .catch((e: unknown) => { if (!cancelled) setRec({ loading: false, rec: null, error: e instanceof Error ? e.message : "Recommendation failed" }); });
    return () => { cancelled = true; };
  }, [incidentId, selectedAwaiting]);

  const queue = useMemo(() => (snap?.incidents ?? [])
    .filter(AWAITING_DISPATCH)
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.detectedAt.localeCompare(b.detectedAt)),
  [snap]);

  const counts = useMemo(() => {
    const c = Object.fromEntries(UNIT_STATUS_ORDER.map((s) => [s, 0])) as Record<UnitStatus, number>;
    snap?.units.forEach((u) => { c[u.status] += 1; });
    return c;
  }, [snap]);

  const units = useMemo(() => {
    if (!snap) return [];
    const q = query.trim().toLowerCase();
    const list = snap.units.filter((u) =>
      (statusFilter.size === 0 || statusFilter.has(u.status)) &&
      (!q || `${u.callsign} ${u.state} ${u.commander.name} ${u.vehicle.plate}`.toLowerCase().includes(q)));
    return selected
      ? list.sort((a, b) => roadKm(a.location, selected.location) - roadKm(b.location, selected.location))
      : list.sort((a, b) => UNIT_STATUS_ORDER.indexOf(a.status) - UNIT_STATUS_ORDER.indexOf(b.status) || a.callsign.localeCompare(b.callsign));
  }, [snap, statusFilter, query, selected]);

  if (!snap) return null;

  const approval = incidentId ? approvals[incidentId] ?? null : null;
  const recommendedId = approval?.unitId ?? (selectedAwaiting ? rec.rec?.unitId : selected?.respondingUnitId ?? undefined);
  const respondingUnit = selected?.respondingUnitId ? snap.units.find((u) => u.id === selected.respondingUnitId) : undefined;

  const setParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };
  const toggleStatus = (s: UnitStatus) => setStatusFilter((prev) => {
    const next = new Set(prev);
    if (next.has(s)) next.delete(s); else next.add(s);
    return next;
  });

  return (
    <>
      <PageHeader title="Dispatch & Response Command" icon={Radio}
        subtitle={`${snap.units.length} participating response units · ${queue.length} incidents awaiting dispatch`}
        actions={
          <span className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary">
            <Bot className="h-3.5 w-3.5" /> AI recommends; authorised officers command.
          </span>
        } />

      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setStatusFilter(new Set())}
          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusFilter.size === 0 ? "border-primary bg-primary/20 text-primary" : "border-primary/20 text-muted-foreground hover:text-foreground"}`}>
          All <span className="font-mono">{snap.units.length}</span>
        </button>
        {UNIT_STATUS_ORDER.map((s) => {
          const on = statusFilter.has(s);
          const color = UNIT_STATUS_COLOR[s];
          return (
            <button key={s} onClick={() => toggleStatus(s)}
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold"
              style={{ borderColor: on ? color : `${color}55`, background: on ? `${color}33` : "transparent", color: on ? color : undefined }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
              {UNIT_STATUS_LABEL[s]} <span className="font-mono">{counts[s]}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Dispatch queue" icon={ListOrdered} className="col-span-12 lg:col-span-4 xl:col-span-3"
          actions={<span className="hud-chip">{queue.length}</span>} bodyClassName="p-2">
          {queue.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">No incidents awaiting dispatch.</p>
          ) : (
            <ul className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
              {queue.map((inc) => {
                const sel = inc.id === incidentId;
                return (
                  <li key={inc.id}>
                    <button onClick={() => setParam("incident", inc.id)}
                      className={`w-full text-left rounded-md border px-2.5 py-2 transition-colors ${sel ? "border-primary/60 bg-primary/10" : "border-primary/10 hover:border-primary/30"}`}
                      style={{ boxShadow: `inset 3px 0 0 ${SEVERITY_COLOR[inc.severity]}` }}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-primary">{inc.id}</span>
                        <Pill color={SEVERITY_COLOR[inc.severity]} className="ml-auto uppercase">{inc.severity}</Pill>
                      </div>
                      <p className="text-[12px] font-semibold text-foreground truncate">{INCIDENT_TYPE_LABEL[inc.type]}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{placeName(inc)} · {inc.threatSummary.split(" — ")[0]}</p>
                      <div className="mt-1 flex items-end justify-between">
                        <span className="text-[10px] text-warning capitalize">{inc.status}</span>
                        <SlaCountdown alertAt={inc.response.stages.alert ?? inc.detectedAt} slaSeconds={inc.response.slaSeconds} />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Response unit map" icon={MapIcon} className="col-span-12 lg:col-span-8 xl:col-span-5" bodyClassName="p-3">
          <DispatchMap units={units} queue={queue} selected={selected} recommendedId={recommendedId} focusId={focusId}
            onSelectIncident={(id) => setParam("incident", id)} onSelectUnit={(id) => setParam("focus", id)} />
        </Panel>

        <div className="col-span-12 xl:col-span-4">
          <RecommendationPanel incident={selected} state={rec} respondingUnit={respondingUnit} approval={approval}
            onApproved={(unitId, by) => incidentId && setApprovals((a) => ({ ...a, [incidentId]: { unitId, by } }))} />
        </div>

        <Panel title="Response units" icon={Users} className="col-span-12" bodyClassName="p-0"
          actions={
            <label className="flex items-center gap-1.5 rounded-md border border-primary/20 px-2 py-1">
              <Search className="h-3 w-3 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Callsign, state, commander…"
                className="w-40 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground" />
            </label>
          }>
          <p className="px-4 pt-2 text-[10px] text-muted-foreground">
            {selected ? <>Distance and ETA to <span className="font-mono text-foreground">{selected.id}</span> (road estimate, turnout included). </> : "Select an incident to see distance and ETA per unit. "}
            Click a row for crew and equipment checklist.
          </p>
          <UnitBoard units={units} snap={snap} selected={selected} recommendedId={recommendedId} focusId={focusId} />
        </Panel>
      </div>
    </>
  );
}
