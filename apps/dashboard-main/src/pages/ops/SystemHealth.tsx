import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CircleMarker, Tooltip as LTooltip } from "react-leaflet";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, CameraOff, Gauge, HeartPulse, ListOrdered, Loader2, Map as MapIcon, Network, ShieldCheck } from "lucide-react";
import { KpiTile } from "@/components/ops/KpiTile";
import { PageHeader, Panel } from "@/components/ops/Panel";
import { Pill } from "@/components/ops/Pill";
import { OpsMap } from "@/components/ops/OpsMap";
import { SITE_STATE_COLOR, SITE_STATE_LABEL, fmtNum, useOps, useSite, type ProtectionState, type SiteSummary } from "@/lib/ops";
import { SiteHealthPanel } from "./health/SiteHealthPanel";
import { BACKHAUL_COLOR, BACKHAUL_LABEL, PROTECTION_COLOR, PROTECTION_SHORT, PROTECTION_STATES, scoreColor } from "./health/protection";

const tick = { fill: "hsl(var(--muted-foreground))", fontSize: 10 };
const tipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--primary) / 0.3)", fontSize: 11 };

export default function SystemHealth() {
  const { snap } = useOps();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<ProtectionState | "degraded">("degraded");

  const fleet = useMemo(() => {
    if (!snap) return null;
    const sites = snap.sites;
    const byState = Object.fromEntries(PROTECTION_STATES.map((p) => [p, 0])) as Record<ProtectionState, number>;
    const backhaul = { primary: 0, secondary: 0, down: 0 };
    let camsOff = 0;
    let scoreSum = 0;
    const bins = Array.from({ length: 10 }, (_, i) => ({ label: i === 9 ? "90–100" : `${i * 10}–${i * 10 + 9}`, lo: i * 10, count: 0 }));
    for (const s of sites) {
      byState[s.protectionState]++;
      backhaul[s.backhaul]++;
      if (!s.cctvOnline) camsOff++;
      scoreSum += s.protectionScore;
      bins[Math.min(9, Math.floor(s.protectionScore / 10))].count++;
    }
    const worst = [...sites].sort((a, b) => a.protectionScore - b.protectionScore || b.riskScore - a.riskScore);
    const degraded = sites.filter((s) => s.protectionState !== "FULLY PROTECTED");
    return { byState, backhaul, camsOff, avg: scoreSum / sites.length, bins, worst, degraded, total: sites.length };
  }, [snap]);

  const selectedId = params.get("site") ?? fleet?.worst[0]?.id;
  const { site, loading, error } = useSite(selectedId);
  if (!snap || !fleet) return null;

  const select = (id: string) => setParams({ site: id }, { replace: true });
  const table = fleet.worst.filter((s) => filter === "degraded" ? s.protectionState !== "FULLY PROTECTED" : s.protectionState === filter).slice(0, 50);
  const pct = (n: number) => `${((n / fleet.total) * 100).toFixed(1)}%`;

  return (
    <>
      <PageHeader title="System Health & Self-Protection" icon={HeartPulse}
        subtitle="ITIPS monitors itself — cameras, edge AI, backhaul, power and storage — so a site is never assumed protected just because it is online"
        actions={<span className="hud-chip"><ShieldCheck className="h-3 w-3" />Lesson from the POC: "online" ≠ "protected"</span>} />

      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
        {PROTECTION_STATES.map((p) => (
          <button key={p} onClick={() => setFilter(p)} className={`glass-panel px-3 py-2.5 text-left min-w-0 transition-colors ${filter === p ? "border-primary/60" : "hover:border-primary/40"}`}>
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground truncate">{PROTECTION_SHORT[p]}</p>
            <p className="mt-1 text-xl font-bold font-mono tabular-nums" style={{ color: PROTECTION_COLOR[p] }}>{fmtNum(fleet.byState[p])}</p>
            <p className="text-[10px] text-muted-foreground">{pct(fleet.byState[p])} of estate</p>
          </button>
        ))}
        <KpiTile label="Cameras offline" icon={CameraOff} value={fmtNum(fleet.camsOff)} tone={fleet.camsOff ? "text-warning" : "text-success"} hint="sites with ≥1 camera down" />
        <KpiTile label="Backhaul secondary" icon={Network} value={fmtNum(fleet.backhaul.secondary)} tone="text-warning" hint={`${fmtNum(fleet.backhaul.primary)} on primary`} />
        <KpiTile label="Backhaul down" icon={Network} value={fmtNum(fleet.backhaul.down)} tone="text-destructive" hint="no link to NOC" />
        <KpiTile label="Avg protection score" icon={Gauge} value={fleet.avg.toFixed(1)} hint={`${fmtNum(fleet.total)} sites`} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-7 space-y-4 min-w-0">
          <Panel title="Protection state distribution" icon={Activity}>
            <div className="flex h-5 w-full overflow-hidden rounded">
              {PROTECTION_STATES.map((p) => fleet.byState[p] > 0 && (
                <button key={p} onClick={() => setFilter(p)} title={`${p}: ${fleet.byState[p]}`}
                  style={{ width: `${(fleet.byState[p] / fleet.total) * 100}%`, background: PROTECTION_COLOR[p], minWidth: 3 }} />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {PROTECTION_STATES.map((p) => (
                <span key={p} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-sm" style={{ background: PROTECTION_COLOR[p] }} />{p} <span className="font-mono text-foreground">{fleet.byState[p]}</span>
                </span>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
              <div>
                <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Sites by protection score</p>
                <div className="h-[170px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fleet.bins} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                      <CartesianGrid stroke="hsl(var(--primary) / 0.1)" vertical={false} />
                      <XAxis dataKey="label" tick={tick} interval={0} angle={-30} textAnchor="end" height={36} />
                      <YAxis tick={tick} scale="sqrt" allowDecimals={false} />
                      <Tooltip contentStyle={tipStyle} cursor={{ fill: "hsl(var(--primary) / 0.08)" }} formatter={(v: number) => [fmtNum(v), "sites"]} />
                      <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                        {fleet.bins.map((b) => <Cell key={b.label} fill={scoreColor(b.lo + 5)} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Backhaul</p>
                {(["primary", "secondary", "down"] as const).map((b) => (
                  <div key={b}>
                    <div className="flex items-center text-[11px]">
                      <span className="text-foreground">{BACKHAUL_LABEL[b]}</span>
                      <span className="ml-auto font-mono tabular-nums" style={{ color: BACKHAUL_COLOR[b] }}>{fmtNum(fleet.backhaul[b])}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(1, (fleet.backhaul[b] / fleet.total) * 100)}%`, background: BACKHAUL_COLOR[b] }} />
                    </div>
                  </div>
                ))}
                <div className="pt-1">
                  <div className="flex items-center text-[11px]">
                    <span className="text-foreground">CCTV fully online</span>
                    <span className="ml-auto font-mono tabular-nums text-success">{pct(fleet.total - fleet.camsOff)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Degraded sites map" icon={MapIcon} bodyClassName="p-3"
            actions={<span className="font-mono text-[10px] text-muted-foreground">{fmtNum(fleet.degraded.length)} not fully protected</span>}>
            <OpsMap height={340} defaultTiles="dark"
              overlay={
                <div className="absolute bottom-2 left-2 z-[500] rounded-md border border-primary/20 bg-card/85 px-2 py-1.5 backdrop-blur space-y-0.5">
                  {PROTECTION_STATES.slice(1).map((p) => (
                    <p key={p} className="flex items-center gap-1.5 text-[9px] text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ background: PROTECTION_COLOR[p] }} />{p}</p>
                  ))}
                </div>
              }>
              {fleet.degraded.map((s: SiteSummary) => (
                <CircleMarker key={s.id} center={[s.location.lat, s.location.lng]} radius={s.id === selectedId ? 9 : s.protectionState === "UNPROTECTED" ? 6 : 4}
                  pathOptions={{ color: s.id === selectedId ? "#38bdf8" : PROTECTION_COLOR[s.protectionState], fillColor: PROTECTION_COLOR[s.protectionState], fillOpacity: 0.85, weight: s.id === selectedId ? 3 : 1 }}
                  eventHandlers={{ click: () => select(s.id) }}>
                  <LTooltip className="cnii-tip">{s.id} · {s.protectionScore} · {PROTECTION_SHORT[s.protectionState]}</LTooltip>
                </CircleMarker>
              ))}
            </OpsMap>
          </Panel>

          <Panel title="Worst-protected sites" icon={ListOrdered} bodyClassName="p-0"
            actions={
              <div className="flex flex-wrap gap-1">
                {(["degraded", ...PROTECTION_STATES.slice(1)] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${filter === f ? "border-primary bg-primary/20 text-primary" : "border-primary/20 text-muted-foreground hover:text-foreground"}`}>
                    {f === "degraded" ? "All degraded" : PROTECTION_SHORT[f]}
                  </button>
                ))}
              </div>
            }>
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-card text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                  <tr className="border-b border-primary/10">
                    <th className="px-3 py-1.5 text-left font-medium">Site</th>
                    <th className="px-2 py-1.5 text-left font-medium">State</th>
                    <th className="px-2 py-1.5 text-left font-medium">Class</th>
                    <th className="px-2 py-1.5 text-left font-medium">Status</th>
                    <th className="px-2 py-1.5 text-left font-medium">CCTV</th>
                    <th className="px-2 py-1.5 text-left font-medium">Backhaul</th>
                    <th className="px-3 py-1.5 text-right font-medium">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {table.map((s) => (
                    <tr key={s.id} onClick={() => select(s.id)} className={`cursor-pointer ${s.id === selectedId ? "bg-primary/15" : "hover:bg-primary/5"}`}>
                      <td className="px-3 py-1.5"><span className="font-mono text-primary">{s.id}</span><p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{s.name}</p></td>
                      <td className="px-2 py-1.5">{s.state}</td>
                      <td className="px-2 py-1.5 font-mono">{s.siteClass}</td>
                      <td className="px-2 py-1.5"><Pill color={SITE_STATE_COLOR[s.status]}>{SITE_STATE_LABEL[s.status]}</Pill></td>
                      <td className="px-2 py-1.5" style={{ color: s.cctvOnline ? "#22c55e" : "#ef4444" }}>{s.cctvOnline ? "Online" : "Camera down"}</td>
                      <td className="px-2 py-1.5" style={{ color: BACKHAUL_COLOR[s.backhaul] }}>{BACKHAUL_LABEL[s.backhaul]}</td>
                      <td className="px-3 py-1.5 text-right">
                        <span className="font-mono font-bold tabular-nums" style={{ color: PROTECTION_COLOR[s.protectionState] }}>{s.protectionScore}</span>
                        <p className="text-[9px] text-muted-foreground whitespace-nowrap">{PROTECTION_SHORT[s.protectionState]}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!table.length && <p className="p-4 text-[12px] text-muted-foreground">No sites in this state.</p>}
            </div>
          </Panel>
        </div>

        <div className="col-span-12 xl:col-span-5 min-w-0">
          <div className="xl:sticky xl:top-4">
            {site && site.id === selectedId ? (
              <SiteHealthPanel site={site} />
            ) : (
              <div className="glass-panel flex items-center gap-2 p-6 text-sm text-muted-foreground">
                {error && !loading ? <>Could not load health for <span className="font-mono text-foreground">{selectedId}</span> ({error}).</>
                  : <><Loader2 className="h-4 w-4 animate-spin text-primary" />Reading device telemetry for <span className="font-mono text-foreground">{selectedId}</span>…</>}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
