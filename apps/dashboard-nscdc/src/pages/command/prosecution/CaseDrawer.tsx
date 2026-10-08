import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, Check, X } from "lucide-react";
import type { CniiSnapshot, ProsecutionCase } from "@/lib/cnii";
import { CASE_STAGE_LABEL, fmtDate, fmtNaira } from "@/lib/cnii";
import { Pill } from "@/components/cnii/Pill";
import { COURT_STAGES, STAGE_COLOR, daysBetween, stageIndex } from "./pipeline";

const PROGRESS = COURT_STAGES.filter((s) => s !== "appeal");

/** Slide-over with a case's stage progress, court record and linked investigation. */
export function CaseDrawer({ p, snap, onClose }: { p: ProsecutionCase; snap: CniiSnapshot; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const kase = snap.cases.find((c) => c.id === p.caseId);
  const assets = kase ? snap.stolenAssets.filter((a) => kase.recoveredAssetIds.includes(a.id)) : [];
  const idx = stageIndex(p.stage);
  const now = snap.generatedAt;

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative w-full max-w-[560px] h-full overflow-y-auto glass-panel rounded-none border-l border-primary/30 p-5 space-y-4 text-[12px]">
        <div className="flex items-start gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] text-muted-foreground">{p.id}</p>
            <h2 className="font-display text-[13px] uppercase text-foreground">{p.caseId}</h2>
            <p className="text-muted-foreground">{p.charge}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>

        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-2">Stage progress</p>
          <ol className="flex items-start">
            {PROGRESS.map((s, i) => {
              const sIdx = stageIndex(s);
              const done = p.stage === "appeal" ? sIdx <= stageIndex("sentence") : sIdx < idx || (p.stage === "closed" && s === "closed");
              const current = s === p.stage;
              return (
                <li key={s} className="flex-1 flex flex-col items-center relative">
                  {i > 0 && <span className={`absolute top-2.5 right-1/2 w-full h-px ${done || current ? "bg-primary/60" : "bg-border"}`} />}
                  <span className={`relative z-10 h-5 w-5 rounded-full border flex items-center justify-center text-[9px] ${current ? "border-primary bg-primary text-primary-foreground" : done ? "border-primary/60 bg-primary/20 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                    {done && !current ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <span className={`mt-1 text-[9px] text-center ${current ? "text-primary font-semibold" : "text-muted-foreground"}`}>{CASE_STAGE_LABEL[s]}</span>
                </li>
              );
            })}
          </ol>
          {p.stage === "appeal" && <p className="mt-2 text-[11px] text-[#ec4899]">On appeal following sentence.</p>}
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <Field label="Status"><Pill color={STAGE_COLOR[p.stage]}>{CASE_STAGE_LABEL[p.stage]}</Pill></Field>
          <Field label="Days since filing"><span className="font-mono">{daysBetween(p.filedAt, now)}</span></Field>
          <Field label="Prosecutor">{p.prosecutor}</Field>
          <Field label="Court">{p.court}</Field>
          <Field label="Filed"><span className="font-mono">{fmtDate(p.filedAt)}</span></Field>
          <Field label="Next hearing"><span className="font-mono">{p.nextHearing ? fmtDate(p.nextHearing) : "—"}</span></Field>
          <Field label="Evidence submitted"><span className="font-mono">{p.evidenceSubmitted} exhibits</span></Field>
          <Field label="Recovered assets"><span className="font-mono">{fmtNaira(p.recoveredAssetsNaira)}</span></Field>
          <Field label="Judgment">{p.judgment ?? "—"}</Field>
          <Field label="Sentence">{p.sentence ?? "—"}</Field>
        </dl>

        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Defendants ({p.defendants.length})</p>
          <div className="flex flex-wrap gap-1">{p.defendants.map((d, i) => <span key={i} className="hud-chip">{d}</span>)}</div>
        </div>

        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Adjournments ({p.adjournments.length})</p>
          {p.adjournments.length === 0 ? <p className="text-muted-foreground">None recorded.</p> : (
            <ul className="space-y-1">
              {[...p.adjournments].sort((a, b) => a.at.localeCompare(b.at)).map((a, i) => (
                <li key={i} className="flex items-center gap-2 rounded-md bg-secondary/40 px-2.5 py-1">
                  <CalendarClock className="h-3.5 w-3.5 text-warning shrink-0" />
                  <span className="font-mono text-[10px] text-muted-foreground w-24 shrink-0">{fmtDate(a.at)}</span>
                  <span>{a.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {assets.length > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Registry items linked to case</p>
            <ul className="space-y-1">
              {assets.map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-[11px]">
                  <span className="font-mono text-muted-foreground">{a.serialNumber}</span>
                  <span className="capitalize">{a.equipmentType.replace("_", " ")}</span>
                  <span className="ml-auto font-mono">{fmtNaira(a.valueNaira)}</span>
                  <Pill color={a.recoveryStatus === "recovered" ? "#22c55e" : "#eab308"}>{a.recoveryStatus}</Pill>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-1">
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Linked investigation</p>
          {kase ? (
            <>
              <p className="text-foreground">{kase.title}</p>
              <p className="text-muted-foreground">Lead investigator: {kase.leadInvestigator} · {kase.state} · {kase.incidentIds.length} incident(s) · {kase.evidenceIds.length} evidence items</p>
            </>
          ) : <p className="text-muted-foreground">Case file not in current dataset.</p>}
          <Link to={`/investigations/${p.caseId}`} className="inline-flex items-center gap-1 text-primary hover:underline">Open investigation file <ArrowRight className="h-3 w-3" /></Link>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}
