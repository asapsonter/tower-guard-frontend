import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Boxes, Lightbulb, Map as MapIcon, PackageCheck, PackageSearch, Percent, Radar, Store, Wallet } from "lucide-react";
import { fmtNaira, useCnii } from "@/lib/cnii";
import { PageHeader, Panel } from "@/components/cnii/Panel";
import { KpiTile } from "@/components/cnii/KpiTile";
import { Meter, Pill } from "@/components/cnii/Pill";
import { indexIncidents } from "./intelligence/analysis";
import { RecoveryMap } from "./assets/RecoveryMap";
import { Registry } from "./assets/Registry";
import { EQUIPMENT_COLOR, EQUIPMENT_LABEL, EQUIPMENT_TYPES, dealerAggregates, marketAggregates, supplyChainInsights, type Insight } from "./assets/insights";

const tick = { fill: "hsl(var(--muted-foreground))", fontSize: 10 };
const tipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--primary) / 0.3)", fontSize: 11 };
const INSIGHT_COLOR: Record<Insight["kind"], string> = { market: "#ec4899", dealer: "#a855f7", corridor: "#3b82f6" };

export default function AssetRecovery() {
  const { snap } = useCnii();
  const assets = snap?.stolenAssets ?? [];
  const incById = useMemo(() => indexIncidents(snap?.incidents ?? []), [snap]);
  const markets = useMemo(() => marketAggregates(assets), [assets]);
  const dealers = useMemo(() => dealerAggregates(assets), [assets]);
  const insights = useMemo(() => (snap ? supplyChainInsights(assets, incById, snap.corridors) : []), [snap, assets, incById]);

  if (!snap) return null;

  const total = assets.reduce((s, a) => s + a.valueNaira, 0);
  const recovered = assets.filter((a) => a.recoveryStatus === "recovered");
  const recoveredValue = recovered.reduce((s, a) => s + a.valueNaira, 0);
  const tracked = assets.filter((a) => a.recoveryStatus === "tracked");
  const missing = assets.filter((a) => a.recoveryStatus === "missing");
  const rate = assets.length ? Math.round((recovered.length / assets.length) * 100) : 0;

  const chartData = markets.map((m) => ({ name: m.name.replace(/ (Market|Building Materials Market|Spare Parts Market|Scrap Market|Scrap Yard)$/, ""), full: m.name, ...m.byType }));
  const usedTypes = EQUIPMENT_TYPES.filter((t) => markets.some((m) => m.byType[t] > 0));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Asset Recovery & Stolen Property"
        subtitle="National CNII Stolen Asset Registry — following stolen equipment from the site to the market"
        icon={PackageSearch}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiTile label="Registered stolen items" value={assets.length} icon={Boxes} hint={`${missing.length} still missing`} />
        <KpiTile label="Total stolen value" value={fmtNaira(total)} icon={Wallet} tone="text-destructive" />
        <KpiTile label="Recovered value" value={fmtNaira(recoveredValue)} icon={PackageCheck} tone="text-success" hint={`${recovered.length} items`} />
        <KpiTile label="Recovery rate" value={`${rate}%`} icon={Percent} tone={rate >= 40 ? "text-success" : "text-warning"} hint={`${total ? Math.round((recoveredValue / total) * 100) : 0}% by value`} />
        <KpiTile label="Live-tracked items" value={tracked.length} icon={Radar} tone="text-warning" hint={fmtNaira(tracked.reduce((s, a) => s + a.valueNaira, 0))} />
        <KpiTile label="Markets / dealers" value={`${markets.length} / ${dealers.length}`} icon={Store} hint="Recovery points identified" />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Recovery map · theft site → recovery point" icon={MapIcon} className="col-span-12 xl:col-span-7" bodyClassName="p-3">
          <RecoveryMap assets={assets} incById={incById} markets={markets} />
          <p className="text-[10px] text-muted-foreground mt-2">Green lines: theft site to recovery location · amber diamonds: current GPS tracker fix · pink circles: markets sized by recovered count.</p>
        </Panel>

        <Panel title="Supply-chain intelligence" icon={Lightbulb} className="col-span-12 xl:col-span-5" bodyClassName="p-3 space-y-2.5"
          actions={<span className="hud-chip">Computed correlations</span>}>
          <p className="text-[11px] text-muted-foreground">Turns isolated theft into supply-chain intelligence. Patterns below are computed from the registry and recovery reports — leads for investigation, not findings against any trader.</p>
          {insights.length === 0 && <p className="text-xs text-muted-foreground">Not enough recoveries yet to identify a pattern.</p>}
          {insights.map((i) => (
            <div key={i.id} className="rounded-md border px-3 py-2 space-y-1" style={{ borderColor: `${INSIGHT_COLOR[i.kind]}55`, background: `${INSIGHT_COLOR[i.kind]}0d` }}>
              <div className="flex items-center gap-2">
                <Pill color={INSIGHT_COLOR[i.kind]}>{i.kind}</Pill>
                <span className="ml-auto text-[10px] font-mono text-muted-foreground">confidence {Math.round(i.confidence * 100)}%</span>
              </div>
              <p className="text-[12px] font-semibold text-foreground">{i.headline}</p>
              <p className="text-[11px] text-muted-foreground">{i.detail}</p>
              <p className="text-[10px] text-muted-foreground/80">Basis: {i.basis}</p>
            </div>
          ))}
        </Panel>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Recoveries by market & equipment" icon={Store} className="col-span-12 xl:col-span-7">
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 34)}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--primary) / 0.1)" horizontal={false} />
                <XAxis type="number" tick={tick} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={tick} width={110} />
                <Tooltip contentStyle={tipStyle} cursor={{ fill: "hsl(var(--primary) / 0.06)" }} labelFormatter={(_, p) => (p?.[0]?.payload as { full?: string })?.full ?? ""} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {usedTypes.map((t) => <Bar key={t} dataKey={t} name={EQUIPMENT_LABEL[t]} stackId="a" fill={EQUIPMENT_COLOR[t]} />)}
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground">No recoveries recorded.</p>}
        </Panel>

        <Panel title="Receiving dealers" icon={Store} className="col-span-12 xl:col-span-5" bodyClassName="p-3 max-h-[380px] overflow-y-auto">
          {dealers.length === 0 ? <p className="text-xs text-muted-foreground">No receiving dealers identified.</p> : (
            <ul className="space-y-2">
              {dealers.slice(0, 12).map((d) => (
                <li key={d.dealer} className="text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground truncate">{d.dealer}</span>
                    <span className="ml-auto font-mono tabular-nums text-foreground">{d.count}</span>
                    <span className="font-mono tabular-nums text-muted-foreground w-16 text-right">{fmtNaira(d.value)}</span>
                  </div>
                  <Meter value={(d.count / dealers[0].count) * 100} color="#ec4899" className="mt-1" />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {Object.entries(d.byType).map(([t, n]) => `${n} ${EQUIPMENT_LABEL[t as keyof typeof EQUIPMENT_LABEL].toLowerCase()}`).join(" · ")} · {[...d.markets].join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="National CNII Stolen Asset Registry" icon={Boxes} bodyClassName="p-0">
        <Registry assets={assets} suspects={snap.suspects} />
      </Panel>
    </div>
  );
}
