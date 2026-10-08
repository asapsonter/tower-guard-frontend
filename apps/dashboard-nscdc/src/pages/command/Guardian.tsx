import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, Send, ShieldCheck, Sparkles, FileSearch, Lock, Loader2, AlertTriangle, ChevronRight } from "lucide-react";
import { useAuth } from "@tower-guard/hooks";
import { PageHeader, Panel } from "@/components/cnii/Panel";
import { Meter, Pill } from "@/components/cnii/Pill";
import { askGuardian, fmtTime, type GuardianAnswer } from "@/lib/cnii";

const SUGGESTED = [
  "Show all telecom vandalism incidents in Kaduna in the last 90 days.",
  "Which suspects are connected to more than one operator?",
  "Show cases involving stolen lithium batteries.",
  "Which commands repeatedly miss the response SLA?",
  "What vehicles appeared near multiple vandalised sites?",
  "Which open investigations have not progressed for 30 days?",
  "Show every incident linked to contractor Apex Telecoms.",
  "Where should I deploy five additional patrol teams tonight?",
];

const KIND_COLOR: Record<string, string> = {
  incident: "#f97316", case: "#e2e8f0", suspect: "#ef4444", vehicle: "#3b82f6", command: "#22c55e",
  referral: "#a855f7", deployment: "#06b6d4",
};

interface Turn {
  id: number;
  question: string;
  askedAt: string;
  askedBy: string;
  answer?: GuardianAnswer;
  error?: string;
}

export default function Guardian() {
  const { user } = useAuth();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [turns]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    const id = Date.now();
    setTurns((t) => [...t, { id, question: q, askedAt: new Date().toISOString(), askedBy: user?.full_name ?? "Duty Officer" }]);
    setDraft("");
    setBusy(true);
    try {
      const answer = await askGuardian(q);
      setTurns((t) => t.map((x) => (x.id === id ? { ...x, answer } : x)));
    } catch (e) {
      setTurns((t) => t.map((x) => (x.id === id ? { ...x, error: e instanceof Error ? e.message : "Guardian is unavailable" } : x)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Guardian AI"
        subtitle="Secure investigative copilot · evidence-linked answers with confidence and provenance"
        icon={Bot}
        actions={<span className="hud-chip"><Lock className="h-3 w-3" /> NSCDC restricted</span>}
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Conversation */}
        <Panel className="col-span-12 xl:col-span-8 min-h-[620px]" title="Ask Guardian" icon={Sparkles} bodyClassName="flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-5 max-h-[64vh]">
            {turns.length === 0 && (
              <div className="text-center py-10">
                <Bot className="h-10 w-10 text-primary mx-auto mb-3 opacity-80" />
                <p className="text-sm text-foreground">Ask about incidents, suspects, vehicles, cases, SLA performance or deployments.</p>
                <p className="text-xs text-muted-foreground mt-1">Every answer links to the records it is built from.</p>
                <div className="mt-6 grid sm:grid-cols-2 gap-2 text-left max-w-2xl mx-auto">
                  {SUGGESTED.map((q) => (
                    <button key={q} onClick={() => ask(q)} className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground hover:bg-primary/10 hover:border-primary/40 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {turns.map((t) => (
              <div key={t.id} className="space-y-2">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg bg-primary/15 border border-primary/30 px-3 py-2">
                    <p className="text-sm text-foreground">{t.question}</p>
                    <p className="text-[9px] text-muted-foreground mt-1 font-mono">{t.askedBy} · {fmtTime(t.askedAt)}</p>
                  </div>
                </div>
                {!t.answer && !t.error && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Guardian is querying ITIPS records…</div>
                )}
                {t.error && (
                  <div className="flex items-center gap-2 text-xs text-destructive"><AlertTriangle className="h-3.5 w-3.5" /> {t.error}</div>
                )}
                {t.answer && <AnswerCard answer={t.answer} />}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); ask(draft); }}
            className="border-t border-primary/15 p-3 flex gap-2"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. Which suspects are connected to more than one operator?"
              className="flex-1 rounded-md bg-secondary/60 border border-primary/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
              maxLength={500}
            />
            <button type="submit" disabled={busy || !draft.trim()} className="px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5 disabled:opacity-40">
              <Send className="h-3.5 w-3.5" /> Ask
            </button>
          </form>
        </Panel>

        {/* Guardrails + audit */}
        <div className="col-span-12 xl:col-span-4 space-y-4">
          <Panel title="Operating rules" icon={ShieldCheck}>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><span className="text-foreground font-semibold">Evidence-linked.</span> Answers come only from ITIPS records and cite them.</li>
              <li><span className="text-foreground font-semibold">Confidence &amp; provenance</span> are shown for every answer.</li>
              <li><span className="text-foreground font-semibold">Decision support only.</span> Guardian does not arrest, blacklist or accuse anyone. Authorised officers decide.</li>
              <li><span className="text-foreground font-semibold">Lawful access.</span> Phone and personal data appear only where a lawful basis is recorded.</li>
              <li><span className="text-foreground font-semibold">Audited.</span> Every question is logged against the asking officer.</li>
            </ul>
          </Panel>
          <Panel title="Session audit log" icon={FileSearch} actions={<span className="text-[10px] text-muted-foreground">{turns.length} queries</span>}>
            {turns.length === 0 ? (
              <p className="text-xs text-muted-foreground">No queries this session.</p>
            ) : (
              <ol className="space-y-2 max-h-[300px] overflow-y-auto">
                {[...turns].reverse().map((t) => (
                  <li key={t.id} className="text-[11px] border-l-2 border-primary/30 pl-2">
                    <p className="font-mono text-muted-foreground">{fmtTime(t.askedAt)} · {t.askedBy}</p>
                    <p className="text-foreground truncate">{t.question}</p>
                    {t.answer && <p className="text-[10px] text-muted-foreground">{t.answer.engine === "claude" ? "Claude engine" : "Built-in engine"} · {t.answer.results.length} records · confidence {Math.round(t.answer.confidence * 100)}%</p>}
                  </li>
                ))}
              </ol>
            )}
          </Panel>
          {turns.length > 0 && (
            <Panel title="Try next" icon={Sparkles}>
              <div className="space-y-1.5">
                {SUGGESTED.filter((q) => !turns.some((t) => t.question === q)).slice(0, 4).map((q) => (
                  <button key={q} onClick={() => ask(q)} disabled={busy} className="w-full text-left text-[11px] text-muted-foreground hover:text-primary flex items-start gap-1.5 disabled:opacity-40">
                    <ChevronRight className="h-3 w-3 mt-0.5 shrink-0" /> {q}
                  </button>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

function AnswerCard({ answer }: { answer: GuardianAnswer }) {
  const [showAll, setShowAll] = useState(false);
  const pct = Math.round(answer.confidence * 100);
  const confColor = pct >= 80 ? "#22c55e" : pct >= 60 ? "#eab308" : "#f97316";
  const results = showAll ? answer.results : answer.results.slice(0, 8);
  return (
    <div className="max-w-[95%] rounded-lg border border-primary/20 bg-card/70 p-3 space-y-3">
      <div className="flex items-start gap-2">
        <Bot className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-foreground whitespace-pre-line">{answer.answer}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-40">
          <div className="flex justify-between text-[9px] uppercase tracking-[0.14em] text-muted-foreground"><span>Confidence</span><span style={{ color: confColor }}>{pct}%</span></div>
          <Meter value={pct} color={confColor} className="mt-1" />
        </div>
        <Pill color={answer.engine === "claude" ? "#a855f7" : "#22c55e"}>{answer.engine === "claude" ? "Claude engine" : "Built-in engine"}</Pill>
        <span className="text-[10px] text-muted-foreground">{answer.results.length} linked record{answer.results.length === 1 ? "" : "s"}</span>
      </div>

      {answer.results.length > 0 && (
        <div className="rounded-md border border-border/60 divide-y divide-border/50">
          {results.map((r) => {
            const body = (
              <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-secondary/40">
                <Pill color={KIND_COLOR[r.kind] ?? "#94a3b8"} className="capitalize shrink-0">{r.kind}</Pill>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate">{r.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{r.detail}</p>
                </div>
                {r.link && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
              </div>
            );
            return r.link ? <Link key={r.id} to={r.link}>{body}</Link> : <div key={r.id}>{body}</div>;
          })}
          {answer.results.length > 8 && (
            <button onClick={() => setShowAll((v) => !v)} className="w-full text-center text-[11px] text-primary py-1.5 hover:bg-secondary/40">
              {showAll ? "Show fewer" : `Show all ${answer.results.length}`}
            </button>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3 text-[10px]">
        <div>
          <p className="uppercase tracking-[0.14em] text-muted-foreground mb-1">Sources</p>
          <ul className="space-y-0.5 text-foreground/80">{answer.provenance.map((p) => <li key={p}>• {p}</li>)}</ul>
        </div>
        {answer.caveats.length > 0 && (
          <div>
            <p className="uppercase tracking-[0.14em] text-muted-foreground mb-1">Caveats</p>
            <ul className="space-y-0.5 text-warning/90">{answer.caveats.map((c) => <li key={c}>• {c}</li>)}</ul>
          </div>
        )}
      </div>
    </div>
  );
}
