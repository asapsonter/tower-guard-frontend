import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, FileCheck2, FileLock2, Fingerprint, Gavel, Link2, Scale, ShieldAlert, UserX, XCircle } from "lucide-react";
import { Panel } from "@/components/ops/Panel";
import { Pill } from "@/components/ops/Pill";
import { CASE_STAGES, CASE_STAGE_LABEL, fmtDate, fmtNaira, fmtTime, type CaseFile, type EvidenceItem, type Incident } from "@/lib/ops";
import { EVIDENCE_KIND_LABEL, shortHash, stageColor } from "./caseMeta";

const COVERAGE: { label: string; has: (c: CaseFile) => boolean; note?: string }[] = [
  { label: "Original footage", has: (c) => c.evidence.some((e) => e.kind === "original_footage") },
  { label: "Event clips", has: (c) => c.evidence.some((e) => e.kind === "event_clip") },
  { label: "Still images", has: (c) => c.evidence.some((e) => e.kind === "still") },
  { label: "Sensor logs", has: (c) => c.evidence.some((e) => e.kind === "sensor_log") },
  { label: "AI classifications", has: (c) => c.evidence.some((e) => e.kind === "ai_classification") },
  { label: "Timestamps (NTP-synced)", has: (c) => c.evidence.length > 0 },
  { label: "GPS records", has: (c) => c.evidence.some((e) => e.kind === "gps_record") },
  { label: "Access logs", has: (c) => c.evidence.some((e) => e.kind === "access_log") },
  { label: "Responder bodycam", has: (c) => c.evidence.some((e) => e.kind === "bodycam"), note: "where applicable" },
  { label: "Statements", has: (c) => c.evidence.some((e) => e.kind === "statement") },
  { label: "Recovered assets", has: (c) => c.evidence.some((e) => e.kind === "recovered_asset"), note: "if recovered" },
  { label: "Hash / signature verification", has: (c) => c.evidence.length > 0 && c.evidence.every((e) => e.verified) },
];

/** Full Evidence Case File: pipeline stepper, evidence register, chain of custody. */
export function CaseView({ ecf, incident }: { ecf: CaseFile; incident?: Incident }) {
  const [evId, setEvId] = useState<string | null>(null);
  const ev = ecf.evidence.find((e) => e.id === evId) ?? ecf.evidence[0];
  const verified = ecf.evidence.filter((e) => e.verified).length;
  const stageIdx = CASE_STAGES.indexOf(ecf.stage);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-panel p-4" style={{ boxShadow: `inset 3px 0 0 ${stageColor(ecf.stage)}` }}>
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Evidence case file · auto-created from incident</p>
            <h2 className="mt-0.5 flex flex-wrap items-center gap-2 text-[15px] font-bold text-foreground">
              <span className="font-mono text-primary">{ecf.id}</span><span className="text-primary/40">|</span><span>{ecf.title}</span>
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              <Pill color={stageColor(ecf.stage)} solid>{CASE_STAGE_LABEL[ecf.stage]}</Pill>
              <Link to={`/incidents/${ecf.incidentId}`} className="hud-chip hover:text-primary">{ecf.incidentId}</Link>
              <Link to={`/sites/${ecf.siteId}`} className="hud-chip hover:text-primary">{ecf.siteId}</Link>
              {ecf.policeRef && <span className="hud-chip">Police {ecf.policeRef}</span>}
              {ecf.court && <span className="hud-chip"><Gavel className="h-3 w-3 mr-1 inline" />{ecf.court}</span>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-right">
            <div><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Evidence</p><p className="font-mono text-xl font-bold text-foreground">{ecf.evidence.length}</p></div>
            <div><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Verified</p><p className="font-mono text-xl font-bold text-success">{verified}</p></div>
            <div><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Recovered</p><p className="font-mono text-xl font-bold text-foreground">{fmtNaira(ecf.recoveredNaira)}</p></div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
          <p><span className="text-muted-foreground">Case owner · </span>{ecf.owner}</p>
          <p><span className="text-muted-foreground">Next action · </span><span className="text-warning">{ecf.nextAction}</span></p>
          {incident && <p><span className="text-muted-foreground">Incident loss · </span>{fmtNaira(incident.lossNaira)} · {incident.state}</p>}
        </div>
      </div>

      {/* Stepper */}
      <Panel title="Case pipeline" icon={Scale} bodyClassName="p-3">
        <div className="overflow-x-auto">
          <ol className="grid grid-cols-11 gap-1 min-w-[720px]">
            {CASE_STAGES.map((s, i) => {
              const at = ecf.stageDates[s];
              const done = i < stageIdx || (i === stageIdx && s === "closed");
              const current = i === stageIdx;
              const color = stageColor(s);
              return (
                <li key={s} className="relative text-center">
                  {i > 0 && <span className="absolute top-3 right-1/2 w-full h-px" style={{ background: at ? color : "hsl(var(--border))" }} />}
                  <span className={`relative z-10 mx-auto flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-mono ${current ? "animate-pulse" : ""}`}
                    style={at ? { borderColor: color, background: done ? color : `${color}33`, color: done ? "#04070d" : color } : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                    {done ? "✓" : i + 1}
                  </span>
                  <p className={`mt-1 text-[9px] uppercase tracking-wide leading-tight ${at ? "text-foreground" : "text-muted-foreground"}`}>{CASE_STAGE_LABEL[s]}</p>
                  <p className="font-mono text-[9px] text-muted-foreground">{at ? fmtDate(at) : "—"}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </Panel>

      <div className="grid grid-cols-12 gap-4">
        {/* Evidence register */}
        <Panel title="Evidence register" icon={FileLock2} className="col-span-12 xl:col-span-8" bodyClassName="p-0"
          actions={<span className="hud-chip">SHA-256</span>}>
          {ecf.evidence.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground">Evidence for this archived case is held in the ITIPS vault and has not been indexed into the case register in this demo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-left text-[9px] uppercase tracking-[0.14em] text-muted-foreground border-b border-primary/10 whitespace-nowrap">
                    <th className="px-3 py-2 font-medium">Item</th><th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 font-medium">Captured</th>
                    <th className="px-3 py-2 font-medium">Device</th><th className="px-3 py-2 font-medium">SHA-256</th><th className="px-3 py-2 font-medium">Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {ecf.evidence.map((e) => (
                    <tr key={e.id} onClick={() => setEvId(e.id)} className={`cursor-pointer whitespace-nowrap ${e.id === ev?.id ? "bg-primary/10" : "hover:bg-primary/5"}`}>
                      <td className="px-3 py-1.5"><span className="font-mono text-[10px] text-muted-foreground">{e.id.split("-").pop()}</span> <span className="text-foreground">{e.title}</span></td>
                      <td className="px-3 py-1.5 text-muted-foreground">{EVIDENCE_KIND_LABEL[e.kind]}</td>
                      <td className="px-3 py-1.5 font-mono">{fmtDate(e.capturedAt)} {fmtTime(e.capturedAt)}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{e.device}</td>
                      <td className="px-3 py-1.5 font-mono text-[10px] text-primary/80" title={e.sha256}>{shortHash(e.sha256)}</td>
                      <td className="px-3 py-1.5">
                        {e.verified
                          ? <Pill color="#22c55e"><CheckCircle2 className="h-3 w-3" />VERIFIED</Pill>
                          : <Pill color="#ef4444"><XCircle className="h-3 w-3" />UNVERIFIED</Pill>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* Chain of custody */}
        <div className="col-span-12 xl:col-span-4">
          <CustodyPanel ev={ev} />
        </div>

        <Panel title="Evidentiary coverage" icon={FileCheck2} className="col-span-12 lg:col-span-6">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            {COVERAGE.map((k) => {
              const ok = k.has(ecf);
              return (
                <li key={k.label} className="flex items-center gap-1.5 text-[11px]">
                  {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40" />}
                  <span className={ok ? "text-foreground" : "text-muted-foreground"}>{k.label}</span>
                  {!ok && k.note && <span className="text-[9px] text-muted-foreground">({k.note})</span>}
                </li>
              );
            })}
          </ul>
          <div className="mt-3 border-t border-primary/10 pt-2">
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Suspects</p>
            {ecf.suspects.length === 0 ? <p className="text-[11px] text-muted-foreground">None identified yet.</p> : (
              <ul className="flex flex-wrap gap-1.5">
                {ecf.suspects.map((s, i) => <li key={i}><Pill color="#a78bfa"><UserX className="h-3 w-3" />{s.name} · {s.status}</Pill></li>)}
              </ul>
            )}
          </div>
        </Panel>

        <Panel title="Admissibility foundation" icon={ShieldAlert} className="col-span-12 lg:col-span-6">
          <p className="text-[11px] text-muted-foreground">
            <span className="text-foreground font-semibold">Admissibility is decided by the court.</span> ITIPS supplies the evidentiary foundation:
            originals preserved unaltered, every item hashed at capture, and an unbroken chain of custody.
          </p>
          <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-3">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground"><Fingerprint className="h-4 w-4 text-primary" />s.84 Evidence Act 2011 certificate</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Certificate for computer-generated evidence: identifies the records and producing devices, states the system was operating properly and in regular use, and is signed by a responsible officer.</p>
            <ul className="mt-2 space-y-0.5 text-[11px]">
              <li className="flex items-center gap-1.5"><Link2 className="h-3 w-3 text-primary" />{ecf.evidence.length} records with producing device identified</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className={`h-3 w-3 ${verified === ecf.evidence.length && verified > 0 ? "text-success" : "text-warning"}`} />{verified}/{ecf.evidence.length} hashes verified against vault originals</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-success" />Device health & time-sync logs attached</li>
            </ul>
            <p className="mt-2 text-[10px] text-warning">Draft prepared by ITIPS — must be reviewed and signed by the responsible officer before filing.</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function CustodyPanel({ ev }: { ev?: EvidenceItem }) {
  return (
    <Panel title="Chain of custody" icon={Link2} className="h-full">
      {!ev ? <p className="text-xs text-muted-foreground">Select an evidence item.</p> : (
        <div className="space-y-3">
          <div>
            <p className="text-[12px] font-semibold text-foreground">{ev.title}</p>
            <p className="font-mono text-[9px] text-muted-foreground break-all">{ev.sha256}</p>
          </div>
          {ev.preview && <img src={ev.preview} alt={ev.title} className="aspect-video w-full rounded border border-primary/15 object-cover" />}
          <ol className="relative">
            {ev.custody.map((c, i) => {
              const last = i === ev.custody.length - 1;
              return (
                <li key={i} className="relative flex gap-3 pb-3">
                  {!last && <span className="absolute left-[7px] top-4 bottom-0 w-px bg-primary/25" />}
                  <span className={`relative z-10 mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border ${last ? "border-primary bg-primary/40" : "border-primary/50 bg-card"}`} />
                  <div className="min-w-0">
                    <p className="text-[12px] text-foreground">{c.action}</p>
                    <p className="text-[10px] text-muted-foreground">{c.actor} · <span className="font-mono">{fmtDate(c.at)} {fmtTime(c.at)}</span></p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="text-[10px] text-muted-foreground">Hash re-verified at every transfer · {ev.verified ? <span className="text-success">integrity intact</span> : <span className="text-destructive">hash mismatch — flag to case owner</span>}</p>
        </div>
      )}
    </Panel>
  );
}
