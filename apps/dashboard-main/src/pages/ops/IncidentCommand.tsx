import { Link, useParams } from "react-router-dom";
import { Siren } from "lucide-react";
import { PageHeader } from "@/components/ops/Panel";
import { useOps } from "@/lib/ops";
import { IncidentList } from "./incident/IncidentList";
import { IncidentRoom } from "./incident/IncidentRoom";
import { isActive, sortActive } from "./response/sla";

const FEATURED = "INC-2026-10482";

export default function IncidentCommand() {
  const { id } = useParams<{ id: string }>();
  const { snap, incident } = useOps();
  if (!snap) return null;

  const selected = id ? incident(id) : incident(FEATURED) ?? sortActive(snap.incidents.filter(isActive))[0];
  const activeCount = snap.incidents.filter(isActive).length;

  return (
    <div className="space-y-4">
      <PageHeader title="Incident Command" icon={Siren}
        subtitle={`Every verified incident opens an Incident Room — ${activeCount} active. One screen from detection to closure; no jumping between five applications.`} />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-3 min-w-0">
          <IncidentList incidents={snap.incidents} selectedId={selected?.id} />
        </div>
        <div className="col-span-12 xl:col-span-9 min-w-0">
          {selected ? (
            <IncidentRoom key={selected.id} inc={selected} snap={snap} />
          ) : (
            <div className="glass-panel p-6 text-sm text-muted-foreground">
              {id ? <>Incident <span className="font-mono text-foreground">{id}</span> was not found. <Link to="/incidents" className="text-primary hover:underline">Back to active rooms</Link></> : "No active incidents."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
