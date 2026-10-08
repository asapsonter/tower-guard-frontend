import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { FileLock2, ShieldCheck, ShieldAlert, Unlink, Upload, Database, Scale, ScrollText, AlertTriangle, Fingerprint, PackageOpen, Ban } from "lucide-react";
import { Panel, PageHeader } from "@/components/cnii/Panel";
import { KpiTile } from "@/components/cnii/KpiTile";
import { useCnii, fmtTime, timeAgo } from "@/lib/cnii";
import { EvidenceRegister } from "./evidence/EvidenceRegister";
import { EvidenceDetail } from "./evidence/EvidenceDetail";
import { custodyGapReason, useSessionEvidenceLog, type SessionEvidenceEvent } from "./evidence/sessionLog";

const FEATURED_EVIDENCE = "EVD-2026-042891";

const LOG_META: Record<SessionEvidenceEvent["kind"], { label: string; icon: typeof Fingerprint; tone: string }> = {
  hash_match: { label: "Hash verified", icon: Fingerprint, tone: "text-success" },
  hash_mismatch: { label: "Hash mismatch", icon: ShieldAlert, tone: "text-destructive" },
  export: { label: "Exported", icon: PackageOpen, tone: "text-primary" },
  export_blocked: { label: "Export blocked", icon: Ban, tone: "text-warning" },
};

export default function EvidenceCustody() {
  const { snap } = useCnii();
  const [params, setParams] = useSearchParams();
  const log = useSessionEvidenceLog();

  const alerts = useMemo(
    () => (snap?.evidence ?? []).filter((e) => !e.custodyIntact || !e.hashVerified).sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)),
    [snap],
  );

  if (!snap) return null;

  const items = snap.evidence;
  const focusId = params.get("focus");
  const selected = items.find((e) => e.id === focusId) ?? items.find((e) => e.id === FEATURED_EVIDENCE) ?? items[0];
  const select = (id: string) => setParams({ focus: id }, { replace: true });

  const verified = items.filter((e) => e.hashVerified).length;
  const gaps = items.filter((e) => !e.custodyIntact).length;
  const exportsTotal = items.reduce((s, e) => s + e.exports.length, 0) + log.filter((l) => l.kind === "export").length;

  return (
    <>
      <PageHeader
        title="Evidence & Chain of Custody"
        subtitle="Every object hashed at acquisition (SHA-256) with an append-only custody trail · supports the s.84 Evidence Act 2011 certification process"
        icon={FileLock2}
        actions={<span className="hud-chip"><ShieldCheck className="h-3 w-3" /> Vault: ITIPS Evidence Vault</span>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiTile label="Evidence objects" value={items.length} icon={Database} hint={`${new Set(items.map((e) => e.caseId)).size} cases`} />
        <KpiTile label="Hash verified" value={`${items.length ? Math.round((verified / items.length) * 100) : 0}%`} icon={ShieldCheck} tone="text-success" hint={`${verified} of ${items.length}`} />
        <KpiTile label="Unverified hashes" value={items.length - verified} icon={ShieldAlert} tone={items.length - verified ? "text-destructive" : "text-success"} hint="Re-verify before reliance" onClick={() => alerts[0] && select(alerts.find((a) => !a.hashVerified)?.id ?? alerts[0].id)} />
        <KpiTile label="Custody gaps" value={gaps} icon={Unlink} tone={gaps ? "text-warning" : "text-success"} hint="Unauthorised access / export" onClick={() => alerts[0] && select(alerts.find((a) => !a.custodyIntact)?.id ?? alerts[0].id)} />
        <KpiTile label="Exports recorded" value={exportsTotal} icon={Upload} hint="Incl. prosecution bundles" />
        <KpiTile label="Session actions" value={log.length} icon={ScrollText} hint="Verifications & exports logged" />
      </div>

      {alerts.length > 0 && (
        <Panel title="Integrity alerts" icon={AlertTriangle} actions={<span className="text-[10px] text-destructive font-mono">{alerts.length} items</span>} bodyClassName="p-2">
          <ul className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-1.5 max-h-[188px] overflow-y-auto pr-1">
            {alerts.map((e) => {
              const reason = !e.hashVerified ? "Original hash not verified" : custodyGapReason(e);
              return (
                <li key={e.id}>
                  <button onClick={() => select(e.id)} className={`w-full flex items-start gap-2 rounded-md border px-2 py-1.5 text-left ${e.id === selected?.id ? "border-destructive/60 bg-destructive/15" : "border-destructive/25 bg-destructive/5 hover:bg-destructive/10"}`}>
                    {!e.hashVerified ? <ShieldAlert className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" /> : <Unlink className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />}
                    <span className="min-w-0">
                      <span className="block text-[11px] text-foreground truncate"><span className="font-mono text-primary">{e.id}</span> · {e.title}</span>
                      <span className="block text-[10px] text-destructive truncate">{reason}{!e.hashVerified && !e.custodyIntact ? " · custody gap" : ""}</span>
                      <span className="block text-[10px] text-muted-foreground font-mono truncate">{e.caseId ?? "—"}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-5 min-w-0">
          <EvidenceRegister items={items} selectedId={selected?.id ?? null} onSelect={select} />
        </div>
        <div className="col-span-12 xl:col-span-7 min-w-0 space-y-4">
          {selected ? <EvidenceDetail item={selected} /> : <Panel><p className="py-10 text-center text-xs text-muted-foreground">No evidence on record.</p></Panel>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Legal foundation" icon={Scale}>
              <div className="space-y-2 text-[11px] text-muted-foreground leading-relaxed">
                <p>
                  The platform <span className="text-foreground">supports</span> the evidentiary foundation for computer-generated evidence — acquisition hashes,
                  device identity, time and location, and an unbroken custody trail — and assembles what the certification process needs, e.g. a
                  <span className="text-foreground"> certificate under Section 84 of the Evidence Act 2011</span> signed by the responsible officer.
                </p>
                <p>
                  Technology alone does not determine admissibility. Admissibility and weight are decided by the court; integrity records help the
                  prosecution lay the foundation and help the defence test it.
                </p>
              </div>
            </Panel>
            <Panel title="Session audit log" icon={ScrollText} bodyClassName="p-2">
              {log.length ? (
                <ul className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
                  {log.map((l) => {
                    const m = LOG_META[l.kind];
                    return (
                      <li key={l.id}>
                        <button onClick={() => select(l.evidenceId)} className="w-full flex items-start gap-2 rounded px-1.5 py-1 text-left hover:bg-primary/5">
                          <m.icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${m.tone}`} />
                          <span className="min-w-0">
                            <span className="block text-[11px]"><span className={m.tone}>{m.label}</span> · <span className="font-mono text-primary">{l.evidenceId}</span></span>
                            <span className="block text-[10px] text-muted-foreground truncate">{l.note}</span>
                            <span className="block text-[10px] text-muted-foreground font-mono">{fmtTime(l.at)} · {timeAgo(l.at)} · {l.actor}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="p-4 text-center text-[11px] text-muted-foreground">No verifications or exports yet this session. Actions on any item are logged here and on its custody trail.</p>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
