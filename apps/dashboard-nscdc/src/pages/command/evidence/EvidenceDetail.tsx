import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, FileLock2, Fingerprint, Loader2, PackageOpen, ShieldAlert, ShieldCheck, Upload, Eye, History } from "lucide-react";
import { Panel } from "@/components/cnii/Panel";
import { Pill } from "@/components/cnii/Pill";
import { EVIDENCE_KIND_LABEL, fmtDate, fmtTime, type EvidenceItem } from "@/lib/cnii";
import { CustodyTimeline } from "./CustodyTimeline";
import {
  SESSION_ACTOR, custodyGapReason, logEvidenceEvent, sessionCustody, simulateRehash, useSessionEvidenceLog,
} from "./sessionLog";

export function IntegrityBadges({ item }: { item: EvidenceItem }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      <Pill color={item.hashVerified ? "#22c55e" : "#ef4444"}>
        {item.hashVerified ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
        Hash {item.hashVerified ? "verified" : "not verified"}
      </Pill>
      <Pill color={item.custodyIntact ? "#22c55e" : "#f97316"}>Custody {item.custodyIntact ? "intact" : "gap"}</Pill>
    </span>
  );
}

function HashField({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <span className="font-mono text-foreground truncate" title={hash}>{hash.slice(0, 16)}…{hash.slice(-8)}</span>
      <button onClick={copy} className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-primary" aria-label="Copy full SHA-256">
        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </span>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="contents">
      <dt className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground pt-0.5">{label}</dt>
      <dd className="text-xs text-foreground min-w-0 break-words">{children}</dd>
    </div>
  );
}

export function EvidenceDetail({ item }: { item: EvidenceItem }) {
  const log = useSessionEvidenceLog();
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; digest: string } | null>(null);
  const [exportMsg, setExportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const currentId = useRef(item.id);
  useEffect(() => {
    currentId.current = item.id;
    setResult(null);
    setExportMsg(null);
    setVerifying(false);
  }, [item.id]);

  const verify = () => {
    setVerifying(true);
    setResult(null);
    const id = item.id;
    setTimeout(() => {
      const digest = simulateRehash(item);
      const ok = digest === item.sha256;
      logEvidenceEvent({
        evidenceId: id,
        kind: ok ? "hash_match" : "hash_mismatch",
        actor: SESSION_ACTOR,
        note: ok ? "SHA-256 re-computed — matches original acquisition hash" : `SHA-256 mismatch — computed ${digest.slice(0, 12)}…; escalated to Evidence Custodian`,
      });
      if (currentId.current !== id) return;
      setResult({ ok, digest });
      setVerifying(false);
    }, 1100);
  };

  const exportBundle = () => {
    if (!item.hashVerified || !item.custodyIntact) {
      logEvidenceEvent({ evidenceId: item.id, kind: "export_blocked", actor: SESSION_ACTOR, note: "Export refused — integrity must be resolved by the Evidence Custodian first" });
      setExportMsg({ ok: false, text: "Export blocked: hash not verified or custody gap. Logged for the Evidence Custodian." });
      return;
    }
    logEvidenceEvent({ evidenceId: item.id, kind: "export", actor: SESSION_ACTOR, note: "Exported to prosecution bundle — s.84 Evidence Act certificate to be signed by the responsible officer" });
    setExportMsg({ ok: true, text: "Recorded export to prosecution bundle. Certificate under s.84 Evidence Act 2011 queued for signature." });
  };

  const trail = [...item.custody, ...sessionCustody(item, log)];
  const access = trail.filter((e) => e.action === "viewed" || e.action === "verified" || e.action === "transferred");
  const exports = [
    ...item.exports.map((e) => ({ ...e, session: false })),
    ...log.filter((e) => e.evidenceId === item.id && e.kind === "export").map((e) => ({ at: e.at, to: "Prosecution bundle (local)", by: e.actor, session: true })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const gap = custodyGapReason(item);

  return (
    <Panel title={item.id} icon={FileLock2} actions={<IntegrityBadges item={item} />} bodyClassName="p-4 space-y-4">
      {/* One-line evidential summary */}
      <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground">
        {item.id} · {item.title} · Original hash: <span className={item.hashVerified ? "text-success" : "text-destructive"}>{item.hashVerified ? "VERIFIED" : "NOT VERIFIED"}</span>
        {" "}· Captured: {fmtTime(item.capturedAt)} · Device: {item.originatingDevice} · Case: {item.caseId ?? "—"} · Chain of custody:{" "}
        <span className={item.custodyIntact ? "text-success" : "text-warning"}>{item.custodyIntact ? "INTACT" : "GAP"}</span>
      </p>

      {gap && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
          <ShieldAlert className="h-4 w-4 shrink-0" /> {gap}. Refer to the Evidence Custodian before this item is relied on.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
        <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5">
          <Row label="Type">{EVIDENCE_KIND_LABEL[item.kind]}</Row>
          <Row label="Source">{item.source}</Row>
          <Row label="Device"><span className="font-mono">{item.originatingDevice}</span></Row>
          <Row label="Captured"><span className="font-mono">{fmtDate(item.capturedAt)} {fmtTime(item.capturedAt)} WAT</span></Row>
          <Row label="GPS"><span className="font-mono">{item.location.lat.toFixed(5)}, {item.location.lng.toFixed(5)}</span></Row>
          <Row label="SHA-256"><HashField hash={item.sha256} /></Row>
          <Row label="Acquired by">{item.acquiredBy}</Row>
          <Row label="Case">{item.caseId ? <Link to={`/investigations/${item.caseId}`} className="font-mono text-primary hover:underline">{item.caseId}</Link> : "Unassigned"}</Row>
          <Row label="Incident">{item.incidentId ? <Link to={`/incident/${item.incidentId}`} className="font-mono text-primary hover:underline">{item.incidentId}</Link> : "—"}</Row>
        </dl>
        {item.preview && (
          <img src={item.preview} alt={item.title} className="w-full md:w-44 h-28 object-cover rounded-md border border-primary/20" loading="lazy" />
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button onClick={verify} disabled={verifying} className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 disabled:opacity-60">
            {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Fingerprint className="h-3.5 w-3.5" />} Verify hash
          </button>
          <button onClick={exportBundle} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-foreground hover:bg-secondary">
            <PackageOpen className="h-3.5 w-3.5" /> Export to prosecution bundle
          </button>
        </div>
        {result && (
          <p className={`rounded px-2 py-1.5 text-[11px] font-mono ${result.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
            {result.ok ? "MATCH" : "MISMATCH"} · computed {result.digest.slice(0, 16)}… vs original {item.sha256.slice(0, 16)}… · logged to audit trail
          </p>
        )}
        {exportMsg && <p className={`text-[11px] ${exportMsg.ok ? "text-success" : "text-destructive"}`}>{exportMsg.text}</p>}
        <p className="text-[10px] text-muted-foreground">Simulated client-side check — every action is written to the custody trail and the session audit log.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Chain of custody</p>
          <CustodyTimeline events={trail} />
        </div>
        <div className="space-y-3">
          <div>
            <p className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground"><Eye className="h-3 w-3" /> Access history ({access.length})</p>
            <ul className="space-y-0.5 text-[11px]">
              {access.map((a, i) => (
                <li key={i} className="flex gap-2"><span className="font-mono text-muted-foreground shrink-0">{fmtDate(a.at)} {fmtTime(a.at)}</span><span className="truncate">{a.actor} · {a.action}</span></li>
              ))}
              {!access.length && <li className="text-muted-foreground">No access since ingest.</li>}
            </ul>
          </div>
          <div>
            <p className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground"><Upload className="h-3 w-3" /> Export history ({exports.length})</p>
            <ul className="space-y-1 text-[11px]">
              {exports.map((x, i) => {
                const unauth = x.to.toLowerCase().includes("usb");
                return (
                  <li key={i} className={unauth ? "text-destructive" : ""}>
                    <span className="font-mono text-muted-foreground">{fmtDate(x.at)} {fmtTime(x.at)}</span> → {x.to}
                    <span className="block text-[10px] text-muted-foreground">by {x.by}{unauth ? " · UNAUTHORISED" : ""}{x.session ? " · this session" : ""}</span>
                  </li>
                );
              })}
              {!exports.length && <li className="text-muted-foreground">Never exported.</li>}
            </ul>
          </div>
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground"><History className="h-3 w-3" /> Trail is append-only; entries cannot be edited or removed.</p>
        </div>
      </div>
    </Panel>
  );
}
