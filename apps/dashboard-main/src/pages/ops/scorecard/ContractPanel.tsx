import { FileCheck2 } from "lucide-react";
import {
  CartesianGrid, ComposedChart, Bar, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { Panel } from "@/components/ops/Panel";
import { Pill } from "@/components/ops/Pill";
import type { Kpi } from "@/lib/ops";
import { CONTRACT_STATUS_COLOR, contractStatus, fmtKpi, headroomText, targetLabel, type ContractStatus, type TrendPoint } from "./kpi";

const tick = { fill: "hsl(var(--muted-foreground))", fontSize: 10 };
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--primary) / 0.3)", fontSize: 11 };

export function ContractPanel({ contract, trend, slaTargetSec }: { contract: Kpi[]; trend: TrendPoint[]; slaTargetSec: number }) {
  const rows = contract.map((k) => ({ k, status: contractStatus(k) }));
  const tally = (s: ContractStatus) => rows.filter((r) => r.status === s).length;

  return (
    <Panel
      title={<span className="font-display text-[12px] uppercase tracking-wider">ATC contract · SOW service levels</span>}
      icon={FileCheck2}
      className="print:break-inside-avoid"
      actions={
        <div className="flex gap-1.5">
          {(["MET", "AT RISK", "BREACH"] as const).map((s) => <Pill key={s} color={CONTRACT_STATUS_COLOR[s]}>{tally(s)} {s}</Pill>)}
        </div>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {rows.map(({ k, status }) => (
            <div key={k.key} className="rounded-md border px-3 py-3 min-w-0" style={{ borderColor: `${CONTRACT_STATUS_COLOR[status]}55`, background: `${CONTRACT_STATUS_COLOR[status]}0d` }}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{k.label}</p>
                <Pill color={CONTRACT_STATUS_COLOR[status]} solid={status !== "MET"}>{status}</Pill>
              </div>
              <p className="mt-1 text-2xl font-bold font-mono tabular-nums" style={{ color: CONTRACT_STATUS_COLOR[status] }}>{fmtKpi(k, k.value)}</p>
              <p className="text-[11px] font-mono text-muted-foreground">Target {targetLabel(k) ?? "—"}</p>
              <p className="text-[10px] text-muted-foreground">{headroomText(k)}</p>
            </div>
          ))}
          <p className="col-span-full text-[10px] text-muted-foreground">
            MET = target achieved with headroom · AT RISK = achieved but within the tolerance band · BREACH = contractual target missed.
            Armed response is measured alert → independently verified arrival (GPS geofence, check-in, access record or CCTV).
          </p>
        </div>

        <div className="col-span-12 lg:col-span-5 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">6-month trend · armed response vs SLA</p>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trend} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="hsl(var(--primary) / 0.1)" vertical={false} />
                <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} />
                <YAxis yAxisId="min" tick={tick} axisLine={false} tickLine={false} unit="m" domain={[0, (max: number) => Math.max(25, Math.ceil(max + 2))]} />
                <YAxis yAxisId="pct" orientation="right" tick={tick} axisLine={false} tickLine={false} unit="%" domain={[50, 100]} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--primary) / 0.06)" }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine yAxisId="min" y={slaTargetSec / 60} stroke="#ef4444" strokeDasharray="4 3" label={{ value: `SLA ${slaTargetSec / 60} min`, fill: "#ef4444", fontSize: 9, position: "insideTopLeft" }} />
                <Bar yAxisId="min" dataKey="meanResponseMin" name="Mean response (min)" fill="hsl(var(--primary) / 0.55)" radius={[3, 3, 0, 0]} maxBarSize={28} />
                <Line yAxisId="pct" dataKey="slaPct" name="SLA compliance %" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line yAxisId="pct" dataKey="disruptionPct" name="Attacks disrupted %" stroke="#eab308" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Derived from monthly incident response records and business-impact data. Camera, connectivity and platform availability are reported as current-period actuals.
          </p>
        </div>
      </div>
    </Panel>
  );
}
