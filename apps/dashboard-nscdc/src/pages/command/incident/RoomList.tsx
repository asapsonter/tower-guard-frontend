import { Link } from "react-router-dom";
import { Siren } from "lucide-react";
import { Panel } from "@/components/cnii/Panel";
import { Pill } from "@/components/cnii/Pill";
import { SlaCountdown } from "@/components/cnii/SlaCountdown";
import { INCIDENT_STATUS_LABEL, INCIDENT_TYPE_LABEL, SEVERITY_COLOR, type Incident } from "@/lib/cnii";
import { AWAITING_DISPATCH, placeName } from "./roomUtils";

/** Left column: selectable list of active incident rooms. */
export function RoomList({ rooms, selectedId }: { rooms: Incident[]; selectedId?: string }) {
  return (
    <Panel title="Active incident rooms" icon={Siren} actions={<span className="hud-chip">{rooms.length}</span>} bodyClassName="p-2">
      {rooms.length === 0 ? (
        <p className="p-4 text-xs text-muted-foreground">No active incidents. All CNII sites secure.</p>
      ) : (
        <ul className="space-y-1.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          {rooms.map((inc) => {
            const sel = inc.id === selectedId;
            const color = SEVERITY_COLOR[inc.severity];
            return (
              <li key={inc.id}>
                <Link
                  to={`/incident/${inc.id}`}
                  className={`block rounded-md border px-2.5 py-2 transition-colors ${sel ? "border-primary/60 bg-primary/10" : "border-primary/10 hover:border-primary/30 hover:bg-secondary/40"}`}
                  style={{ boxShadow: `inset 3px 0 0 ${color}` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-primary">{inc.id}</span>
                    <Pill color={color} className="ml-auto uppercase">{inc.severity}</Pill>
                  </div>
                  <p className="mt-0.5 text-[12px] font-semibold text-foreground truncate">{INCIDENT_TYPE_LABEL[inc.type]}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{placeName(inc)} · {inc.operator}</p>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <span className={`text-[10px] ${AWAITING_DISPATCH(inc) ? "text-warning font-semibold" : "text-muted-foreground"}`}>
                      {INCIDENT_STATUS_LABEL[inc.status]}
                    </span>
                    <SlaCountdown alertAt={inc.response.stages.alert ?? inc.detectedAt} slaSeconds={inc.response.slaSeconds} arrivalAt={inc.response.verifiedArrival} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
