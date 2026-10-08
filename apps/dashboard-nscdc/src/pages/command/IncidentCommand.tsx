import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Siren } from "lucide-react";
import { PageHeader } from "@/components/cnii/Panel";
import { useCnii } from "@/lib/cnii";
import { IncidentRoom } from "./incident/IncidentRoom";
import { RoomList } from "./incident/RoomList";
import { sortRooms } from "./incident/roomUtils";

export default function IncidentCommand() {
  const { id } = useParams<{ id: string }>();
  const { snap } = useCnii();
  // Sort once per snapshot so the list does not reshuffle every second.
  const rooms = useMemo(() => (snap ? sortRooms(snap.incidents, Date.now()) : []), [snap]);
  if (!snap) return null;

  const selected = id ? snap.incidents.find((i) => i.id === id) : rooms[0];

  return (
    <>
      <PageHeader title="Live Incident Command" icon={Siren}
        subtitle="Every verified incident opens an NSCDC Incident Room — one operational record from detection to closure" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-3">
          <RoomList rooms={rooms} selectedId={selected?.id} />
        </div>
        <div className="col-span-12 xl:col-span-9 min-w-0">
          {selected ? (
            <IncidentRoom key={selected.id} inc={selected} snap={snap} />
          ) : (
            <div className="glass-panel p-6 text-sm text-muted-foreground">
              {id ? <>Incident <span className="font-mono text-foreground">{id}</span> was not found. <Link to="/incident" className="text-primary hover:underline">Back to active rooms</Link></> : "No active incidents."}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
