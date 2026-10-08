import { useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from "recharts";
import { Banknote, Clock, Coins, LineChart as LineIcon, MapPinned, Radar, ShieldCheck, ShieldX, Swords, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader, Panel } from "@/components/ops/Panel";
import { Meter } from "@/components/ops/Pill";
import { INCIDENT_TYPE_COLOR, INCIDENT_TYPE_LABEL, fmtNaira, fmtNum, useOps, type IncidentType, type MonthlyImpact } from "@/lib/ops";
import { BusinessCase } from "./impact/BusinessCase";
import { LOSS_COLOR, LOSS_KEYS, LOSS_LABEL, breakdownBy, monthLabel, totalLoss } from "./impact/impactUtils";

const tick = { fill: "hsl(var(--muted-foreground))", fontSize: 10 };
const grid = "hsl(var(--primary) / 0.1)";
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--primary) / 0.3)", fontSize: 11 };
const nairaTick = (v: number) => fmtNaira(v);

type OutcomeKey = "intrusionsDetected" | "verifiedAttacks" | "attacksDisrupted" | "recoveredNaira" | "avoidedLossNaira" | "downtimeAvoidedHours";
const OUTCOMES: { key: OutcomeKey; label: string; icon: typeof Radar; color: string; fmt: (n: number) => string }[] = [
  { key: "intrusionsDetected", label: "Intrusions detected", icon: Radar, color: "#06b6d4", fmt: fmtNum },
  { key: "verifiedAttacks", label: "Verified attacks", icon: Swords, color: "#f97316", fmt: fmtNum },
  { key: "attacksDisrupted", label: "Attacks disrupted", icon: ShieldCheck, color: "#22c55e", fmt: fmtNum },
  { key: "recoveredNaira", label: "Assets recovered", icon: Coins, color: "#a855f7", fmt: fmtNaira },
  { key: "avoidedLossNaira", label: "Est. loss avoided", icon: Banknote, color: "#22c55e", fmt: fmtNaira },
  { key: "downtimeAvoidedHours", label: "Downtime avoided", icon: Clock, color: "#3b82f6", fmt: (n) => `${fmtNum(n)} h` },
];

export default function Impact() {
  const { snap } = useOps();
  const [breakdown, setBreakdown] = useState<"state" | "type">("state");

  const data = useMemo(() => (snap?.impact ?? []).map((m) => ({
    ...m, label: monthLabel(m.month), ...m.losses, total: totalLoss(m),
    disruptionRate: m.verifiedAttacks ? Math.round((m.attacksDisrupted / m.verifiedAttacks) * 100) : 0,
  })), [snap]);
  const byState = useMemo(() => breakdownBy(snap?.incidents ?? [], (i) => i.state), [snap]);
  const byType = useMemo(() => breakdownBy(snap?.incidents ?? [], (i) => i.type), [snap]);

  if (!snap) return null;
  const impact = snap.impact;
  if (impact.length === 0) {
    return <PageHeader title="Asset Loss & Business Impact" icon={Banknote} subtitle="No impact data for this period." />;
  }

  const sum = (f: (m: MonthlyImpact) => number) => impact.reduce((s, m) => s + f(m), 0);
  const lossTotals = LOSS_KEYS.map((k) => ({ key: k, value: sum((m) => m.losses[k]) }));
  const grand = lossTotals.reduce((s, x) => s + x.value, 0);
  const downtime = sum((m) => m.downtimeHours);
  const cur = impact[impact.length - 1];
  const prev = impact[impact.length - 2];
  const rows = breakdown === "state" ? byState : byType;
  const maxLoss = Math.max(1, ...rows.map((r) => r.loss));

  return (
    <>
      <PageHeader title="Asset Loss & Business Impact" icon={Banknote}
        subtitle="What vandalism cost, what ITIPS prevented, and what it is worth — the executive view"
        actions={<span className="hud-chip">{monthLabel(impact[0].month)} – {monthLabel(cur.month)} · {impact.length} months</span>} />

      <div>
        <p className="mb-1.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Prevented &amp; avoided · {impact.length}-month totals</p>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          {OUTCOMES.map((o) => {
            const total = sum((m) => m[o.key]);
            const delta = prev && prev[o.key] ? Math.round(((cur[o.key] - prev[o.key]) / prev[o.key]) * 100) : null;
            return (
              <div key={o.key} className="glass-panel px-3 pt-2.5 pb-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <o.icon className="h-3.5 w-3.5 shrink-0" style={{ color: o.color }} />
                  <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground truncate">{o.label}</p>
                </div>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">{o.fmt(total)}</p>
                <p className="text-[10px] text-muted-foreground">
                  This month {o.fmt(cur[o.key])}
                  {delta != null && <span className="ml-1 font-mono">{delta >= 0 ? "▲" : "▼"}{Math.abs(delta)}%</span>}
                </p>
                <div className="h-10 -mx-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
                      <defs>
                        <linearGradient id={`g-${o.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={o.color} stopOpacity={0.5} />
                          <stop offset="100%" stopColor={o.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey={o.key} stroke={o.color} strokeWidth={1.5} fill={`url(#g-${o.key})`} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Losses attributed to vandalism — monthly" icon={ShieldX} className="col-span-12 xl:col-span-8"
          actions={<span className="hud-chip">{fmtNaira(grand)} total</span>}>
          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 6 }}>
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis dataKey="label" tick={tick} />
                <YAxis yAxisId="n" tick={tick} tickFormatter={nairaTick} width={56} />
                <YAxis yAxisId="h" orientation="right" tick={tick} width={34} tickFormatter={(v) => `${v}h`} />
                <RTooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--primary) / 0.06)" }}
                  formatter={(v: number, name: string) => [name === "Downtime (h)" ? `${v} h` : fmtNaira(v), name]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {LOSS_KEYS.map((k, i) => (
                  <Bar key={k} yAxisId="n" dataKey={k} name={LOSS_LABEL[k]} stackId="loss" fill={LOSS_COLOR[k]} radius={i === LOSS_KEYS.length - 1 ? [3, 3, 0, 0] : undefined} />
                ))}
                <Line yAxisId="h" type="monotone" dataKey="downtimeHours" name="Downtime (h)" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Loss totals" icon={Coins} className="col-span-12 xl:col-span-4">
          <ul className="space-y-2">
            {lossTotals.map((x) => (
              <li key={x.key} className="text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: LOSS_COLOR[x.key] }} />
                  <span className="text-foreground">{LOSS_LABEL[x.key]}</span>
                  <span className="ml-auto font-mono tabular-nums text-foreground">{fmtNaira(x.value)}</span>
                </div>
                <Meter value={(x.value / Math.max(1, grand)) * 100} color={LOSS_COLOR[x.key]} className="mt-1" />
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-primary/10 pt-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Total loss</p>
              <p className="font-mono text-lg font-bold text-destructive">{fmtNaira(grand)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Downtime from vandalism</p>
              <p className="font-mono text-lg font-bold text-warning">{fmtNum(downtime)} h</p>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">Restoration expenditure covers crew call-outs, replacement logistics and re-commissioning attributed to vandalism downtime.</p>
        </Panel>

        <Panel title="Prevention trend — avoided vs realised loss" icon={LineIcon} className="col-span-12 lg:col-span-6">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 6 }}>
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis dataKey="label" tick={tick} />
                <YAxis yAxisId="n" tick={tick} tickFormatter={nairaTick} width={56} />
                <YAxis yAxisId="p" orientation="right" tick={tick} width={34} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <RTooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--primary) / 0.06)" }}
                  formatter={(v: number, name: string) => [name === "Disruption rate" ? `${v}%` : fmtNaira(v), name]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar yAxisId="n" dataKey="avoidedLossNaira" name="Est. loss avoided" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar yAxisId="n" dataKey="total" name="Realised loss" fill="#ef4444" fillOpacity={0.75} radius={[3, 3, 0, 0]} />
                <Bar yAxisId="n" dataKey="recoveredNaira" name="Recovered" fill="#a855f7" radius={[3, 3, 0, 0]} />
                <Line yAxisId="p" type="monotone" dataKey="disruptionRate" name="Disruption rate" stroke="#06b6d4" strokeWidth={2} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Disruption rate = attacks disrupted ÷ verified attacks. Avoided loss is estimated from the typical loss for each disrupted attack type.</p>
        </Panel>

        <BusinessCase impact={impact} financial={snap.scorecard.financial} sites={snap.sites.length} className="col-span-12 lg:col-span-6" />

        <Panel title={`Loss breakdown by ${breakdown === "state" ? "state" : "incident type"}`} icon={MapPinned} className="col-span-12" bodyClassName="p-0"
          actions={(
            <div className="flex gap-1">
              {(["state", "type"] as const).map((b) => (
                <button key={b} onClick={() => setBreakdown(b)}
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${breakdown === b ? "border-primary bg-primary/20 text-primary" : "border-primary/20 text-muted-foreground"}`}>
                  By {b === "state" ? "state" : "incident type"}
                </button>
              ))}
            </div>
          )}>
          <div className="grid grid-cols-12">
            <div className="col-span-12 lg:col-span-5 h-[320px] p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows.slice(0, 10).map((r) => ({ ...r, name: breakdown === "type" ? INCIDENT_TYPE_LABEL[r.key as IncidentType] : r.key }))} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid stroke={grid} horizontal={false} />
                  <XAxis type="number" tick={tick} tickFormatter={nairaTick} />
                  <YAxis type="category" dataKey="name" tick={tick} width={92} />
                  <RTooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--primary) / 0.06)" }} formatter={(v: number, name: string) => [fmtNaira(v), name]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="loss" name="Loss" fill="#ef4444" fillOpacity={0.8} radius={[0, 3, 3, 0]} />
                  <Bar dataKey="recovered" name="Recovered" fill="#a855f7" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="col-span-12 lg:col-span-7 overflow-x-auto max-h-[340px] overflow-y-auto border-t lg:border-t-0 lg:border-l border-primary/10">
              <table className="w-full min-w-[560px] text-[11px]">
                <thead className="sticky top-0 bg-card/95 backdrop-blur">
                  <tr className="text-left text-[9px] uppercase tracking-[0.14em] text-muted-foreground border-b border-primary/10">
                    <th className="px-3 py-2">{breakdown === "state" ? "State" : "Incident type"}</th>
                    <th className="px-2 py-2 text-right">Incidents</th>
                    <th className="px-2 py-2 w-40">Loss</th>
                    <th className="px-2 py-2 text-right">Recovered</th>
                    <th className="px-2 py-2 text-right">Recovery</th>
                    <th className="px-3 py-2 text-right">Downtime</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const color = breakdown === "type" ? INCIDENT_TYPE_COLOR[r.key as IncidentType] : "#ef4444";
                    const rate = r.loss ? Math.round((r.recovered / r.loss) * 100) : 0;
                    return (
                      <tr key={r.key} className="border-b border-primary/5 hover:bg-primary/5">
                        <td className="px-3 py-1.5 text-foreground">
                          {breakdown === "type" && <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: color }} />}
                          {breakdown === "type" ? INCIDENT_TYPE_LABEL[r.key as IncidentType] : r.key}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono tabular-nums">{r.incidents}</td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-14 text-right font-mono tabular-nums text-foreground">{fmtNaira(r.loss)}</span>
                            <Meter value={(r.loss / maxLoss) * 100} color={color} className="flex-1" />
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono tabular-nums text-foreground">{fmtNaira(r.recovered)}</td>
                        <td className={`px-2 py-1.5 text-right font-mono tabular-nums ${rate >= 25 ? "text-success" : "text-muted-foreground"}`}>
                          {rate >= 25 ? <TrendingUp className="mr-0.5 inline h-3 w-3" /> : <TrendingDown className="mr-0.5 inline h-3 w-3" />}{rate}%
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono tabular-nums">{fmtNum(Math.round(r.downtimeH))} h</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
