import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Gauge, ShieldCheck } from "lucide-react";
import { Panel } from "@/components/ops/Panel";
import { Meter } from "@/components/ops/Pill";
import { fmtClock, type Incident, type ResponseTeam } from "@/lib/ops";
import { breachBucket, claimGapMin } from "./sla";

const TICK = { fill: "hsl(var(--muted-foreground))", fontSize: 10 };
const TIP = { background: "hsl(var(--card))", border: "1px solid hsl(var(--primary) / 0.3)", fontSize: 11 };
const DAY = 86_400_000;

/** 30-day response SLA performance — compliance, breaches by reason and by team. */
export function SlaPerformance({ incidents, teams, generatedAt }: { incidents: Incident[]; teams: Map<string, ResponseTeam>; generatedAt: string }) {
  const stats = useMemo(() => {
    const since = Date.parse(generatedAt) - 30 * DAY;
    const rows = incidents.filter((i) => i.response.stages.arrived && Date.parse(i.detectedAt) >= since);
    const took = (i: Incident) => (Date.parse(i.response.stages.arrived!) - Date.parse(i.response.stages.alert ?? i.detectedAt)) / 1000;
    const times = rows.map(took).sort((a, b) => a - b);
    const breaches = rows.filter((i) => i.response.breached);
    const reasons = new Map<string, number>();
    for (const b of breaches) reasons.set(breachBucket(b.response.breachReason), (reasons.get(breachBucket(b.response.breachReason)) ?? 0) + 1);
    const byTeam = new Map<string, { n: number; breaches: number }>();
    for (const i of rows) {
      if (!i.teamId) continue;
      const e = byTeam.get(i.teamId) ?? { n: 0, breaches: 0 };
      e.n++;
      if (i.response.breached) e.breaches++;
      byTeam.set(i.teamId, e);
    }
    const bins = Array.from({ length: 16 }, (_, k) => ({ min: k * 2, label: `${k * 2}`, n: 0 }));
    for (const t of times) bins[Math.min(15, Math.floor(t / 120))].n++;
    return {
      n: rows.length,
      compliance: rows.length ? ((rows.length - breaches.length) / rows.length) * 100 : 0,
      avg: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      p90: times.length ? times[Math.floor(times.length * 0.9)] : 0,
      breaches: breaches.length,
      multiSource: rows.length ? (rows.filter((i) => i.response.arrivalVerifiedBy.length >= 2).length / rows.length) * 100 : 0,
      claimGaps: rows.filter((i) => (claimGapMin(i.response) ?? 0) > 0).length,
      reasons: [...reasons].map(([reason, n]) => ({ reason, n })).sort((a, b) => b.n - a.n),
      teams: [...byTeam].map(([id, e]) => ({ id, callsign: teams.get(id)?.callsign ?? id, ...e, pct: ((e.n - e.breaches) / e.n) * 100 }))
        .sort((a, b) => b.breaches - a.breaches || a.pct - b.pct).slice(0, 8),
      bins,
    };
  }, [incidents, teams, generatedAt]);

  const tone = stats.compliance >= 95 ? "text-success" : stats.compliance >= 85 ? "text-warning" : "text-destructive";

  return (
    <Panel title="SLA performance · last 30 days" icon={Gauge} actions={<span className="hud-chip">{stats.n} responses</span>}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Compliance</p><p className={`font-mono text-2xl font-bold ${tone}`}>{stats.compliance.toFixed(1)}%</p></div>
        <div><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Avg / P90</p><p className="font-mono text-2xl font-bold text-foreground">{fmtClock(stats.avg)}<span className="text-sm text-muted-foreground"> / {fmtClock(stats.p90)}</span></p></div>
        <div><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Breaches</p><p className="font-mono text-2xl font-bold text-destructive">{stats.breaches}</p></div>
        <div><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Claimed ≠ verified</p><p className="font-mono text-2xl font-bold text-warning">{stats.claimGaps}</p></div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Time to verified arrival (min)</p>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.bins} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--primary) / 0.1)" vertical={false} />
                <XAxis dataKey="label" tick={TICK} interval={1} />
                <YAxis tick={TICK} allowDecimals={false} />
                <Tooltip contentStyle={TIP} cursor={{ fill: "hsl(var(--primary) / 0.08)" }} formatter={(v: number) => [v, "responses"]} labelFormatter={(l) => `${l}–${Number(l) + 2} min`} />
                <ReferenceLine x="20" stroke="#ef4444" strokeDasharray="4 3" label={{ value: "SLA", fill: "#ef4444", fontSize: 9, position: "top" }} />
                <Bar dataKey="n" radius={[2, 2, 0, 0]}>
                  {stats.bins.map((b) => <Cell key={b.min} fill={b.min >= 20 ? "#ef4444" : b.min >= 15 ? "#f59e0b" : "#22c55e"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Breaches by reason</p>
          {stats.reasons.length === 0 ? <p className="text-xs text-muted-foreground">No breaches in the period.</p> : (
            <ul className="space-y-1.5">
              {stats.reasons.map((r) => (
                <li key={r.reason}>
                  <div className="flex justify-between text-[11px]"><span className="text-foreground truncate">{r.reason}</span><span className="font-mono text-destructive">{r.n}</span></div>
                  <Meter value={(r.n / stats.reasons[0].n) * 100} color="#ef4444" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">By team (most breaches first)</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-left text-[9px] uppercase tracking-[0.14em] text-muted-foreground border-b border-primary/10">
                <th className="py-1 pr-2 font-medium">Team</th><th className="py-1 pr-2 font-medium">Responses</th><th className="py-1 pr-2 font-medium">Breaches</th><th className="py-1 font-medium w-1/3">Compliance</th>
              </tr>
            </thead>
            <tbody>
              {stats.teams.map((t) => (
                <tr key={t.id} className="border-b border-primary/5">
                  <td className="py-1 pr-2"><Link to={`/response?team=${t.id}`} className="text-foreground hover:text-primary">{t.callsign}</Link></td>
                  <td className="py-1 pr-2 font-mono">{t.n}</td>
                  <td className={`py-1 pr-2 font-mono ${t.breaches ? "text-destructive" : "text-muted-foreground"}`}>{t.breaches}</td>
                  <td className="py-1">
                    <div className="flex items-center gap-2"><Meter value={t.pct} color={t.pct >= 95 ? "#22c55e" : t.pct >= 80 ? "#f59e0b" : "#ef4444"} className="flex-1" /><span className="font-mono w-10 text-right">{Math.round(t.pct)}%</span></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3 text-[11px] text-muted-foreground flex gap-2">
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
        <p>
          Supports ATC's requirement that response arrival be <span className="text-foreground">independently verifiable</span> — GPS geofence, geo-tagged check-in, site access record and CCTV.
          {" "}<span className="font-mono text-foreground">{stats.multiSource.toFixed(0)}%</span> of arrivals in the period were confirmed by two or more independent sources; SLA is always measured on the verified, not the claimed, arrival.
        </p>
      </div>
    </Panel>
  );
}
