import { useState } from "react";
import { Briefcase, TrendingDown, TrendingUp } from "lucide-react";
import { Panel } from "@/components/ops/Panel";
import { fmtNaira, fmtNum, type Kpi, type MonthlyImpact } from "@/lib/ops";
import { DEFAULT_DOWNTIME_VALUE_PER_HOUR, totalLoss } from "./impactUtils";

/** Avoided loss vs security cost — the business case for ITIPS. */
export function BusinessCase({ impact, financial, sites, className = "" }: { impact: MonthlyImpact[]; financial: Kpi[]; sites: number; className?: string }) {
  const [hourValue, setHourValue] = useState(DEFAULT_DOWNTIME_VALUE_PER_HOUR);
  const costPerSite = financial.find((k) => k.key === "cost_per_site")?.value ?? 0;
  const months = impact.length;
  const cost = costPerSite * sites * months;
  const avoided = impact.reduce((s, m) => s + m.avoidedLossNaira, 0);
  const recovered = impact.reduce((s, m) => s + m.recoveredNaira, 0);
  const downtimeH = impact.reduce((s, m) => s + m.downtimeAvoidedHours, 0);
  const downtimeValue = downtimeH * hourValue;
  const losses = impact.reduce((s, m) => s + totalLoss(m), 0);
  const value = avoided + recovered + downtimeValue;
  const ratio = cost ? value / cost : 0;
  const maxBar = Math.max(value, cost, 1);

  const rows = [
    { label: "Estimated loss avoided", v: avoided, color: "#22c55e" },
    { label: "Assets recovered", v: recovered, color: "#06b6d4" },
    { label: `Downtime avoided (${fmtNum(downtimeH)} h)`, v: downtimeValue, color: "#3b82f6" },
  ];

  return (
    <Panel title="Business case — avoided loss vs security cost" icon={Briefcase} className={className}
      actions={<span className="hud-chip">{months} months · {fmtNum(sites)} sites</span>}>
      <div className="space-y-3">
        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Value protected</p>
          <div className="flex h-5 w-full overflow-hidden rounded bg-secondary">
            {rows.map((r) => <div key={r.label} title={`${r.label}: ${fmtNaira(r.v)}`} style={{ width: `${(r.v / maxBar) * 100}%`, background: r.color }} />)}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
            {rows.map((r) => (
              <span key={r.label} className="flex items-center gap-1 text-muted-foreground">
                <span className="h-2 w-2 rounded-sm" style={{ background: r.color }} /> {r.label} <span className="font-mono text-foreground">{fmtNaira(r.v)}</span>
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Security cost</p>
          <div className="h-5 w-full overflow-hidden rounded bg-secondary">
            <div className="h-full bg-muted-foreground/60" style={{ width: `${(cost / maxBar) * 100}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">{fmtNaira(costPerSite)} / site / month × {fmtNum(sites)} sites × {months} months = <span className="font-mono text-foreground">{fmtNaira(cost)}</span></p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat label="Value protected" value={fmtNaira(value)} tone="text-success" />
          <Stat label="Security spend" value={fmtNaira(cost)} />
          <Stat label="Value / cost" value={`${ratio.toFixed(2)}×`} tone={ratio >= 1 ? "text-success" : "text-warning"} />
        </div>

        <p className="text-[12px] text-foreground leading-relaxed">
          {ratio >= 1
            ? <>Every ₦1 of security spend protected <span className="font-mono text-success">₦{ratio.toFixed(2)}</span> of assets, recoveries and service uptime this period. </>
            : <>Protected value covers <span className="font-mono text-warning">{Math.round(ratio * 100)}%</span> of security spend on direct measures alone — before tenant SLA penalties, revenue and deterrence effects are counted. </>}
          Realised losses were <span className="font-mono text-destructive">{fmtNaira(losses)}</span> against <span className="font-mono text-success">{fmtNaira(avoided)}</span> avoided.
          <span className="text-primary font-semibold"> This creates the business case for ITIPS.</span>
        </p>

        <label className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          Assumption — value of one hour of avoided site downtime
          <input type="number" min={0} step={10_000} value={hourValue} onChange={(e) => setHourValue(Math.max(0, Number(e.target.value) || 0))}
            className="w-28 rounded border border-primary/20 bg-secondary/60 px-1.5 py-0.5 font-mono text-[11px] text-foreground focus:outline-none focus:border-primary/60" />
          <span>₦/h (default from restoration cost rate)</span>
        </label>

        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Financial KPIs (scorecard)</p>
          <div className="grid grid-cols-2 gap-2">
            {financial.map((k) => {
              const good = k.delta == null ? null : (k.betterWhen === "higher" ? k.delta >= 0 : k.delta <= 0);
              const Arrow = (k.delta ?? 0) >= 0 ? TrendingUp : TrendingDown;
              return (
                <div key={k.key} className="rounded-md border border-primary/15 bg-secondary/30 px-2 py-1.5">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground truncate">{k.label}</p>
                  <p className="flex items-center gap-1.5 font-mono text-[13px] font-bold text-foreground">
                    {k.unit === "naira" ? fmtNaira(k.value) : fmtNum(k.value)}
                    {k.delta != null && (
                      <span className={`flex items-center text-[10px] font-normal ${good ? "text-success" : "text-destructive"}`}>
                        <Arrow className="h-3 w-3" />{Math.abs(k.delta)}%
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function Stat({ label, value, tone = "text-foreground" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md border border-primary/15 bg-secondary/30 px-2 py-1.5 text-center">
      <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className={`font-mono text-[16px] font-bold ${tone}`}>{value}</p>
    </div>
  );
}
