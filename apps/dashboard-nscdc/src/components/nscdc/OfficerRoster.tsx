import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserCheck, UserX, Shield, ChevronRight, X,
  AlertTriangle, Clock, CheckCircle2, TrendingUp
} from "lucide-react";

interface ResponderPerf {
  id: string;
  responder_name: string;
  responder_id: string | null;
  total_dispatches: number;
  total_accepted: number;
  total_rejected: number;
  total_ducked: number;
  avg_response_seconds: number | null;
  council_area: string;
  last_active_at: string | null;
}

interface TeamMember {
  id: string;
  assignment_id: string;
  responder_name: string;
  role: string;
  status: string;
  joined_at: string;
}

interface Assignment {
  id: string;
  incident_id: string;
  status: string;
  dispatched_at: string;
  responder_name: string | null;
  accepted_at: string | null;
  on_site_at: string | null;
  en_route_at: string | null;
  resolved_at: string | null;
}

interface Props {
  performance: ResponderPerf[];
  teamMembers: Record<string, TeamMember[]>;
  assignments: Assignment[];
  scopeLabel?: string;
}

type DutyStatus = "ON SITE" | "EN ROUTE" | "DEPLOYED" | "STANDBY";

const DUTY_STYLES: Record<DutyStatus, string> = {
  "ON SITE": "bg-orange-500/20 text-orange-400 border-orange-500/40",
  "EN ROUTE": "bg-primary/20 text-primary border-primary/40",
  "DEPLOYED": "bg-blue-500/20 text-blue-400 border-blue-500/40",
  "STANDBY": "bg-muted text-muted-foreground border-border",
};

function getOfficerDutyStatus(
  name: string,
  teamMembers: Record<string, TeamMember[]>,
  assignments: Assignment[]
): { status: DutyStatus; activeAssignments: Assignment[] } {
  // Find all assignments this officer is clipped to (via team members)
  const clippedAssignmentIds = new Set<string>();
  Object.entries(teamMembers).forEach(([aId, members]) => {
    if (members.some(m => m.responder_name === name && m.status === "active")) {
      clippedAssignmentIds.add(aId);
    }
  });

  // Also check if they're the primary responder
  assignments.forEach(a => {
    if (a.responder_name === name && a.status !== "resolved") {
      clippedAssignmentIds.add(a.id);
    }
  });

  const active = assignments.filter(a => clippedAssignmentIds.has(a.id) && a.status !== "resolved");

  if (active.some(a => a.status === "on-site")) return { status: "ON SITE", activeAssignments: active };
  if (active.some(a => a.status === "en-route")) return { status: "EN ROUTE", activeAssignments: active };
  if (active.length > 0) return { status: "DEPLOYED", activeAssignments: active };
  return { status: "STANDBY", activeAssignments: [] };
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  accepted: "bg-blue-500/20 text-blue-400",
  "en-route": "bg-primary/20 text-primary",
  "on-site": "bg-orange-500/20 text-orange-400",
  resolved: "bg-success/20 text-success",
};

export default function OfficerRoster({ performance, teamMembers, assignments, scopeLabel = "AMAC" }: Props) {
  const [selectedOfficer, setSelectedOfficer] = useState<string | null>(null);

  // Build officer list from performance data, enriched with live status
  const officers = performance.map(p => {
    const { status, activeAssignments } = getOfficerDutyStatus(p.responder_name, teamMembers, assignments);
    const reliability = p.total_dispatches > 0
      ? Math.round((p.total_accepted / p.total_dispatches) * 100)
      : 0;
    // All assignments (including resolved) this officer was on
    const allAssignmentIds = new Set<string>();
    Object.entries(teamMembers).forEach(([aId, members]) => {
      if (members.some(m => m.responder_name === p.responder_name)) allAssignmentIds.add(aId);
    });
    assignments.forEach(a => {
      if (a.responder_name === p.responder_name) allAssignmentIds.add(a.id);
    });
    const allAssignments = assignments.filter(a => allAssignmentIds.has(a.id));

    return { ...p, dutyStatus: status, activeAssignments, allAssignments, reliability };
  });

  // Sort: active officers first, then by dispatches
  officers.sort((a, b) => {
    const order: Record<DutyStatus, number> = { "ON SITE": 0, "EN ROUTE": 1, "DEPLOYED": 2, "STANDBY": 3 };
    if (order[a.dutyStatus] !== order[b.dutyStatus]) return order[a.dutyStatus] - order[b.dutyStatus];
    return b.total_dispatches - a.total_dispatches;
  });

  const selected = selectedOfficer ? officers.find(o => o.id === selectedOfficer) : null;

  return (
    <div className="space-y-3">
      <div className="glass-panel">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{scopeLabel} Officers Roster</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{officers.length} officers</span>
        </div>

        {/* Summary bar */}
        <div className="flex gap-3 px-4 py-2 border-b border-border/30 text-[10px]">
          {(["ON SITE", "EN ROUTE", "DEPLOYED", "STANDBY"] as DutyStatus[]).map(s => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded-full border font-bold ${DUTY_STYLES[s]}`}>{s}</span>
              <span className="text-muted-foreground font-semibold">{officers.filter(o => o.dutyStatus === s).length}</span>
            </span>
          ))}
        </div>

        <div className="divide-y divide-border/30 max-h-[500px] overflow-y-auto">
          {officers.map(o => {
            const isDucker = o.total_ducked > 0;
            return (
              <button
                key={o.id}
                onClick={() => setSelectedOfficer(selectedOfficer === o.id ? null : o.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-all text-left ${
                  selectedOfficer === o.id ? "bg-secondary/70" : ""
                }`}
              >
                {/* Avatar */}
                <div className={`relative h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold ${
                  isDucker ? "bg-destructive/20 text-destructive border-2 border-destructive/40" : "bg-primary/20 text-primary border-2 border-primary/30"
                }`}>
                  {o.responder_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  {isDucker && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive flex items-center justify-center">
                      <AlertTriangle className="h-2.5 w-2.5 text-destructive-foreground" />
                    </span>
                  )}
                </div>

                {/* Name + info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground truncate">{o.responder_name}</span>
                    {isDucker && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive font-bold border border-destructive/30">
                        {o.total_ducked} DUCKED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <span>{o.total_dispatches} dispatches</span>
                    <span>•</span>
                    <span className={o.reliability >= 80 ? "text-success" : o.reliability >= 50 ? "text-warning" : "text-destructive"}>
                      {o.reliability}% reliability
                    </span>
                  </div>
                </div>

                {/* Duty status badge */}
                <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold whitespace-nowrap ${DUTY_STYLES[o.dutyStatus]}`}>
                  {o.dutyStatus}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            );
          })}
          {officers.length === 0 && (
            <div className="text-center py-8">
              <Shield className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No officers registered for {scopeLabel}</p>
            </div>
          )}
        </div>
      </div>

      {/* Officer Detail Drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-panel overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  selected.total_ducked > 0 ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
                }`}>
                  {selected.responder_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{selected.responder_name}</h3>
                  <p className="text-[10px] text-muted-foreground">{scopeLabel} Area Officer</p>
                </div>
              </div>
              <button onClick={() => setSelectedOfficer(null)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4">
              <div className="p-3 rounded-lg bg-secondary/50 text-center">
                <p className="text-lg font-bold text-foreground">{selected.total_dispatches}</p>
                <p className="text-[9px] text-muted-foreground">Total Dispatches</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10 text-center">
                <p className="text-lg font-bold text-success">{selected.total_accepted}</p>
                <p className="text-[9px] text-muted-foreground">Accepted</p>
              </div>
              <div className="p-3 rounded-lg bg-warning/10 text-center">
                <p className="text-lg font-bold text-warning">{selected.total_rejected}</p>
                <p className="text-[9px] text-muted-foreground">Rejected</p>
              </div>
              <div className={`p-3 rounded-lg text-center ${selected.total_ducked > 0 ? "bg-destructive/10" : "bg-secondary/50"}`}>
                <p className={`text-lg font-bold ${selected.total_ducked > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {selected.total_ducked}
                </p>
                <p className="text-[9px] text-muted-foreground">Ducked</p>
              </div>
            </div>

            {/* Performance bar */}
            <div className="px-4 pb-2">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-muted-foreground">Reliability Rating</span>
                <span className={`font-bold ${selected.reliability >= 80 ? "text-success" : selected.reliability >= 50 ? "text-warning" : "text-destructive"}`}>
                  {selected.reliability}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${selected.reliability >= 80 ? "bg-success" : selected.reliability >= 50 ? "bg-warning" : "bg-destructive"}`}
                  style={{ width: `${selected.reliability}%` }}
                />
              </div>
            </div>

            {/* Incidents clipped to */}
            <div className="px-4 pb-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Incidents Clipped To ({selected.allAssignments.length})
              </p>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {selected.allAssignments.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground py-2">No incidents on record</p>
                ) : (
                  selected.allAssignments.map(a => {
                    const team = teamMembers[a.id] || [];
                    const isHighlighted = selected.activeAssignments.some(aa => aa.id === a.id);
                    return (
                      <div
                        key={a.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                          isHighlighted ? "border-primary/40 bg-primary/5" : "border-border/30 bg-secondary/30"
                        }`}
                      >
                        <span className="text-[10px] font-mono font-bold text-foreground">{a.incident_id.slice(0, 8)}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_BADGE[a.status] || ""}`}>
                          {a.status.toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] text-muted-foreground ml-auto">
                          <Users className="h-3 w-3" /> {team.length}
                        </span>
                        {/* Show team member names with this officer highlighted */}
                        <div className="flex -space-x-1">
                          {team.slice(0, 4).map(m => (
                            <span
                              key={m.id}
                              className={`h-5 w-5 rounded-full flex items-center justify-center text-[7px] font-bold border ${
                                m.responder_name === selected.responder_name
                                  ? "bg-primary text-primary-foreground border-primary z-10 ring-1 ring-primary/50"
                                  : "bg-secondary text-muted-foreground border-border"
                              }`}
                              title={m.responder_name}
                            >
                              {m.responder_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </span>
                          ))}
                          {team.length > 4 && (
                            <span className="h-5 w-5 rounded-full bg-muted text-[7px] font-bold text-muted-foreground flex items-center justify-center border border-border">
                              +{team.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
