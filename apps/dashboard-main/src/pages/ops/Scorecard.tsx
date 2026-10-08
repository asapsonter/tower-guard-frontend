import { useMemo } from "react";
import { Banknote, Gavel, Printer, Server, ShieldCheck, Trophy } from "lucide-react";
import { Panel, PageHeader } from "@/components/ops/Panel";
import { fmtDate, fmtNaira, useOps } from "@/lib/ops";
import { Quadrant } from "./scorecard/Quadrant";
import { ContractPanel } from "./scorecard/ContractPanel";
import { CONTRACT_STATUS_COLOR, contractStatus, contractTrend } from "./scorecard/kpi";

/** Executive & SLA Scorecard — CTO / COO / Chief Security Officer view. */
export default function Scorecard() {
  const { snap } = useOps();
  const trend = useMemo(() => (snap ? contractTrend(snap.impact, snap.incidents) : []), [snap]);
  if (!snap) return null;

  const sc = snap.scorecard;
  const period = snap.impact[snap.impact.length - 1]?.month;
  const periodLabel = period ? new Date(`${period}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }) : "";
  const statuses = sc.contract.map(contractStatus);
  const breaches = sc.contract.filter((_, i) => statuses[i] === "BREACH");
  const atRisk = sc.contract.filter((_, i) => statuses[i] === "AT RISK");
  const losses = sc.financial.find((k) => k.key === "losses_month");
  const avoided = sc.financial.find((k) => k.key === "avoided_month");

  const headline = [
    { label: "SOW metrics met", value: `${statuses.filter((s) => s === "MET").length}/${statuses.length}`, color: breaches.length ? CONTRACT_STATUS_COLOR.BREACH : atRisk.length ? CONTRACT_STATUS_COLOR["AT RISK"] : CONTRACT_STATUS_COLOR.MET },
    { label: "Response SLA compliance", value: `${snap.kpis.slaCompliancePct}%`, color: snap.kpis.slaCompliancePct >= 95 ? CONTRACT_STATUS_COLOR.MET : CONTRACT_STATUS_COLOR.BREACH },
    { label: "Losses this month", value: losses ? fmtNaira(losses.value) : "—", color: "hsl(var(--foreground))" },
    { label: "Avoided loss this month", value: avoided ? fmtNaira(avoided.value) : "—", color: CONTRACT_STATUS_COLOR.MET },
  ];

  return (
    <>
      <PageHeader
        title="Executive & SLA Scorecard"
        subtitle={`${snap.operatorName} · ${periodLabel} · CTO / COO / Chief Security Officer summary`}
        icon={Trophy}
        actions={
          <>
            <span className="hud-chip">Generated {fmtDate(snap.generatedAt)}</span>
            <button onClick={() => window.print()} className="hud-chip hover:text-primary print:hidden"><Printer className="h-3 w-3" /> Print / PDF</button>
          </>
        }
      />

      <Panel bodyClassName="p-4" className="print:break-inside-avoid">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {headline.map((h) => (
            <div key={h.label} className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{h.label}</p>
              <p className="text-3xl sm:text-4xl font-bold font-mono tabular-nums" style={{ color: h.color }}>{h.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {breaches.length
            ? <>Contract attention required: <span className="text-destructive font-semibold">{breaches.map((k) => k.label).join(", ")}</span> below SOW target.</>
            : atRisk.length
              ? <>All SOW targets met; <span className="text-warning font-semibold">{atRisk.map((k) => k.label).join(", ")}</span> within the tolerance band.</>
              : <>All SOW targets met with headroom.</>}
          {" "}Deltas compare with the previous month; colour reflects whether the movement is favourable.
        </p>
      </Panel>

      <div className="grid grid-cols-12 gap-4">
        <Quadrant className="col-span-12 lg:col-span-6" title="Security" icon={ShieldCheck} kpis={sc.security} link={{ to: "/incidents", label: "Incidents" }} />
        <Quadrant className="col-span-12 lg:col-span-6" title="Operations" icon={Server} kpis={sc.operations} link={{ to: "/health", label: "System health" }} />
        <Quadrant className="col-span-12 lg:col-span-6" title="Financial" icon={Banknote} kpis={sc.financial} link={{ to: "/impact", label: "Business impact" }} />
        <Quadrant className="col-span-12 lg:col-span-6" title="Enforcement" icon={Gavel} kpis={sc.enforcement} link={{ to: "/cases", label: "Cases" }} />
      </div>

      <ContractPanel contract={sc.contract} trend={trend} slaTargetSec={sc.contract.find((k) => k.key === "sow_response")?.target ?? 1200} />
    </>
  );
}
