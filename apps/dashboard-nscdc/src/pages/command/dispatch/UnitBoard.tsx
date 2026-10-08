import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, ChevronRight, Radio, X } from "lucide-react";
import { Meter, Pill } from "@/components/cnii/Pill";
import {
  UNIT_STATUS_COLOR, UNIT_STATUS_LABEL, fmtDuration, timeAgo, useNow, type CniiSnapshot, type Incident, type ResponseUnit,
} from "@/lib/cnii";
import { etaRemaining } from "../incident/roomUtils";
import { COMMS_COLOR, etaFor, roadKm } from "./dispatchUtils";

interface UnitBoardProps {
  units: ResponseUnit[];
  snap: CniiSnapshot;
  selected?: Incident;
  recommendedId?: string;
  focusId?: string;
}

/** Response unit table with expandable equipment checklist and crew. */
export function UnitBoard({ units, snap, selected, recommendedId, focusId }: UnitBoardProps) {
  const now = useNow();
  const [expanded, setExpanded] = useState<string | null>(focusId ?? null);
  const focusRow = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (!focusId) return;
    setExpanded(focusId);
    focusRow.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusId]);

  if (units.length === 0) return <p className="p-4 text-xs text-muted-foreground">No units match the current filter.</p>;

  return (
    <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
      <table className="w-full min-w-[980px] text-[11px]">
        <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
          <tr className="text-left text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            <th className="w-6" />
            <th className="py-2 pr-2">Unit</th>
            <th className="pr-2">Status</th>
            <th className="pr-2">Team commander</th>
            <th className="pr-2">Officers</th>
            <th className="pr-2">Vehicle</th>
            <th className="pr-2">Location</th>
            <th className="pr-2 text-right">Distance</th>
            <th className="pr-2 text-right">ETA</th>
            <th className="pr-2">Assignment</th>
            <th className="pr-2 w-28">Equipment</th>
            <th className="pr-2">Comms</th>
          </tr>
        </thead>
        <tbody>
          {units.map((u) => {
            const open = expanded === u.id;
            const km = selected ? roadKm(u.location, selected.location) : null;
            const assigned = u.currentAssignment ? snap.incidents.find((i) => i.id === u.currentAssignment) : undefined;
            const assignEta = assigned ? etaRemaining(assigned, snap.generatedAt, now) : null;
            const isRec = u.id === recommendedId;
            const isFocus = u.id === focusId;
            return (
              <Fragment key={u.id}>
                <tr ref={isFocus ? focusRow : undefined} onClick={() => setExpanded(open ? null : u.id)}
                  className={`cursor-pointer border-t border-primary/10 hover:bg-secondary/40 ${isRec ? "bg-primary/10" : ""} ${isFocus ? "outline outline-1 outline-primary/60" : ""}`}>
                  <td className="pl-1">{open ? <ChevronDown className="h-3.5 w-3.5 text-primary" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}</td>
                  <td className="py-1.5 pr-2 font-mono font-bold text-foreground whitespace-nowrap">
                    {u.callsign}{isRec && <span className="ml-1.5 text-[9px] font-sans text-primary">★ ITIPS</span>}
                  </td>
                  <td className="pr-2"><Pill color={UNIT_STATUS_COLOR[u.status]}>{UNIT_STATUS_LABEL[u.status]}</Pill></td>
                  <td className="pr-2 whitespace-nowrap">{u.commander.rank} {u.commander.name}</td>
                  <td className="pr-2 font-mono">{u.officers.length + 1}{u.armed && <span className="ml-1 font-sans text-[9px] text-warning">armed</span>}</td>
                  <td className="pr-2 whitespace-nowrap"><span className="font-mono">{u.vehicle.plate}</span> <span className="text-muted-foreground">{u.vehicle.type}</span></td>
                  <td className="pr-2 whitespace-nowrap text-muted-foreground">{u.state} · {u.areaCommandId.split("-").slice(2).join(" ")}</td>
                  <td className="pr-2 text-right font-mono tabular-nums">{km != null ? `${km} km` : "—"}</td>
                  <td className="pr-2 text-right font-mono tabular-nums">{km != null && u.status !== "unavailable" ? fmtDuration(etaFor(u, km)) : "—"}</td>
                  <td className="pr-2 whitespace-nowrap">
                    {u.currentAssignment ? (
                      <Link to={`/incident/${u.currentAssignment}`} onClick={(e) => e.stopPropagation()} className="font-mono text-primary hover:underline">
                        {u.currentAssignment}{assignEta != null && <span className="ml-1 text-muted-foreground">ETA {fmtDuration(assignEta)}</span>}
                      </Link>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="pr-2">
                    <div className="flex items-center gap-1.5">
                      <Meter value={u.equipmentReadiness} color={u.equipmentReadiness >= 70 ? "#22c55e" : "#f59e0b"} className="flex-1" />
                      <span className="font-mono text-[10px] w-7 text-right">{u.equipmentReadiness}</span>
                    </div>
                  </td>
                  <td className="pr-2">
                    <span className="inline-flex items-center gap-1 capitalize" style={{ color: COMMS_COLOR[u.comms] }}><Radio className="h-3 w-3" />{u.comms}</span>
                  </td>
                </tr>
                {open && (
                  <tr className="bg-secondary/20">
                    <td />
                    <td colSpan={11} className="py-2 pr-2">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Equipment checklist</p>
                          <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                            {u.equipment.map((e) => (
                              <li key={e.item} className="flex items-center gap-1">
                                {e.ok ? <Check className="h-3 w-3 text-success" /> : <X className="h-3 w-3 text-destructive" />}
                                <span className={e.ok ? "text-foreground" : "text-destructive"}>{e.item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Crew</p>
                          <ul className="space-y-0.5">
                            <li><span className="text-primary">{u.commander.rank} {u.commander.name}</span> <span className="font-mono text-muted-foreground">{u.commander.serviceNumber}</span> · commander</li>
                            {u.officers.map((o) => <li key={o.id}>{o.rank} {o.name} <span className="font-mono text-muted-foreground">{o.serviceNumber}</span></li>)}
                          </ul>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Position & comms</p>
                          <p className="font-mono">{u.location.lat.toFixed(4)}, {u.location.lng.toFixed(4)}</p>
                          <p>Last check-in {timeAgo(u.lastCheckIn, now)}</p>
                          <p>{u.zone} zone · {u.stateCommandId}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
