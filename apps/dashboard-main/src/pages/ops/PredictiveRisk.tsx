import { useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, BarChart3, CheckCircle2, CircleDashed, Gauge, ListOrdered, Map as MapIcon, ShieldQuestion, Sparkles, Target } from "lucide-react";
import { KpiTile } from "@/components/ops/KpiTile";
import { PageHeader, Panel } from "@/components/ops/Panel";
import { Meter, Pill } from "@/components/ops/Pill";
import { SITE_STATE_COLOR, SITE_STATE_LABEL, useOps, useSite } from "@/lib/ops";
import { DeciderField, DecisionButtons, useDecisionLog } from "./access/decisions";
import { RiskMap } from "./risk/RiskMap";
import { ALL_RECS, BANDS, BAND_COLOR, bandOf, recsFor, riskInputs, type Band } from "./risk/riskUtils";

const tick = { fill: "hsl(var(--muted-foreground))", fontSize: 10 };
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--primary) / 0.3)", fontSize: 11 };

function chip(active: boolean) {
  return `rounded-full border px-2 py-0.5 text-[10px] font-semibold ${active ? "border-primary bg-primary/20 text-primary" : "border-primary/20 text-muted-foreground hover:text-foreground"}`;
}

export default function PredictiveRisk() {
  const { snap } = useOps();
  const [params, setParams] = useSearchParams();
  const [hidden, setHidden] = useState<Set<Band>>(new Set());
  const [listBand, setListBand] = useState<Band | null>(null);
  const log = useDecisionLog("itips.risk.decisions");

  const select = useCallback((id: string) => setParams({ site: id }, { replace: true }), [setParams]);
  const toggleBand = useCallback((b: Band) => setHidden((h) => { const n = new Set(h); if (n.has(b)) n.delete(b); else n.add(b); return n; }), []);

  const stats = useMemo(() => {
    const sites = snap?.sites ?? [];
    const counts = Object.fromEntries(BANDS.map((b) => [b, 0])) as Record<Band, number>;
    sites.forEach((s) => counts[bandOf(s.riskScore)]++);
    const hist = Array.from({ length: 10 }, (_, i) => ({ bin: `${i * 10}–${i * 10 + 9}`, mid: i * 10 + 5, count: sites.filter((s) => Math.min(9, Math.floor(s.riskScore / 10)) === i).length }));
    const mean = sites.length ? Math.round(sites.reduce((a, s) => a + s.riskScore, 0) / sites.length) : 0;
    const campaignProx = (snap?.forecasts ?? []).filter((f) => f.factors.some((x) => x.key === "campaign")).length;
    return { counts, hist, mean, campaignProx };
  }, [snap]);

  const siteId = params.get("site") ?? snap?.forecasts[0]?.siteId ?? null;
  const { site: detail, loading } = useSite(siteId);

  if (!snap) return null;

  const summary = snap.sites.find((s) => s.id === siteId);
  const forecast = snap.forecasts.find((f) => f.siteId === siteId);
  const factors = forecast?.factors ?? detail?.riskFactors ?? [];
  const recs = forecast?.recommendations ?? recsFor(factors);
  const score = summary?.riskScore ?? forecast?.score ?? 0;
  const band = bandOf(score);
  const inputs = summary ? riskInputs(summary, factors, detail, snap.incidents, new Date(snap.generatedAt).getTime()) : [];
  const ranked = snap.forecasts.filter((f) => !listBand || f.band === listBand);
  const critical = stats.counts.Critical;

  return (
    <>
      <PageHeader title="Predictive Risk & Next-Attack Intelligence" icon={Target}
        subtitle="Site Vandalism Risk Score 0–100 for the next 72 hours — where to place patrols, sensitivity and response before an attack"
        actions={<span className="hud-chip !text-warning !border-warning/40"><ShieldQuestion className="h-3 w-3" /> Risk estimates — not deterministic predictions</span>} />

      <div className="glass-panel border-destructive/50 bg-destructive/5 p-4 flex flex-wrap items-center gap-3">
        <AlertTriangle className="h-7 w-7 text-destructive" />
        <div>
          <p className="font-display text-[17px] font-bold text-foreground">
            <span className="text-destructive font-mono">{critical}</span> sites at Critical Risk in next 72 hours
          </p>
          <p className="text-[11px] text-muted-foreground">
            {stats.counts.High} more at High risk. Estimates combine incident history, neighbouring activity, asset attractiveness, access and sensor signals, response distance and local intelligence — they indicate elevated likelihood, not certainty.
          </p>
        </div>
        <button onClick={() => { setListBand("Critical"); setHidden(new Set(BANDS.filter((b) => b !== "Critical" && b !== "High"))); }}
          className="ml-auto rounded border border-destructive/50 px-3 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/15">Focus critical sites</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {BANDS.map((b) => (
          <KpiTile key={b} label={`${b} risk`} value={stats.counts[b]} tone={b === "Critical" ? "text-destructive" : b === "High" ? "text-warning" : "text-foreground"}
            hint={`${Math.round((stats.counts[b] / Math.max(1, snap.sites.length)) * 1000) / 10}% of estate`} onClick={() => setListBand(b === listBand ? null : b)} />
        ))}
        <KpiTile label="Estate mean score" icon={Gauge} value={stats.mean} hint={`${stats.campaignProx} top sites near an active campaign`} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Estate risk map — next 72 h" icon={MapIcon} className="col-span-12 xl:col-span-8" bodyClassName="p-2"
          actions={<span className="hud-chip">{snap.sites.length} sites</span>}>
          <RiskMap sites={snap.sites} selectedId={siteId} hidden={hidden} onSelect={select} onToggleBand={toggleBand} />
        </Panel>

        <Panel title="Ranked risk — top 80" icon={ListOrdered} className="col-span-12 xl:col-span-4" bodyClassName="p-0"
          actions={(
            <div className="flex gap-1">
              <button className={chip(!listBand)} onClick={() => setListBand(null)}>All</button>
              {BANDS.slice(0, 3).map((b) => <button key={b} className={chip(listBand === b)} onClick={() => setListBand(listBand === b ? null : b)}>{b}</button>)}
            </div>
          )}>
          <ul className="max-h-[476px] overflow-y-auto p-2 space-y-1">
            {ranked.length === 0 && <li className="p-3 text-xs text-muted-foreground">No sites in this band within the top 80.</li>}
            {ranked.map((f) => (
              <li key={f.siteId}>
                <button onClick={() => select(f.siteId)} className={`w-full rounded-md border px-2 py-1.5 text-left ${f.siteId === siteId ? "border-primary/60 bg-primary/10" : "border-primary/10 hover:border-primary/30"}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground w-6">{snap.forecasts.indexOf(f) + 1}</span>
                    <span className="font-mono text-[11px] text-primary">{f.siteId}</span>
                    <span className="truncate text-[11px] text-foreground">{f.siteName}</span>
                    <span className="ml-auto font-mono text-[13px] font-bold tabular-nums" style={{ color: BAND_COLOR[f.band] }}>{f.score}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 pl-8">
                    <Meter value={f.score} color={BAND_COLOR[f.band]} className="flex-1" />
                    <span className="text-[9px] text-muted-foreground w-24 truncate text-right">{f.state} · {f.factors[0]?.label}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={summary ? `Risk factor breakdown — ${summary.id}` : "Risk factor breakdown"} icon={Sparkles} className="col-span-12 xl:col-span-8"
          actions={summary && <Link to={`/sites/${summary.id}`} className="text-[11px] text-primary hover:underline">Open site twin →</Link>}>
          {!summary ? <p className="text-xs text-muted-foreground">Select a site on the map or in the ranked list.</p> : (
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-4 flex flex-col items-center text-center">
                <ScoreDial score={score} color={BAND_COLOR[band]} />
                <Pill color={BAND_COLOR[band]} solid className="mt-1">{band.toUpperCase()} RISK · 72 H</Pill>
                <p className="mt-2 text-[12px] font-semibold text-foreground">{summary.name}</p>
                <p className="text-[10px] text-muted-foreground">{summary.state} · {summary.zone} · {summary.siteClass} · {summary.tenants.join(", ")}</p>
                <p className="mt-1 text-[10px]"><span style={{ color: SITE_STATE_COLOR[summary.status] }}>{SITE_STATE_LABEL[summary.status]}</span> <span className="text-muted-foreground">· nearest team {summary.nearestTeamEtaMin} min</span></p>
                <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">This score is a probability-weighted estimate for the next 72 hours. It supports prioritisation; it does not predict that an attack will occur.</p>
              </div>
              <div className="col-span-12 md:col-span-8 space-y-3">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Scored contributions (points of 100)</p>
                  {factors.length === 0 ? <p className="text-xs text-muted-foreground">{loading ? "Loading factors…" : "No contributing factors."}</p> : (
                    <ul className="space-y-1.5">
                      {factors.map((x) => (
                        <li key={x.key} className="grid grid-cols-[150px_1fr_32px] items-center gap-2 text-[11px]">
                          <span className="truncate text-foreground" title={x.detail}>{x.label}</span>
                          <div className="h-2 rounded-full bg-secondary overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(x.contribution / 25) * 100}%`, background: BAND_COLOR[band] }} /></div>
                          <span className="font-mono text-right tabular-nums text-foreground">+{x.contribution}</span>
                          <span className="col-span-3 -mt-1 text-[10px] text-muted-foreground">{x.detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Model inputs — present for this site</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                    {inputs.map((x) => (
                      <li key={x.label} className="flex items-start gap-1.5 text-[11px]">
                        {x.present ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-warning" /> : <CircleDashed className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/60" />}
                        <span className="min-w-0">
                          <span className={x.present ? "text-foreground" : "text-muted-foreground"}>{x.label}</span>
                          {x.contribution != null && <span className="ml-1 font-mono text-[10px] text-warning">+{x.contribution}</span>}
                          <span className="block text-[10px] text-muted-foreground truncate" title={x.detail}>{x.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Recommended actions" icon={CheckCircle2} className="col-span-12 xl:col-span-4"
          actions={<DeciderField name={log.name} setName={log.setName} />}>
          {!summary ? <p className="text-xs text-muted-foreground">Select a site.</p> : (
            <>
              <p className="mb-2 text-[11px] text-muted-foreground">ITIPS recommends; an authorised person approves or defers. Decisions are recorded locally with name and time — nothing is actioned automatically.</p>
              <ul className="space-y-1.5">
                {ALL_RECS.map((r) => {
                  const recommended = recs.includes(r.action);
                  const id = `${summary.id}:${r.action}`;
                  return (
                    <li key={r.action} className={`rounded-md border px-2.5 py-1.5 ${recommended ? "border-primary/40 bg-primary/5" : "border-primary/10 opacity-70"}`}>
                      <div className="flex items-center gap-2 text-[12px]">
                        <span className={recommended ? "font-semibold text-foreground" : "text-muted-foreground"}>{r.action}</span>
                        {recommended && <Pill color="#06b6d4">Recommended</Pill>}
                        {r.consequential && <span className="ml-auto text-[9px] uppercase tracking-wider text-warning">approval required</span>}
                      </div>
                      <div className="mt-1">
                        <DecisionButtons id={id} decision={log.decisions[id]} onDecide={log.record} onUndo={log.undo}
                          options={[{ action: "Approve", tone: "success" }, { action: "Defer", tone: "muted" }]} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Panel>

        <Panel title="Risk band distribution — whole estate" icon={BarChart3} className="col-span-12">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-8 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.hist} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid stroke="hsl(var(--primary) / 0.1)" vertical={false} />
                  <XAxis dataKey="bin" tick={tick} />
                  <YAxis tick={tick} allowDecimals={false} />
                  <RTooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--primary) / 0.06)" }} formatter={(v: number) => [`${v} sites`, "Sites"]} labelFormatter={(l) => `Score ${l}`} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {stats.hist.map((h) => <Cell key={h.bin} fill={BAND_COLOR[bandOf(h.mid)]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="col-span-12 md:col-span-4 space-y-1.5 self-center">
              {BANDS.map((b) => (
                <li key={b} className="text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: BAND_COLOR[b] }} />
                    <span className="text-foreground">{b}</span>
                    <span className="ml-auto font-mono tabular-nums text-foreground">{stats.counts[b]}</span>
                  </div>
                  <Meter value={(stats.counts[b] / Math.max(1, snap.sites.length)) * 100} color={BAND_COLOR[b]} className="mt-0.5" />
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>
    </>
  );
}

function ScoreDial({ score, color }: { score: number; color: string }) {
  const r = 52; const c = 2 * Math.PI * r; const arc = c * 0.75;
  return (
    <svg viewBox="0 0 140 130" className="w-40">
      <circle cx="70" cy="70" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" strokeDasharray={`${arc} ${c}`} transform="rotate(135 70 70)" strokeLinecap="round" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10" strokeDasharray={`${(arc * score) / 100} ${c}`} transform="rotate(135 70 70)" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      <text x="70" y="74" textAnchor="middle" fontSize="30" fontWeight="700" fill="hsl(var(--foreground))" fontFamily="monospace">{score}</text>
      <text x="70" y="94" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))" letterSpacing="2">/ 100 EST.</text>
    </svg>
  );
}
