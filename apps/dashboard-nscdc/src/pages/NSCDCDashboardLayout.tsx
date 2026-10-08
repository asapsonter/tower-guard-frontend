import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, Clock, MessageSquare, MapPin, CheckCircle2,
  AlertTriangle, Radio, TrendingUp, Phone, Timer, Loader2,
  UserCheck, UserX, Eye, ChevronDown, ChevronUp, Camera, X, Image
} from "lucide-react";
import { supabase } from "@tower-guard/supabase-client";
import {
  useRealtimeAssignments,
  useRealtimeMessages,
  type DispatchAssignment,
} from "@tower-guard/hooks";
import OfficerRoster from "../components/nscdc/OfficerRoster";
import IncidentTickets from "../components/nscdc/IncidentTickets";
import { resolveFctCouncil, type CouncilResolution } from "../lib/fctCouncil";
import { buildNscdcMockData } from "../lib/mockData";

const STATUSES = ["pending", "accepted", "en-route", "on-site", "resolved"] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  accepted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "en-route": "bg-primary/20 text-primary border-primary/30",
  "on-site": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  resolved: "bg-success/20 text-success border-success/30",
};

interface TeamMember {
  id: string;
  assignment_id: string;
  responder_name: string;
  role: string;
  status: string;
  joined_at: string;
}

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

interface IncidentInfo {
  id: string;
  location: string | null;
  event_type: string;
  severity: string;
  details: string;
  mast_id: string | null;
  status: string;
  source?: string;
}

type TabKey = "overview" | "officers" | "incidents" | "accountability" | "evidence";

// Map URL path segments to tab keys. Driven by react-router useLocation
// so the active tab stays in sync with deep-linking and back/forward navigation.
const PATH_TO_TAB: Record<string, TabKey> = {
  "/station": "overview",
  "/station/officers": "officers",
  "/station/incidents": "incidents",
  "/station/accountability": "accountability",
  "/station/evidence": "evidence",
};
const TAB_TO_PATH: Record<TabKey, string> = {
  overview: "/station",
  officers: "/station/officers",
  incidents: "/station/incidents",
  accountability: "/station/accountability",
  evidence: "/station/evidence",
};

const NSCDCDashboard = () => {
  const location = useLocation();
  const activeTab: TabKey = PATH_TO_TAB[location.pathname] ?? "overview";

  const { assignments: liveAssignments, loading } = useRealtimeAssignments();
  const { messages: liveMessages } = useRealtimeMessages();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [liveTeamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({});
  const [livePerformance, setPerformance] = useState<ResponderPerf[]>([]);
  const [liveEvidencePhotos, setEvidencePhotos] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [evidenceFilter, setEvidenceFilter] = useState<string | null>(null);
  const [liveIncidents, setIncidents] = useState<Record<string, IncidentInfo>>({});

  // GPS-resolved council — defaults to AMAC until geolocation returns.
  // `scope` tells us whether to filter by a single council, widen to all of
  // FCT, or fall back (operator is outside FCT / denied location).
  const [councilRes, setCouncilRes] = useState<CouncilResolution>({ scope: "council", council: "AMAC" });
  const scopeLabel = councilRes.council ?? "FCT";

  // Demo data fills the dashboard while Supabase has no dispatches; real rows
  // take over as soon as the first one arrives.
  const [mock] = useState(() => buildNscdcMockData(Date.now()));
  const usingMock = !loading && liveAssignments.length === 0;
  const assignments = usingMock ? mock.assignments : liveAssignments;
  const messages = usingMock && liveMessages.length === 0 ? mock.messages : liveMessages;
  const teamMembers = usingMock ? mock.teamMembers : liveTeamMembers;
  const incidents: Record<string, IncidentInfo> = usingMock ? mock.incidents : liveIncidents;
  const performance = useMemo(() => {
    if (!usingMock) return livePerformance;
    if (councilRes.scope !== "council") return mock.performance;
    const scoped = mock.performance.filter(p => p.council_area === councilRes.council);
    return scoped.length > 0 ? scoped : mock.performance;
  }, [usingMock, livePerformance, mock, councilRes]);
  const evidencePhotos = useMemo(() => {
    if (!usingMock) return liveEvidencePhotos;
    const incidentFor = new Map(mock.assignments.map(a => [a.id, a.incident_id]));
    return mock.messages
      .filter(m => m.message_type === "photo")
      .map(m => ({
        id: m.id,
        assignment_id: m.assignment_id,
        incident_id: incidentFor.get(m.assignment_id) || m.assignment_id,
        sender_name: m.sender_name,
        content: m.content || "",
        created_at: m.created_at,
      }));
  }, [usingMock, liveEvidencePhotos, mock]);

  // Demo-row timestamp refresh: on every page load, remap demo assignments'
  // dispatched_at to a fresh staggered set so the SLA Timer Wall never shows
  // a seeded dispatch older than ~1h5m. Values are in minutes-ago from the
  // session's mount time — they stay stable while the page is open, so the
  // on-screen timer ticks forward naturally. On refresh, the set resets.
  const [sessionMount] = useState(() => Date.now());
  const DEMO_MINS_AGO = [65, 45, 25, 5] as const; // oldest → newest, 20m apart

  // Map demo assignment id → overridden dispatched_at (ISO string).
  // Ordered so the oldest seed row (by its stored timestamp) gets the oldest
  // slot (-65m), keeping the lifecycle progression (on-site → en-route →
  // accepted → pending) consistent with what the Timer Wall renders.
  const demoDispatchOverride = useMemo<Record<string, string>>(() => {
    const demoRows = assignments
      .filter(a => incidents[a.incident_id]?.source === "seed_demo")
      .slice()
      .sort((a, b) => new Date(a.dispatched_at).getTime() - new Date(b.dispatched_at).getTime());
    const map: Record<string, string> = {};
    demoRows.forEach((a, i) => {
      const minsAgo = DEMO_MINS_AGO[Math.min(i, DEMO_MINS_AGO.length - 1)];
      map[a.id] = new Date(sessionMount - minsAgo * 60_000).toISOString();
    });
    return map;
  }, [assignments, incidents, sessionMount]);

  const dispatchedAtFor = (a: DispatchAssignment): string =>
    demoDispatchOverride[a.id] ?? a.dispatched_at;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Ask the browser for the operator's current position once on mount.
  // Silent failure — if the user denies, we keep the AMAC default.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCouncilRes(resolveFctCouncil(pos.coords.latitude, pos.coords.longitude)),
      () => { /* permission denied or unavailable — keep default */ },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  // Fetch incidents linked to assignments for location names
  const fetchIncidents = useCallback(async () => {
    if (!supabase) return;
    const incidentIds = [...new Set(assignments.map(a => a.incident_id))];
    if (incidentIds.length === 0) return;
    const { data } = await supabase
      .from("incidents")
      .select("id, location, event_type, severity, details, mast_id, status, source")
      .in("id", incidentIds);
    if (data) {
      const map: Record<string, IncidentInfo> = {};
      data.forEach((i: any) => { map[i.id] = i; });
      setIncidents(map);
    }
  }, [assignments]);

  const fetchTeamMembers = useCallback(async () => {
    if (!supabase) return;
    // Fetch up to 5000 recent team members to cover all visible assignments
    const { data } = await supabase
      .from("dispatch_team_members")
      .select("*")
      .order("joined_at", { ascending: false })
      .limit(5000);
    if (data) {
      const grouped: Record<string, TeamMember[]> = {};
      data.forEach((m: any) => {
        if (!grouped[m.assignment_id]) grouped[m.assignment_id] = [];
        grouped[m.assignment_id].push(m);
      });
      setTeamMembers(grouped);
    }
  }, []);

  const fetchPerformance = useCallback(async () => {
    if (!supabase) return;
    // Narrow to the GPS-resolved council. When the operator is inside FCT
    // but outside any known AC box (or outside FCT entirely), drop the
    // filter so they see all FCT council performance instead of an empty
    // list — otherwise a responder sitting 500m across a boundary gets a
    // blank accountability view.
    let query = supabase
      .from("responder_performance")
      .select("*")
      .order("total_dispatches", { ascending: false });
    if (councilRes.scope === "council" && councilRes.council) {
      query = query.eq("council_area", councilRes.council);
    }
    const { data } = await query;
    if (data) setPerformance(data as ResponderPerf[]);
  }, [councilRes]);

  const fetchEvidence = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("responder_messages")
      .select("*")
      .eq("message_type", "photo")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) {
      const assignmentIncidentMap = new Map(assignments.map(a => [a.id, a.incident_id]));
      setEvidencePhotos(data.map(m => ({
        id: m.id,
        assignment_id: m.assignment_id,
        incident_id: assignmentIncidentMap.get(m.assignment_id) || m.assignment_id,
        sender_name: m.sender_name,
        content: m.content || "",
        created_at: m.created_at,
      })));
    }
  }, [assignments]);

  useEffect(() => {
    fetchTeamMembers();
    fetchPerformance();
    fetchEvidence();
    fetchIncidents();
    if (!supabase) return;
    const ch1 = supabase.channel("team-members-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "dispatch_team_members" }, () => fetchTeamMembers())
      .subscribe();
    const ch2 = supabase.channel("perf-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "responder_performance" }, () => fetchPerformance())
      .subscribe();
    const ch3 = supabase.channel("evidence-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "responder_messages" }, () => fetchEvidence())
      .subscribe();
    return () => { supabase!.removeChannel(ch1); supabase!.removeChannel(ch2); supabase!.removeChannel(ch3); };
  }, [fetchTeamMembers, fetchPerformance, fetchEvidence, fetchIncidents]);

  // Dispatch board sort: STRICT FIFO (first in, first out).
  //
  // The longer an incident has been waiting, the higher its priority. The
  // oldest unresolved dispatch is at the top of the board because it's
  // the one most likely to breach SLA.
  //
  // The only exception: resolved incidents sink to the bottom of the list
  // (otherwise an old resolved row would push active alerts off-screen).
  // Within each tier — active and resolved — strict ascending dispatched_at.
  const sortedAssignments = [...assignments].sort((a, b) => {
    const aResolved = a.status === "resolved";
    const bResolved = b.status === "resolved";
    if (aResolved !== bResolved) return aResolved ? 1 : -1; // active first
    // Same tier → oldest dispatched_at first (FIFO)
    return new Date(a.dispatched_at).getTime() - new Date(b.dispatched_at).getTime();
  });
  const filteredAssignments = selectedStatus
    ? sortedAssignments.filter(a => a.status === selectedStatus)
    : sortedAssignments;

  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s] = assignments.filter(a => a.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const acceptedAssignments = assignments.filter(a => a.accepted_at);
  const avgResponseTime = acceptedAssignments.length > 0
    ? Math.floor(acceptedAssignments.reduce((sum, a) => sum + ((new Date(a.accepted_at!).getTime() - new Date(a.dispatched_at).getTime()) / 1000), 0) / acceptedAssignments.length)
    : 0;

  const formatElapsed = (from: string) => {
    const diff = Math.floor((now - new Date(from).getTime()) / 1000);
    const d = Math.floor(diff / 86400);
    const h = Math.floor((diff % 86400) / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    if (d > 0) return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    if (h > 0) return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    return `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <Radio className="h-3 w-3" /> },
    { key: "officers", label: "Officers", icon: <Users className="h-3 w-3" /> },
    { key: "incidents", label: "Incident Tickets", icon: <AlertTriangle className="h-3 w-3" /> },
    { key: "accountability", label: "Accountability", icon: <UserCheck className="h-3 w-3" /> },
    { key: "evidence", label: "Evidence Gallery", icon: <Camera className="h-3 w-3" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-600/20 border border-green-600/30 flex items-center justify-center">
            <Shield className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">NSCDC Centralised State Dashboard - FCT</h1>
            <p className="text-xs text-muted-foreground">Federal Capital Territory • Telecom Mast Response Monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {usingMock && (
            <span
              className="px-2.5 py-1 rounded-full bg-warning/10 border border-warning/40 text-[10px] font-semibold text-warning"
              title="No live dispatches in Supabase — showing sample data"
            >
              DEMO DATA
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full bg-secondary border border-border text-[10px] font-semibold text-foreground">📍 {scopeLabel}{councilRes.scope === "out-of-fct" ? " (outside FCT)" : councilRes.scope === "fct" ? ", FCT" : ", Abuja"}</span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/30 text-[10px] font-semibold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            LIVE
          </span>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedStatus(selectedStatus === s ? null : s)}
            className={`glass-panel p-3 text-center transition-all ${selectedStatus === s ? "ring-2 ring-primary" : ""}`}
          >
            <p className="text-2xl font-bold text-foreground">{statusCounts[s]}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{s.replace("-", " ")}</p>
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="glass-panel p-3 flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <div><p className="text-lg font-bold text-foreground">{performance.length}</p><p className="text-[10px] text-muted-foreground">Total Officers</p></div>
        </div>
        <div className="glass-panel p-3 flex items-center gap-3">
          <Timer className="h-5 w-5 text-warning" />
          <div><p className="text-lg font-bold text-foreground">{Math.floor(avgResponseTime / 60)}m {avgResponseTime % 60}s</p><p className="text-[10px] text-muted-foreground">Avg Accept Time</p></div>
        </div>
        <div className="glass-panel p-3 flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-success" />
          <div><p className="text-lg font-bold text-foreground">{Math.round((statusCounts.resolved / Math.max(1, assignments.length)) * 100)}%</p><p className="text-[10px] text-muted-foreground">Resolution Rate</p></div>
        </div>
        <div className="glass-panel p-3 flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-blue-400" />
          <div><p className="text-lg font-bold text-foreground">{messages.length}</p><p className="text-[10px] text-muted-foreground">Comms Today</p></div>
        </div>
      </div>

      {/* Tab switcher — NavLinks update the URL, which drives activeTab via useLocation */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg w-fit flex-wrap">
        {TABS.map(t => (
          <NavLink
            key={t.key}
            to={TAB_TO_PATH[t.key]}
            end={t.key === "overview"}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            {t.icon} {t.label}
          </NavLink>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Dispatch Board */}
          <div className="lg:col-span-2 glass-panel flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
              <Radio className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Dispatch Board — FCT</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{filteredAssignments.length} assignments</span>
            </div>
            <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
              {filteredAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No assignments — waiting for Tower Guard alerts</p>
                </div>
              ) : (
                filteredAssignments.map((a) => {
                  const team = teamMembers[a.id] || [];
                  const teamLead = team.find(t => t.role === "team_lead");
                  const incident = incidents[a.incident_id];
                  const siteName = incident?.location || incident?.mast_id || "Unknown Site";
                  return (
                    <div key={a.id} className="rounded-lg bg-secondary/50 border border-border/50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-xs font-semibold text-foreground">{siteName}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${STATUS_COLORS[a.status] || STATUS_COLORS.pending}`}>
                            {a.status.toUpperCase()}
                          </span>
                        </div>
                        {a.status !== "resolved" && <span className="text-xs font-mono text-warning">{formatElapsed(dispatchedAtFor(a))}</span>}
                      </div>
                      {incident && (
                        <p className="text-[10px] text-muted-foreground">{incident.event_type} — {incident.details.slice(0, 80)}{incident.details.length > 80 ? "…" : ""}</p>
                      )}
                      {/* Officers responding — fall back to assignment-level
                          responder_name when no formal team members are seeded */}
                      {(() => {
                        const effectiveCount = team.length > 0
                          ? team.length
                          : a.responder_name ? 1 : 0;
                        return (
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {team.length > 0 ? team.map(m => (
                              <span
                                key={m.id}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                                  m.status === "ducked"
                                    ? "bg-destructive/20 text-destructive border-destructive/40"
                                    : m.role === "team_lead"
                                    ? "bg-primary/20 text-primary border-primary/40"
                                    : "bg-secondary text-muted-foreground border-border"
                                }`}
                              >
                                {m.role === "team_lead" && <Shield className="h-2.5 w-2.5" />}
                                {m.status === "ducked" && <UserX className="h-2.5 w-2.5" />}
                                {m.responder_name}
                              </span>
                            )) : a.responder_name ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border bg-primary/20 text-primary border-primary/40">
                                <Shield className="h-2.5 w-2.5" />
                                {a.responder_name}
                              </span>
                            ) : (
                              <span className="text-[9px] text-muted-foreground italic">
                                Awaiting acceptance
                              </span>
                            )}
                            <span className="ml-auto text-[9px] font-bold text-foreground">
                              <Users className="h-2.5 w-2.5 inline mr-0.5" />
                              {effectiveCount} officer{effectiveCount !== 1 ? "s" : ""} responding
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Live comms */}
          <div className="glass-panel flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
              <MessageSquare className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-semibold text-foreground">Live Comms Feed</span>
              <span className="ml-auto h-2 w-2 rounded-full bg-success animate-pulse" />
            </div>
            <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No communications yet</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2.5 rounded-lg text-xs ${
                      m.sender_role === "command"
                        ? "bg-primary/10 border border-primary/20 ml-4"
                        : "bg-secondary/50 border border-border/50 mr-4"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-foreground text-[10px]">{m.sender_name}</span>
                      <span className="text-[9px] text-muted-foreground">{new Date(m.created_at).toLocaleTimeString()}</span>
                    </div>
                    {m.message_type === "voice" ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3 text-primary" />
                        <div className="flex-1 h-4 rounded-full bg-primary/20 flex items-center px-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 20 }).map((_, i) => (
                              <div key={i} className="w-0.5 bg-primary/60 rounded-full" style={{ height: `${Math.random() * 12 + 4}px` }} />
                            ))}
                          </div>
                        </div>
                        <span className="text-[9px]">{m.voice_duration_seconds}s</span>
                      </div>
                    ) : m.message_type === "photo" && m.content ? (
                      <div className="space-y-1">
                        <p className="text-[9px] flex items-center gap-1 text-muted-foreground">
                          <Camera className="h-2.5 w-2.5" /> Evidence Photo
                        </p>
                        <img
                          src={m.content}
                          alt="Evidence from responder"
                          className="rounded-md max-w-full cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedPhoto(m.content)}
                        />
                      </div>
                    ) : (
                      <p className="text-foreground">{m.content}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ OFFICERS TAB ═══ */}
      {activeTab === "officers" && (
        <OfficerRoster
          performance={performance}
          teamMembers={teamMembers}
          assignments={assignments as any}
          scopeLabel={scopeLabel}
        />
      )}

      {/* ═══ INCIDENT TICKETS TAB ═══ */}
      {activeTab === "incidents" && (
        <IncidentTickets
          assignments={assignments as any}
          teamMembers={teamMembers}
          messages={messages}
          scopeLabel={scopeLabel}
          mockIncidents={usingMock ? mock.incidents : undefined}
        />
      )}

      {/* ═══ ACCOUNTABILITY TAB ═══ */}
      {activeTab === "accountability" && (
        <div className="glass-panel">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
            <UserCheck className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Responder Accountability — {councilRes.council ? `${councilRes.council} Council` : "FCT"}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{performance.length} responders tracked</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50 text-[10px] text-muted-foreground uppercase tracking-wider">
                  <th className="text-left px-4 py-2">Responder</th>
                  <th className="text-center px-2 py-2">Dispatches</th>
                  <th className="text-center px-2 py-2">Accepted</th>
                  <th className="text-center px-2 py-2">Rejected</th>
                  <th className="text-center px-2 py-2">Ducked</th>
                  <th className="text-center px-2 py-2">Avg Response</th>
                  <th className="text-center px-2 py-2">Rating</th>
                  <th className="text-right px-4 py-2">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {performance.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No performance data yet</td></tr>
                ) : (
                  performance.map(p => {
                    const reliability = p.total_dispatches > 0 ? Math.round((p.total_accepted / p.total_dispatches) * 100) : 0;
                    const ratingColor = reliability >= 80 ? "text-success" : reliability >= 50 ? "text-warning" : "text-destructive";
                    return (
                      <tr key={p.id} className={`border-b border-border/30 hover:bg-secondary/30 ${p.total_ducked > 0 ? "bg-destructive/5" : ""}`}>
                        <td className="px-4 py-2.5 font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            {p.responder_name}
                            {p.total_ducked > 0 && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive font-bold border border-destructive/30 flex items-center gap-0.5">
                                <AlertTriangle className="h-2.5 w-2.5" /> DUCKER
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-center px-2 py-2.5">{p.total_dispatches}</td>
                        <td className="text-center px-2 py-2.5 text-success font-semibold">{p.total_accepted}</td>
                        <td className="text-center px-2 py-2.5 text-warning font-semibold">{p.total_rejected}</td>
                        <td className="text-center px-2 py-2.5">
                          {p.total_ducked > 0 ? (
                            <span className="text-destructive font-bold flex items-center justify-center gap-1">
                              <UserX className="h-3 w-3" /> {p.total_ducked}
                            </span>
                          ) : <span className="text-muted-foreground">0</span>}
                        </td>
                        <td className="text-center px-2 py-2.5 font-mono">
                          {p.avg_response_seconds ? `${Math.floor(p.avg_response_seconds / 60)}m ${p.avg_response_seconds % 60}s` : "—"}
                        </td>
                        <td className={`text-center px-2 py-2.5 font-bold ${ratingColor}`}>{reliability}%</td>
                        <td className="text-right px-4 py-2.5 text-muted-foreground">
                          {p.last_active_at ? new Date(p.last_active_at).toLocaleTimeString() : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ EVIDENCE TAB ═══ */}
      {activeTab === "evidence" && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setEvidenceFilter(null)}
              className={`px-3 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                !evidenceFilter ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:text-foreground"
              }`}
            >All Incidents</button>
            {[...new Set(evidencePhotos.map((p: any) => p.incident_id))].map((incId: string) => (
              <button key={incId} onClick={() => setEvidenceFilter(incId)}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                  evidenceFilter === incId ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                }`}
              >INC: {incId.slice(0, 8)}</button>
            ))}
          </div>
          <div className="glass-panel">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
              <Image className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Evidence Photos — {scopeLabel}</span>
            </div>
            <div className="p-4">
              {evidencePhotos.length === 0 ? (
                <div className="text-center py-12">
                  <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No evidence photos uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(evidenceFilter ? evidencePhotos.filter((p: any) => p.incident_id === evidenceFilter) : evidencePhotos).map((photo: any) => (
                    <div key={photo.id} className="group relative rounded-lg overflow-hidden border border-border/50 bg-secondary/30 cursor-pointer hover:border-primary/50 transition-all" onClick={() => setSelectedPhoto(photo.content)}>
                      <div className="aspect-square">
                        <img src={photo.content} alt={`Evidence from ${photo.sender_name}`} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/90 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] font-semibold text-foreground truncate">{photo.sender_name}</p>
                        <p className="text-[9px] text-muted-foreground">INC: {photo.incident_id.slice(0, 8)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <AnimatePresence>
            {selectedPhoto && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
                <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 p-2 rounded-full bg-secondary border border-border hover:bg-destructive/20 transition-colors"><X className="h-5 w-5 text-foreground" /></button>
                <img src={selectedPhoto} alt="Evidence full view" className="max-w-full max-h-[85vh] rounded-lg object-contain" />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* SLA Timer Wall — always visible */}
      <div className="glass-panel">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          <Clock className="h-4 w-4 text-warning" />
          <span className="text-sm font-semibold text-foreground">SLA Timer Wall</span>
          <span className="ml-auto text-[10px] text-muted-foreground">Active incidents requiring response</span>
        </div>
        <div className="p-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {assignments
            .filter(a => a.status !== "resolved")
            // FIFO — oldest first so the most-elapsed timer sits in the
            // top-left corner where the eye lands first. For demo rows we
            // sort on the overridden dispatched_at so the wall stays ordered
            // by what the user sees, not the stale DB timestamp.
            .sort((a, b) => new Date(dispatchedAtFor(a)).getTime() - new Date(dispatchedAtFor(b)).getTime())
            .map(a => {
              const effectiveDispatchedAt = dispatchedAtFor(a);
              const elapsed = Math.floor((now - new Date(effectiveDispatchedAt).getTime()) / 1000);
              const sla = a.sla_seconds || 900;
              const isCritical = elapsed > sla;
              const isWarning = elapsed > sla * 0.66;
              const team = teamMembers[a.id] || [];
              const incident = incidents[a.incident_id];
              const siteName = incident?.location || incident?.mast_id || "Unknown Site";
              return (
                <div key={a.id} className={`p-3 rounded-lg border text-center ${isCritical ? "border-destructive/50 bg-destructive/10" : isWarning ? "border-warning/50 bg-warning/10" : "border-primary/30 bg-primary/5"}`}>
                  <p className="text-[9px] font-semibold text-muted-foreground truncate">{siteName}</p>
                  <p className={`text-xl font-mono font-bold tabular-nums ${isCritical ? "text-destructive animate-pulse" : isWarning ? "text-warning" : "text-primary"}`}>
                    {formatElapsed(effectiveDispatchedAt)}
                  </p>
                  <p className="text-[9px] text-muted-foreground truncate mt-1">
                    {a.responder_name || "Unassigned"}
                    {team.length > 1 ? ` +${team.length - 1}` : ""}
                  </p>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-semibold ${STATUS_COLORS[a.status] || STATUS_COLORS.pending}`}>{a.status}</span>
                </div>
              );
            })}
          {assignments.filter(a => a.status !== "resolved").length === 0 && (
            <div className="col-span-full text-center py-4">
              <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">All incidents resolved</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NSCDCDashboard;
