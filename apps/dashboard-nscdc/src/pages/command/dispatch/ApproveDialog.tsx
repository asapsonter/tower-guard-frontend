import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@tower-guard/hooks";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Textarea } from "@tower-guard/ui";
import { approveDispatch, fmtDuration, useCnii, type DispatchRecommendation, type Incident } from "@/lib/cnii";

export type ApproveMode = "recommended" | "override";

interface ApproveDialogProps {
  open: boolean;
  mode: ApproveMode;
  incident: Incident;
  rec: DispatchRecommendation;
  /** Pre-selected alternative when overriding */
  initialUnitId?: string;
  onOpenChange: (open: boolean) => void;
  onApproved: (unitId: string, approvedBy: string) => void;
}

/** Human confirmation step — the only path from an ITIPS recommendation to a dispatch. */
export function ApproveDialog({ open, mode, incident, rec, initialUnitId, onOpenChange, onApproved }: ApproveDialogProps) {
  const { user } = useAuth();
  const { applyDispatch } = useCnii();
  const [officer, setOfficer] = useState("");
  const [unitId, setUnitId] = useState(rec.unitId);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setOfficer(user?.full_name ?? "");
    setUnitId(mode === "override" ? initialUnitId ?? rec.alternatives[0]?.unitId ?? rec.unitId : rec.unitId);
    setReason("");
    setError(null);
  }, [open, mode, initialUnitId, rec, user]);

  const override = mode === "override";
  const alt = rec.alternatives.find((a) => a.unitId === unitId);
  const chosen = override && alt
    ? { callsign: alt.callsign, km: alt.distanceKm, eta: alt.etaSeconds }
    : { callsign: rec.callsign, km: rec.distanceKm, eta: rec.etaSeconds };
  const valid = officer.trim().length > 1 && (!override || (reason.trim().length >= 5 && !!alt));

  async function submit() {
    if (!valid) return;
    setBusy(true);
    setError(null);
    const approvedBy = override ? `${officer.trim()} (override of ${rec.callsign}: ${reason.trim()})` : officer.trim();
    try {
      const result = await approveDispatch(incident.id, unitId, approvedBy);
      applyDispatch(result);
      onApproved(unitId, officer.trim());
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dispatch failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[14px]">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {override ? "Override recommendation & dispatch" : "Approve dispatch"}
          </DialogTitle>
          <DialogDescription>
            AI recommends; authorised officers command. This approval is recorded in the incident timeline and the SLA audit trail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-[12px]">
          <div className="rounded-md border border-primary/20 bg-primary/5 p-3 grid grid-cols-2 gap-2">
            <div><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Incident</p><p className="font-mono text-primary">{incident.id}</p></div>
            <div><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Threat</p><p>{rec.threat}</p></div>
            <div><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Unit</p><p className="font-mono font-bold">{chosen.callsign}</p></div>
            <div><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Distance · ETA</p><p className="font-mono">{chosen.km} km · {fmtDuration(chosen.eta)}</p></div>
          </div>

          {override && (
            <>
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Alternative unit</span>
                <select value={unitId} onChange={(e) => setUnitId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-[12px]">
                  {rec.alternatives.map((a) => (
                    <option key={a.unitId} value={a.unitId}>{a.callsign} — {a.distanceKm} km, ETA {fmtDuration(a.etaSeconds)} ({a.reasonNotTop})</option>
                  ))}
                </select>
              </label>
              {alt && alt.reasonNotTop.match(/offline|equipment|armed|radius/) && (
                <p className="rounded border border-warning/40 bg-warning/10 px-2 py-1 text-[11px] text-warning">Compliance warning: {alt.reasonNotTop}</p>
              )}
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Reason for override (required)</span>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="mt-1 text-[12px]"
                  placeholder="e.g. ABJ-14 committed to VIP escort; ABJ-09 has local knowledge of access road" />
              </label>
            </>
          )}

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Approving officer</span>
            <Input value={officer} onChange={(e) => setOfficer(e.target.value)} className="mt-1 text-[12px]" placeholder="Rank and name" />
          </label>
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={!valid || busy}>{busy ? "Dispatching…" : `Confirm dispatch of ${chosen.callsign}`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
