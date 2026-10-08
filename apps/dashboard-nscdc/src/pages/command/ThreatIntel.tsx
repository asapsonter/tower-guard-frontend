import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import {
  BrainCircuit, Clock, Crosshair, Filter, Flame, Info, LineChart as LineIcon, Map as MapIcon, Radar, Route, ShieldAlert, X,
} from "lucide-react";
import { Panel, PageHeader } from "@/components/cnii/Panel";
import { Meter, Pill } from "@/components/cnii/Pill";
import {
  INCIDENT_TYPE_COLOR, INCIDENT_TYPE_LABEL, MODUS_LABEL, useCnii, useNow,
  type GeoPoint, type IncidentType, type ModusOperandi, type Operator,
} from "@/lib/cnii";
import { NIGERIA_BOUNDS } from "./national/scope";
import { riskColor } from "./national/layers";
import { ThreatMap } from "./threat/ThreatMap";
import { PredictionCard, type Decision } from "./threat/PredictionCard";
import { HourHeatmap } from "./threat/HourHeatmap";
import {
  CORRIDOR_BUFFER_KM, EMPTY_FILTERS, boxAround, countBy, dailyTrend, filterIncidents, haversineKm, hourProfile, type ThreatFilters,
} from "./threat/analytics";

const DECISIONS_KEY = "cnii.threat.decisions";
const OFFICER = "Duty Officer";
const OPERATORS: Operator[] = ["MTN", "Airtel", "Glo", "9mobile", "IHS Towers", "American Tower"];
const TREND_LABEL = { rising: "▲ Rising", stable: "■ Stable", falling: "▼ Falling" } as const;
const TREND_COLOR = { rising: "#ef4444", stable: "#eab308", falling: "#22c55e" } as const;

const chartTick = { fill: "hsl(var(--muted-foreground))", fontSize: 10 };
const chartTooltip = { background: "hsl(var(--card))", border: "1px solid hsl(var(--primary) / 0.3)", fontSize: 11 };

function loadDecisions(): Record<string, Decision> {
  try {
    return JSON.parse(localStorage.getItem(DECISIONS_KEY) ?? "{}") as Record<string, Decision>;
  } catch {
    return {};
  }
}

export default function ThreatIntel() {
  const { snap } = useCnii();
  const now = useNow(60_000);
  const [params, setParams] = useSearchParams();
  const focusId = params.get("focus");
  const [f, setF] = useState<ThreatFilters>(EMPTY_FILTERS);
  const [decisions, setDecisions] = useState<Record<string, Decision>>(loadDecisions);

  useEffect(() => {
    try { localStorage.setItem(DECISIONS_KEY, JSON.stringify(decisions)); } catch { /* storage unavailable */ }
  }, [decisions]);

  const set = useCallback(<K extends keyof ThreatFilters>(k: K, v: ThreatFilters[K]) => {
    setF((prev) => ({ ...prev, [k]: v, ...(k === "state" ? { lga: "" } : {}) }));
  }, []);

  const focus = (id: string) => {
    const p = new URLSearchParams(params);
    if (focusId === id) p.delete("focus"); else p.set("focus", id);
    setParams(p, { replace: true });
  };

  const decide = (key: string, status: Decision["status"] | null) =>
    setDecisions((d) => {
      const next = { ...d };
      if (status) next[key] = { status, at: new Date().toISOString(), by: OFFICER };
      else delete next[key];
      return next;
    });

  const data = useMemo(() => {
    if (!snap) return null;
    const filtered = filterIncidents(snap, f, now);
    const trendSet = filterIncidents(snap, { ...f, days: 90 }, now);
    const lgas = [...new Set(snap.incidents.filter((i) => !f.state || i.state === f.state).map((i) => i.lga))].sort();
    const states = [...snap.riskCells].sort((a, b) => a.state.localeCompare(b.state)).map((c) => c.state);
    return {
      filtered,
      trend: dailyTrend(trendSet, now, 90),
      lgas,
      states,
      byType: countBy(filtered, (i) => i.type),
      byOperator: countBy(filtered, (i) => i.operator),
      byModus: countBy(filtered, (i) => i.modusOperandi),
      byLga: countBy(filtered, (i) => `${i.lga}|${i.state}`),
      hours: hourProfile(filtered),
    };
  }, [snap, f, now]);

  if (!snap || !data) return null;

  const prediction = snap.predictions.find((p) => p.id === focusId);
  const hotspot = snap.hotspots.find((h) => h.id === focusId);
  const corridor = snap.corridors.find((c) => c.id === f.corridor);
  const stateCmd = snap.stateCommands.find((s) => s.state === f.state);

  let fitTo: GeoPoint[] = NIGERIA_BOUNDS;
  if (prediction) fitTo = boxAround(prediction.location, 45);
  else if (hotspot) fitTo = boxAround(hotspot.location, Math.max(15, hotspot.radiusKm * 2.5));
  else if (corridor) fitTo = corridor.path;
  else if (stateCmd) fitTo = [...boxAround(stateCmd.location, 70), ...stateCmd.areaCommands.map((a) => a.location)];

  const heatRows = [
    { label: "Filtered selection", values: data.hours, highlight: true },
    ...[...snap.riskCells]
      .filter((c) => !f.state || c.state === f.state)
      .sort((a, b) => b.risk - a.risk)
      .slice(0, f.state ? 1 : 10)
      .map((c) => ({ label: `${c.state} · ${c.risk}`, values: c.byHour, onClick: () => set("state", c.state === f.state ? "" : c.state) })),
  ];

  const activeFilters = (Object.keys(f) as (keyof ThreatFilters)[]).filter((k) => k !== "days" && f[k]);
  const critical = data.filtered.filter((i) => i.severity === "critical").length;
  const armed = data.filtered.filter((i) => i.type === "armed_intrusion" || i.weaponSuspected).length;
  const peakHour = data.hours.indexOf(Math.max(...data.hours));
  const pendingRecs = snap.predictions.reduce((s, p) => s + p.recommendations.filter((_, i) => !decisions[`${p.id}#${i}`]).length, 0);

  return (
    <>
      <PageHeader
        title="National Threat Intelligence"
        subtitle="Predictive deployment — converting accumulated CNII incident data into preventive operations"
        icon={Radar}
        actions={
          <>
            <span className="hud-chip"><BrainCircuit className="h-3 w-3" /> AI recommends · officers command</span>
            <span className="hud-chip">{pendingRecs} actions awaiting decision</span>
          </>
        }
      />

      <Panel icon={Filter} title="Threat filters" bodyClassName="p-3"
        actions={activeFilters.length > 0 && (
          <button onClick={() => setF((p) => ({ ...EMPTY_FILTERS, days: p.days }))} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary">
            <X className="h-3 w-3" /> Clear {activeFilters.length}
          </button>
        )}>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
          <FilterSelect label="State" value={f.state} onChange={(v) => set("state", v)} options={data.states.map((s) => [s, s])} />
          <FilterSelect label="LGA" value={f.lga} onChange={(v) => set("lga", v)} options={data.lgas.map((l) => [l, l])} />
          <FilterSelect label="Corridor" value={f.corridor} onChange={(v) => set("corridor", v)} options={snap.corridors.map((c) => [c.id, c.name])} />
          <FilterSelect label="Operator" value={f.operator} onChange={(v) => set("operator", v as Operator | "")} options={OPERATORS.map((o) => [o, o])} />
          <FilterSelect label="Asset / incident type" value={f.type} onChange={(v) => set("type", v as IncidentType | "")}
            options={(Object.keys(INCIDENT_TYPE_LABEL) as IncidentType[]).map((t) => [t, INCIDENT_TYPE_LABEL[t]])} />
          <FilterSelect label="Modus operandi" value={f.modus} onChange={(v) => set("modus", v as ModusOperandi | "")}
            options={(Object.keys(MODUS_LABEL) as ModusOperandi[]).map((m) => [m, MODUS_LABEL[m]])} />
          <FilterSelect label="Time window" value={String(f.days)} onChange={(v) => set("days", Number(v))} allowAll={false}
            options={[["7", "Last 7 days"], ["30", "Last 30 days"], ["90", "Last 90 days"]]} />
        </div>
        {corridor && <p className="mt-2 text-[10px] text-muted-foreground">Corridor filter includes incidents within {CORRIDOR_BUFFER_KM} km of the {corridor.name}.</p>}
      </Panel>

      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-12 xl:col-span-8" icon={MapIcon} title="CNII threat map"
          actions={<span className="text-[10px] text-muted-foreground font-mono">{data.filtered.length} incidents · {snap.hotspots.length} hotspots · {snap.corridors.length} corridors</span>}
          bodyClassName="p-2">
          <ThreatMap
            riskCells={snap.riskCells}
            stateCommands={snap.stateCommands}
            corridors={snap.corridors}
            hotspots={snap.hotspots}
            incidents={data.filtered}
            predictions={snap.predictions}
            selectedId={focusId}
            selectedState={f.state}
            selectedCorridor={f.corridor}
            fitTo={fitTo}
            onState={(s) => set("state", s)}
            onCorridor={(id) => set("corridor", id)}
            onFocus={focus}
          />
        </Panel>

        <div className="col-span-12 xl:col-span-4 flex flex-col gap-4 min-w-0">
          <Panel icon={Crosshair} title={prediction ? `Focus · ${prediction.id}` : hotspot ? `Focus · ${hotspot.id}` : "Selection summary"}
            actions={(prediction || hotspot) && (
              <button onClick={() => focus(focusId!)} className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1"><X className="h-3 w-3" /> Clear focus</button>
            )}>
            {prediction ? (
              <FocusSummary title={prediction.headline} sub={prediction.region}
                nearby={snap.incidents.filter((i) => haversineKm(i.location, prediction.location) <= 30 && now - new Date(i.detectedAt).getTime() <= 90 * 86_400_000).length}
                radiusLabel="30 km · 90 days"
                extra={<Pill color="#e879f9">Confidence {Math.round(prediction.confidence * 100)}%</Pill>} />
            ) : hotspot ? (
              <FocusSummary title={hotspot.name} sub={`Dominant: ${INCIDENT_TYPE_LABEL[hotspot.dominantType]} · radius ${hotspot.radiusKm} km`}
                nearby={hotspot.incidents90d} radiusLabel="hotspot · 90 days"
                extra={<Pill color={INCIDENT_TYPE_COLOR[hotspot.dominantType]}>Hotspot</Pill>} />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Incidents" value={data.filtered.length} />
                <Stat label="Critical" value={critical} tone={critical ? "text-destructive" : undefined} />
                <Stat label="Armed / weapon" value={armed} tone={armed ? "text-warning" : undefined} />
                <Stat label="Peak hour (WAT)" value={data.filtered.length ? `${String(peakHour).padStart(2, "0")}:00` : "—"} />
                <Stat label="Top LGA" value={data.byLga[0]?.key.split("|")[0] ?? "—"} small />
                <Stat label="Top operator" value={data.byOperator[0]?.key ?? "—"} small />
                <Stat label="Top modus" value={data.byModus[0] ? MODUS_LABEL[data.byModus[0].key] : "—"} small className="col-span-2" />
              </div>
            )}
          </Panel>

          <Panel icon={Route} title="High-risk corridors" bodyClassName="p-2">
            <ul className="space-y-1">
              {[...snap.corridors].sort((a, b) => b.risk - a.risk).map((c) => (
                <li key={c.id}>
                  <button onClick={() => set("corridor", f.corridor === c.id ? "" : c.id)}
                    className={`w-full rounded-md px-2 py-1.5 text-left transition-colors ${f.corridor === c.id ? "bg-primary/15" : "hover:bg-primary/5"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] truncate flex-1">{c.name}</span>
                      <span className="text-[10px] font-mono" style={{ color: TREND_COLOR[c.trend] }}>{TREND_LABEL[c.trend]}</span>
                      <span className="w-8 text-right font-mono tabular-nums text-[12px]" style={{ color: riskColor(c.risk) }}>{c.risk}</span>
                    </div>
                    <Meter value={c.risk} color={riskColor(c.risk)} className="mt-1" />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel icon={Flame} title="Hotspots" bodyClassName="p-2">
            <ul className="space-y-0.5">
              {[...snap.hotspots].sort((a, b) => b.incidents90d - a.incidents90d).map((h) => (
                <li key={h.id}>
                  <button onClick={() => focus(h.id)} className={`w-full flex items-center gap-2 rounded-md px-2 py-1 text-left ${focusId === h.id ? "bg-primary/15" : "hover:bg-primary/5"}`}>
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: INCIDENT_TYPE_COLOR[h.dominantType] }} />
                    <span className="text-[11px] truncate flex-1">{h.name}</span>
                    <span className="font-mono tabular-nums text-[11px] text-muted-foreground">{h.incidents90d}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel icon={BrainCircuit} title="Predictive outputs · risk-based recommendations"
        actions={<span className="text-[10px] text-muted-foreground">{snap.predictions.length} active predictions</span>}>
        <div className="mb-3 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-[11px]">
          <Info className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p>
            These are <b>probabilistic risk indicators</b> derived from historical incident patterns, not deterministic findings or accusations.
            No action is taken until an authorised officer approves it. Decisions are recorded locally against the duty officer and time (WAT).
          </p>
        </div>
        {snap.predictions.length === 0 ? (
          <p className="text-[12px] text-muted-foreground text-center py-6">No active predictions.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3">
            {snap.predictions.map((p) => (
              <PredictionCard key={p.id} prediction={p} selected={focusId === p.id} decisions={decisions}
                onSelect={() => focus(p.id)} onDecide={(i, status) => decide(`${p.id}#${i}`, status)} />
            ))}
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-12 xl:col-span-7" icon={Clock} title="Time-of-day pattern · hour heatmap"
          actions={<span className="text-[10px] text-muted-foreground">State rows: 90-day risk cells</span>}>
          <HourHeatmap rows={heatRows} />
        </Panel>
        <Panel className="col-span-12 xl:col-span-5" icon={LineIcon} title="90-day incident trend"
          actions={<span className="text-[10px] text-muted-foreground">Daily · 7-day average</span>}>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.trend} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="hsl(var(--primary) / 0.1)" vertical={false} />
                <XAxis dataKey="label" tick={chartTick} interval={13} tickLine={false} />
                <YAxis tick={chartTick} allowDecimals={false} tickLine={false} />
                <RTooltip contentStyle={chartTooltip} labelStyle={{ color: "hsl(var(--foreground))" }} />
                <Bar dataKey="count" name="Incidents" fill="hsl(var(--primary) / 0.45)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="critical" name="Critical" fill="#ef4444" radius={[2, 2, 0, 0]} />
                <Line dataKey="ma7" name="7-day avg" stroke="#f97316" strokeWidth={2} dot={false} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <BreakdownPanel title="Asset / incident type" icon={ShieldAlert}
          rows={data.byType.map((r) => ({ id: r.key, label: INCIDENT_TYPE_LABEL[r.key], count: r.count, color: INCIDENT_TYPE_COLOR[r.key] }))}
          active={f.type} onPick={(id) => set("type", (f.type === id ? "" : id) as IncidentType | "")} />
        <BreakdownPanel title="Operator" icon={Radar}
          rows={data.byOperator.map((r) => ({ id: r.key, label: r.key, count: r.count }))}
          active={f.operator} onPick={(id) => set("operator", (f.operator === id ? "" : id) as Operator | "")} />
        <BreakdownPanel title="Modus operandi" icon={Crosshair}
          rows={data.byModus.map((r) => ({ id: r.key, label: MODUS_LABEL[r.key], count: r.count }))}
          active={f.modus} onPick={(id) => set("modus", (f.modus === id ? "" : id) as ModusOperandi | "")} />
        <BreakdownPanel title="Top LGAs" icon={MapIcon}
          rows={data.byLga.slice(0, 10).map((r) => { const [lga, state] = r.key.split("|"); return { id: r.key, label: `${lga}, ${state}`, count: r.count }; })}
          active={f.lga && f.state ? `${f.lga}|${f.state}` : ""}
          onPick={(id) => {
            const [lga, state] = id.split("|");
            if (f.lga === lga) set("lga", "");
            else setF((p) => ({ ...p, state, lga }));
          }} />
      </div>
    </>
  );
}

function FilterSelect({ label, value, onChange, options, allowAll = true }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][]; allowAll?: boolean;
}) {
  return (
    <label className="min-w-0">
      <span className="block text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-md border bg-card/60 px-2 py-1.5 text-[12px] focus:outline-none focus:border-primary/60 ${value && allowAll ? "border-primary/50 text-primary" : "border-primary/20 text-foreground"}`}>
        {allowAll && <option value="">All</option>}
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function Stat({ label, value, tone, small, className = "" }: { label: string; value: ReactNode; tone?: string; small?: boolean; className?: string }) {
  return (
    <div className={`rounded-md border border-primary/10 px-2.5 py-1.5 min-w-0 ${className}`}>
      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={`${small ? "text-[12px] font-semibold truncate" : "text-lg font-bold font-mono tabular-nums"} ${tone ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}

function FocusSummary({ title, sub, nearby, radiusLabel, extra }: { title: string; sub: string; nearby: number; radiusLabel: string; extra: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">{extra}</div>
      <p className="text-[13px] font-semibold leading-snug">{title}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
      <Stat label={`Incidents · ${radiusLabel}`} value={nearby} />
    </div>
  );
}

function BreakdownPanel({ title, icon, rows, active, onPick }: {
  title: string; icon: typeof Radar; rows: { id: string; label: string; count: number; color?: string }[]; active: string; onPick: (id: string) => void;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Panel className="col-span-12 md:col-span-6 xl:col-span-3" icon={icon} title={title} bodyClassName="p-2">
      {rows.length === 0 ? (
        <p className="text-[11px] text-muted-foreground text-center py-6">No incidents match.</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((r) => (
            <li key={r.id}>
              <button onClick={() => onPick(r.id)} className={`w-full rounded-md px-2 py-1 text-left ${active === r.id ? "bg-primary/15" : "hover:bg-primary/5"}`}>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="truncate flex-1">{r.label}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">{r.count}</span>
                </div>
                <Meter value={(r.count / max) * 100} color={r.color ?? "hsl(var(--primary))"} className="mt-0.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
