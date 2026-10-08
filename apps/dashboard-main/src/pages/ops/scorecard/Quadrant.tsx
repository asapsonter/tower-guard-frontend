import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Panel } from "@/components/ops/Panel";
import type { Kpi } from "@/lib/ops";
import { TONE_CLASS, deltaTone, fmtKpi, meetsTarget, targetLabel } from "./kpi";

function KpiBlock({ k }: { k: Kpi }) {
  const tone = deltaTone(k);
  const met = meetsTarget(k);
  const Arrow = k.delta == null || k.delta === 0 ? Minus : k.delta > 0 ? ArrowUpRight : ArrowDownRight;
  const target = targetLabel(k);
  return (
    <div className="rounded-md border border-primary/10 bg-primary/[0.03] px-3 py-3 min-w-0 print:border-gray-300">
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground truncate">{k.label}</p>
      <p className={`mt-1 text-2xl sm:text-3xl font-bold font-mono tabular-nums ${met === false ? "text-destructive" : "text-foreground"}`}>{fmtKpi(k, k.value)}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
        {k.delta != null && (
          <span className={`flex items-center gap-0.5 font-mono font-semibold tabular-nums ${TONE_CLASS[tone]}`} title="Change vs previous month">
            <Arrow className="h-3.5 w-3.5" />
            {k.delta > 0 ? "+" : ""}{k.delta}%
            <span className="font-sans font-normal text-muted-foreground ml-1">vs last month</span>
          </span>
        )}
        {target && (
          <span className={`font-mono ${met ? "text-success" : "text-destructive"}`}>
            Target {target} {met ? "✓" : "✗"}
          </span>
        )}
      </div>
    </div>
  );
}

interface QuadrantProps {
  title: string;
  icon: LucideIcon;
  kpis: Kpi[];
  link?: { to: string; label: string };
  className?: string;
}

export function Quadrant({ title, icon, kpis, link, className = "" }: QuadrantProps) {
  return (
    <Panel
      title={<span className="font-display text-[12px] uppercase tracking-wider">{title}</span>}
      icon={icon}
      className={`print:break-inside-avoid ${className}`}
      actions={link && <Link to={link.to} className="text-[10px] text-muted-foreground hover:text-primary print:hidden">{link.label} →</Link>}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {kpis.map((k) => <KpiBlock key={k.key} k={k} />)}
      </div>
    </Panel>
  );
}
