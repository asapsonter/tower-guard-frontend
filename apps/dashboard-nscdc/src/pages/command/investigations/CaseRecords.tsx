import { Link } from "react-router-dom";
import {
  Siren, UserRound, Users, Car, PackageCheck, FileLock2, Cctv, ShieldCheck, ShieldAlert, ArrowUpRight, Camera, Video, KeyRound,
  Activity, MessageSquareText, FlaskConical, FileText, MapPin,
} from "lucide-react";
import { Panel } from "@/components/cnii/Panel";
import { Pill } from "@/components/cnii/Pill";
import {
  EVIDENCE_KIND_LABEL, INCIDENT_STATUS_LABEL, INCIDENT_TYPE_COLOR, INCIDENT_TYPE_LABEL, SEVERITY_COLOR, fmtDate, fmtNaira, fmtTime,
  type CniiSnapshot, type EvidenceItem, type EvidenceKind, type InvestigationCase,
} from "@/lib/cnii";
import { suspectLabel } from "./caseModel";

const SUSPECT_STATUS_COLOR: Record<string, string> = {
  unidentified: "#94a3b8", identified: "#eab308", wanted: "#f97316", arrested: "#ef4444", charged: "#a855f7", released: "#64748b",
};

const RECOVERY_COLOR: Record<string, string> = { missing: "#ef4444", tracked: "#f59e0b", recovered: "#22c55e", destroyed: "#64748b" };

/** Ordered evidence groups — the categories an investigator expects in a case file. */
const EVIDENCE_GROUPS: { kind: EvidenceKind; label: string; icon: typeof Camera }[] = [
  { kind: "image", label: "Photographs", icon: Camera },
  { kind: "video", label: "Video", icon: Video },
  { kind: "access_log", label: "Access logs", icon: KeyRound },
  { kind: "sensor_log", label: "Sensor logs", icon: Activity },
  { kind: "statement", label: "Statements", icon: MessageSquareText },
  { kind: "forensic", label: "Forensic records", icon: FlaskConical },
  { kind: "document", label: "Documents & exhibits", icon: FileText },
  { kind: "gps_track", label: "GPS tracks", icon: MapPin },
];

function Empty({ children }: { children: string }) {
  return <p className="py-3 text-center text-[11px] text-muted-foreground">{children}</p>;
}

export function LinkedIncidents({ c, snap }: { c: InvestigationCase; snap: CniiSnapshot }) {
  const incs = c.incidentIds.map((id) => snap.incidents.find((i) => i.id === id)).filter((i): i is NonNullable<typeof i> => !!i);
  return (
    <Panel title="Incident report" icon={Siren} actions={<span className="text-[10px] text-muted-foreground">{incs.length} linked</span>} bodyClassName="p-2">
      {incs.length ? (
        <ul className="space-y-1.5">
          {incs.map((i) => (
            <li key={i.id} className="rounded-md border border-primary/10 bg-background/30 px-2.5 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/incident/${i.id}`} className="font-mono text-xs text-primary hover:underline inline-flex items-center gap-0.5">{i.id}<ArrowUpRight className="h-3 w-3" /></Link>
                <Pill color={INCIDENT_TYPE_COLOR[i.type]}>{INCIDENT_TYPE_LABEL[i.type]}</Pill>
                <Pill color={SEVERITY_COLOR[i.severity]}>{i.severity}</Pill>
                <span className="ml-auto text-[10px] text-muted-foreground font-mono">{fmtDate(i.detectedAt)} {fmtTime(i.detectedAt)}</span>
              </div>
              <p className="mt-1 text-xs text-foreground">{i.siteName} · {i.operator} · {i.lga}, {i.state}</p>
              <p className="text-[11px] text-muted-foreground line-clamp-2">{i.threatSummary}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {INCIDENT_STATUS_LABEL[i.status]} · {i.arrests} arrest{i.arrests === 1 ? "" : "s"} · {fmtNaira(i.assetsRecoveredNaira)} recovered
              </p>
            </li>
          ))}
        </ul>
      ) : <Empty>Legacy case — no ITIPS incident record attached.</Empty>}
    </Panel>
  );
}

export function PeoplePanel({ c, snap }: { c: InvestigationCase; snap: CniiSnapshot }) {
  const suspects = c.suspectIds.map((id) => snap.suspects.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s);
  return (
    <Panel title="Suspects & witnesses" icon={Users} bodyClassName="p-3 space-y-3">
      <div>
        <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Suspects ({suspects.length})</p>
        {suspects.length ? (
          <ul className="space-y-1.5">
            {suspects.map((s) => (
              <li key={s.id} className="flex items-start gap-2">
                <UserRound className="h-3.5 w-3.5 mt-0.5 text-destructive/80 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link to={`/intelligence?focus=${s.id}`} className="text-xs text-foreground hover:text-primary truncate">{suspectLabel(s)}</Link>
                    <Pill color={SUSPECT_STATUS_COLOR[s.status] ?? "#94a3b8"} className="ml-auto">{s.status}</Pill>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{s.description}{s.armed ? " · believed armed" : ""}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : <Empty>No suspects recorded.</Empty>}
      </div>
      <div>
        <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Witnesses ({c.witnesses.length})</p>
        {c.witnesses.length ? (
          <ul className="space-y-1">
            {c.witnesses.map((w) => (
              <li key={w.name} className="flex items-center gap-2 text-xs">
                <span className="text-foreground truncate">{w.name}</span>
                <span className="text-[10px] text-muted-foreground truncate">{w.role}</span>
                <Pill color={w.statementTaken ? "#22c55e" : "#f97316"} className="ml-auto">{w.statementTaken ? "Statement taken" : "Statement pending"}</Pill>
              </li>
            ))}
          </ul>
        ) : <Empty>No witnesses recorded.</Empty>}
      </div>
    </Panel>
  );
}

export function VehiclesProperty({ c, snap }: { c: InvestigationCase; snap: CniiSnapshot }) {
  const vehicles = c.vehicleIds.map((id) => snap.vehicles.find((v) => v.id === id)).filter((v): v is NonNullable<typeof v> => !!v);
  const assets = c.recoveredAssetIds.map((id) => snap.stolenAssets.find((a) => a.id === id)).filter((a): a is NonNullable<typeof a> => !!a);
  return (
    <Panel title="Vehicles & recovered property" icon={Car} bodyClassName="p-3 space-y-3">
      <div>
        <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Vehicles ({vehicles.length})</p>
        {vehicles.length ? (
          <ul className="space-y-1">
            {vehicles.map((v) => (
              <li key={v.id} className="flex items-center gap-2 text-xs">
                <Car className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span className="font-mono text-foreground">{v.plate ?? "No plate"}</span>
                <span className="text-[10px] text-muted-foreground truncate">{v.description}</span>
              </li>
            ))}
          </ul>
        ) : <Empty>No vehicles recorded.</Empty>}
      </div>
      <div>
        <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Stolen / recovered property ({assets.length})</p>
        {assets.length ? (
          <ul className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
            {assets.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-xs">
                <PackageCheck className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <Link to={`/assets?focus=${a.id}`} className="font-mono text-primary hover:underline">{a.id}</Link>
                <span className="text-[10px] text-muted-foreground truncate capitalize">{a.manufacturer} {a.equipmentType.replace("_", " ")} · {fmtNaira(a.valueNaira)}</span>
                <Pill color={RECOVERY_COLOR[a.recoveryStatus]} className="ml-auto">{a.recoveryStatus}</Pill>
              </li>
            ))}
          </ul>
        ) : <Empty>No stolen-asset records linked.</Empty>}
      </div>
    </Panel>
  );
}

function Integrity({ e }: { e: EvidenceItem }) {
  const ok = e.hashVerified && e.custodyIntact;
  return ok
    ? <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" aria-label="Hash verified, custody intact" />
    : <ShieldAlert className="h-3.5 w-3.5 text-destructive shrink-0" aria-label={!e.hashVerified ? "Hash not verified" : "Custody gap"} />;
}

export function EvidenceGroups({ items }: { items: EvidenceItem[] }) {
  const groups = EVIDENCE_GROUPS.map((g) => ({ ...g, items: items.filter((e) => e.kind === g.kind) })).filter((g) => g.items.length);
  return (
    <Panel title="Evidence file" icon={FileLock2} actions={<Link to="/evidence" className="text-[10px] text-primary hover:underline">Evidence register →</Link>} bodyClassName="p-3">
      {groups.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {groups.map((g) => (
            <div key={g.kind} className="min-w-0">
              <p className="mb-1 flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                <g.icon className="h-3 w-3 text-primary" /> {g.label} ({g.items.length})
              </p>
              <ul className="space-y-1">
                {g.items.map((e) => (
                  <li key={e.id}>
                    <Link to={`/evidence?focus=${e.id}`} className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-primary/5">
                      <Integrity e={e} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs text-foreground truncate">{e.title}</span>
                        <span className="block font-mono text-[10px] text-muted-foreground truncate">{e.id} · {fmtDate(e.capturedAt)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : <Empty>No evidence ingested for this case.</Empty>}
      <p className="mt-3 text-[10px] text-muted-foreground">
        {EVIDENCE_GROUPS.map((g) => EVIDENCE_KIND_LABEL[g.kind]).join(" · ")} — every item is hashed at ingest and carries its own chain of custody.
      </p>
    </Panel>
  );
}

export function CctvMetadata({ items }: { items: EvidenceItem[] }) {
  const cctv = items.filter((e) => e.kind === "video" || e.kind === "image");
  return (
    <Panel title="CCTV metadata" icon={Cctv} bodyClassName="p-2">
      {cctv.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground border-b border-primary/15">
              <tr>
                <th className="px-2 py-1.5 text-left">Evidence</th><th className="px-2 py-1.5 text-left">Device</th><th className="px-2 py-1.5 text-left">Captured</th>
                <th className="px-2 py-1.5 text-left">GPS</th><th className="px-2 py-1.5 text-left">SHA-256</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {cctv.map((e) => (
                <tr key={e.id} className="border-b border-border/30">
                  <td className="px-2 py-1.5"><Link to={`/evidence?focus=${e.id}`} className="text-primary hover:underline">{e.id}</Link></td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{e.originatingDevice}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{fmtDate(e.capturedAt)} {fmtTime(e.capturedAt)}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{e.location.lat.toFixed(4)}, {e.location.lng.toFixed(4)}</td>
                  <td className="px-2 py-1.5 text-muted-foreground">{e.sha256.slice(0, 10)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty>No camera evidence in this case.</Empty>}
    </Panel>
  );
}
