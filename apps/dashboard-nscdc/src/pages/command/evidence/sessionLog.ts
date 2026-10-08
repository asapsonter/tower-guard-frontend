import { useSyncExternalStore } from "react";
import type { CustodyEvent, EvidenceItem } from "@/lib/cnii";

/**
 * Client-side audit log of evidence actions taken in this browser session
 * (simulated hash re-verification and prosecution-bundle exports). Kept at
 * module level so it survives navigation between workspaces.
 */
export interface SessionEvidenceEvent {
  id: number;
  at: string;
  evidenceId: string;
  kind: "hash_match" | "hash_mismatch" | "export" | "export_blocked";
  actor: string;
  note: string;
}

export const SESSION_ACTOR = "Duty officer (this session)";

let events: SessionEvidenceEvent[] = [];
let seq = 0;
const listeners = new Set<() => void>();

export function logEvidenceEvent(e: Omit<SessionEvidenceEvent, "id" | "at">): SessionEvidenceEvent {
  const full = { ...e, id: ++seq, at: new Date().toISOString() };
  events = [full, ...events];
  listeners.forEach((l) => l());
  return full;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useSessionEvidenceLog(): SessionEvidenceEvent[] {
  return useSyncExternalStore(subscribe, () => events, () => events);
}

/** Session events expressed as custody-trail entries so they appear on the timeline. */
export function sessionCustody(item: EvidenceItem, log: SessionEvidenceEvent[]): (CustodyEvent & { session?: boolean; failed?: boolean })[] {
  return log
    .filter((e) => e.evidenceId === item.id && e.kind !== "export_blocked")
    .map((e) => ({
      at: e.at,
      actor: e.actor,
      action: e.kind === "export" ? "exported" : "verified",
      note: e.note,
      session: true,
      failed: e.kind === "hash_mismatch",
    }));
}

/** Simulates recomputing SHA-256 over the stored original. */
export function simulateRehash(item: EvidenceItem): string {
  if (item.hashVerified) return item.sha256;
  // A tampered / unverifiable original yields a different digest.
  const flip = (ch: string) => "0123456789abcdef"[(parseInt(ch, 16) + 7) % 16];
  return item.sha256.slice(0, 40) + item.sha256.slice(40).split("").map(flip).join("");
}

export function custodyGapReason(item: EvidenceItem): string | null {
  if (item.custodyIntact) return null;
  const bad = item.custody.find((c) => c.note?.toLowerCase().includes("custody gap") || c.note?.toLowerCase().includes("without"));
  return bad ? `${bad.action === "exported" ? "Unauthorised export" : "Custody gap"} — ${bad.actor}` : "Custody gap in trail";
}
