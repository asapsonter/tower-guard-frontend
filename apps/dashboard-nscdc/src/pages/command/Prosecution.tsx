import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, CheckCircle2, Clock, FileStack, Filter, Gavel, Hourglass, Scale, Search, TrendingDown, UserCheck, XCircle } from "lucide-react";
import type { CaseStage } from "@/lib/cnii";
import { CASE_STAGE_LABEL, fmtDate, fmtNaira, useCnii } from "@/lib/cnii";
import { PageHeader, Panel } from "@/components/cnii/Panel";
import { KpiTile } from "@/components/cnii/KpiTile";
import { Pill } from "@/components/cnii/Pill";
import { CaseDrawer } from "./prosecution/CaseDrawer";
import { COURT_STAGES, STAGE_COLOR, adjournmentReasons, buildFunnel, daysBetween } from "./prosecution/pipeline";

const tick = { fill: "hsl(var(--muted-foreground))", fontSize: 10 };
const tipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--primary) / 0.3)", fontSize: 11 };
const selectCls = "bg-secondary/50 border border-primary/20 rounded-md px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-primary/50";
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export default function Prosecution() {
  const { snap } = useCnii();
  const [stage, setStage] = useState<CaseStage | "all" | "active">("all");
  const [court, setCourt] = useState("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const funnel = useMemo(() => (snap ? buildFunnel(snap) : []), [snap]);
  const reasons = useMemo(() => (snap ? adjournmentReasons(snap.prosecutions) : []), [snap]);
  const courts = useMemo(() => [...new Set((snap?.prosecutions ?? []).map((p) => p.court))].sort(), [snap]);

  const rows = useMemo(() => {
    if (!snap) return [];
    const s = q.trim().toLowerCase();
    return snap.prosecutions
      .filter((p) => stage === "all" || (stage === "active" ? ["charge", "prosecution", "hearing", "judgment", "appeal"].includes(p.stage) : p.stage === stage))
      .filter((p) => court === "all" || p.court === court)
      .filter((p) => !s || [p.id, p.caseId, p.prosecutor, p.charge, ...p.defendants].some((x) => x.toLowerCase().includes(s)))
      .sort((a, b) => (a.nextHearing ?? "9999").localeCompare(b.nextHearing ?? "9999") || b.filedAt.localeCompare(a.filedAt));
  }, [snap, stage, court, q]);

  if (!snap) return null;

  const k = snap.prosecutionKpis;
  const pros = snap.prosecutions;
  const now = new Date(snap.generatedAt).getTime();
  const upcoming = pros
    .filter((p) => p.nextHearing && new Date(p.nextHearing).getTime() >= now && new Date(p.nextHearing).getTime() <= now + 30 * 86400_000)
    .sort((a, b) => a.nextHearing!.localeCompare(b.nextHearing!));
  const upcomingByDay = upcoming.reduce<Map<string, typeof upcoming>>((m, p) => { const d = fmtDate(p.nextHearing); m.set(d, [...(m.get(d) ?? []), p]); return m; }, new Map());
  const totalAdj = pros.reduce((s, p) => s + p.adjournments.length, 0);
  const heavyAdj = pros.filter((p) => p.adjournments.length >= 3).length;
  const step = (key: string) => funnel.find((f) => f.key === key)?.reached ?? 0;
  const maxReached = Math.max(1, ...funnel.map((f) => f.reached));
  const judged = pros.filter((p) => p.judgment && p.judgment !== "Reserved").length;
  const selected = pros.find((p) => p.id === openId) ?? null;

  const attrition = [
    { label: "Arrests → charged", value: pct(step("charge"), step("arrest")), note: `${step("arrest") - step("charge")} arrest cases not (yet) charged` },
    { label: "Charged → judgment delivered", value: pct(judged, step("charge")), note: `${step("charge") - judged} awaiting judgment` },
    { label: "Conviction rate (of judgments)", value: pct(k.convictions, judged), note: `${k.dismissed} dismissed` },
    { label: "Adjournments per case", value: null, display: (totalAdj / Math.max(1, pros.length)).toFixed(1), note: `${heavyAdj} cases adjourned 3+ times` },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Prosecution & Court Case Tracker" subtitle="From incident to judgment — why arrests are, or are not, becoming successful prosecutions" icon={Scale} />

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <KpiTile label="Arrests" value={k.arrests} icon={UserCheck} />
        <KpiTile label="Cases filed" value={k.casesFiled} icon={FileStack} />
        <KpiTile label="Active prosecutions" value={k.activeProsecutions} icon={Gavel} tone="text-primary" />
        <KpiTile label="Convictions" value={k.convictions} icon={CheckCircle2} tone="text-success" />
        <KpiTile label="Dismissed" value={k.dismissed} icon={XCircle} tone="text-destructive" />
        <KpiTile label="Pending" value={k.pending} icon={Hourglass} tone="text-warning" />
        <KpiTile label="Avg case duration" value={`${k.avgCaseDurationDays}d`} icon={Clock} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Case pipeline · Incident → Closure" icon={TrendingDown} className="col-span-12 xl:col-span-8">
          <div className="space-y-1.5">
            {funnel.map((f, i) => {
              const prev = funnel[i - 1];
              const conv = prev && !f.branch ? pct(f.reached, prev.reached) : null;
              return (
                <div key={f.key} className="grid grid-cols-[96px_1fr_150px] items-center gap-3 text-[11px]">
                  <span className={`text-right ${f.branch ? "text-muted-foreground italic" : "text-foreground"}`}>{f.label}</span>
                  <div className="relative h-6 rounded bg-secondary/40 overflow-hidden">
                    <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${(f.reached / maxReached) * 100}%`, background: f.branch ? "hsl(var(--primary) / 0.25)" : `linear-gradient(90deg, hsl(var(--primary) / 0.55), hsl(var(--primary) / 0.25))` }} />
                    <span className="absolute inset-y-0 left-2 flex items-center font-mono tabular-nums font-semibold text-foreground">{f.reached}</span>
                    {f.current != null && f.current > 0 && <span className="absolute inset-y-0 right-2 flex items-center text-[10px] text-muted-foreground">{f.current} currently here</span>}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {conv != null && <span className={`font-mono ${conv < 50 ? "text-destructive" : conv < 75 ? "text-warning" : "text-success"}`}>{conv}% carried · −{Math.max(0, prev!.reached - f.reached)}</span>}
                    {f.branch && <span>branch · {pct(f.reached, step("judgment"))}% of judgments</span>}
                    {f.hint && <span className="block">{f.hint}</span>}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">Bars show records that reached each stage; the right column shows how many carried over from the previous stage. Appeal and closure are branches after judgment.</p>
        </Panel>

        <Panel title="Attrition & delay drivers" icon={Filter} className="col-span-12 xl:col-span-4" bodyClassName="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {attrition.map((a) => (
              <div key={a.label} className="rounded-md bg-secondary/40 px-2.5 py-2">
                <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground leading-tight">{a.label}</p>
                <p className="font-mono text-lg font-bold tabular-nums text-foreground">{a.display ?? `${a.value}%`}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{a.note}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Top adjournment reasons ({totalAdj})</p>
            {reasons.length ? (
              <ResponsiveContainer width="100%" height={reasons.length * 30 + 10}>
                <BarChart data={reasons} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="hsl(var(--primary) / 0.1)" horizontal={false} />
                  <XAxis type="number" tick={tick} hide />
                  <YAxis type="category" dataKey="reason" tick={tick} width={150} />
                  <Tooltip contentStyle={tipStyle} cursor={{ fill: "hsl(var(--primary) / 0.06)" }} />
                  <Bar dataKey="count" name="Adjournments" fill="#f97316" radius={[0, 3, 3, 0]} label={{ position: "right", fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-xs text-muted-foreground">No adjournments recorded.</p>}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Court cases" icon={Gavel} className="col-span-12 xl:col-span-9" bodyClassName="p-0">
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-primary/10">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Case, defendant, prosecutor, charge…"
                className="w-full bg-secondary/50 border border-primary/20 rounded-md pl-8 pr-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50" />
            </div>
            <select value={stage} onChange={(e) => setStage(e.target.value as CaseStage | "all" | "active")} className={selectCls}>
              <option value="all">All stages</option>
              <option value="active">Active only</option>
              {COURT_STAGES.map((s) => <option key={s} value={s}>{CASE_STAGE_LABEL[s]}</option>)}
            </select>
            <select value={court} onChange={(e) => setCourt(e.target.value)} className={selectCls}>
              <option value="all">All courts</option>
              {courts.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground">{rows.length} cases</span>
          </div>
          <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground text-left">
                  {["Case", "Stage", "Prosecutor / court", "Charge", "Defendants", "Evidence", "Next hearing", "Adj.", "Judgment / sentence", "Recovered"].map((h) => (
                    <th key={h} className="px-3 py-2 font-normal whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} onClick={() => setOpenId(p.id)} className={`border-t border-primary/10 hover:bg-primary/5 cursor-pointer ${openId === p.id ? "bg-primary/10" : ""}`}>
                    <td className="px-3 py-1.5 whitespace-nowrap"><p className="font-mono text-foreground">{p.caseId}</p><p className="font-mono text-[10px] text-muted-foreground">{p.id} · {daysBetween(p.filedAt, snap.generatedAt)}d</p></td>
                    <td className="px-3 py-1.5"><Pill color={STAGE_COLOR[p.stage]}>{CASE_STAGE_LABEL[p.stage]}</Pill></td>
                    <td className="px-3 py-1.5 min-w-[160px]"><p className="text-foreground">{p.prosecutor}</p><p className="text-[10px] text-muted-foreground">{p.court}</p></td>
                    <td className="px-3 py-1.5 min-w-[200px] text-muted-foreground"><span className="line-clamp-2">{p.charge}</span></td>
                    <td className="px-3 py-1.5 min-w-[130px]">{p.defendants.slice(0, 2).join(", ")}{p.defendants.length > 2 && <span className="text-muted-foreground"> +{p.defendants.length - 2}</span>}</td>
                    <td className="px-3 py-1.5 font-mono tabular-nums">{p.evidenceSubmitted}</td>
                    <td className="px-3 py-1.5 font-mono whitespace-nowrap">{p.nextHearing ? fmtDate(p.nextHearing) : "—"}</td>
                    <td className="px-3 py-1.5 font-mono tabular-nums">
                      <span className={p.adjournments.length >= 3 ? "text-warning font-semibold" : ""} title={p.adjournments.map((a) => `${fmtDate(a.at)}: ${a.reason}`).join("\n")}>{p.adjournments.length}</span>
                    </td>
                    <td className="px-3 py-1.5 min-w-[130px]">
                      {p.judgment ? <p className={p.judgment === "Convicted" ? "text-success" : p.judgment.startsWith("Dismissed") ? "text-destructive" : "text-warning"}>{p.judgment}</p> : <span className="text-muted-foreground">—</span>}
                      {p.sentence && <p className="text-[10px] text-muted-foreground">{p.sentence}</p>}
                    </td>
                    <td className="px-3 py-1.5 font-mono tabular-nums whitespace-nowrap">{p.recoveredAssetsNaira ? fmtNaira(p.recoveredAssetsNaira) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <p className="text-xs text-muted-foreground p-4">No cases match the filters.</p>}
          </div>
        </Panel>

        <Panel title="Upcoming hearings · 30 days" icon={CalendarDays} className="col-span-12 xl:col-span-3" bodyClassName="p-3 max-h-[620px] overflow-y-auto"
          actions={<span className="font-mono text-[10px] text-muted-foreground">{upcoming.length}</span>}>
          {upcoming.length === 0 ? <p className="text-xs text-muted-foreground">No hearings scheduled in the next 30 days.</p> : (
            <div className="space-y-3">
              {[...upcomingByDay.entries()].map(([day, list]) => (
                <div key={day}>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1">
                    {new Date(list[0].nextHearing!).toLocaleDateString("en-GB", { timeZone: "Africa/Lagos", weekday: "short" })} · {day}
                  </p>
                  <ul className="space-y-1">
                    {list.map((p) => (
                      <li key={p.id}>
                        <button onClick={() => setOpenId(p.id)} className="w-full text-left rounded-md border border-primary/10 hover:border-primary/40 px-2 py-1.5 transition-colors">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-foreground truncate">{p.caseId}</span>
                            <Pill color={STAGE_COLOR[p.stage]} className="ml-auto">{CASE_STAGE_LABEL[p.stage]}</Pill>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">{p.court}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {selected && <CaseDrawer p={selected} snap={snap} onClose={() => setOpenId(null)} />}
    </div>
  );
}
