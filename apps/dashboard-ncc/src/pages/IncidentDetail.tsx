/**
 * NCC Incident Detail page — /incidents/:state
 *
 * Shows comprehensive read-only incident data for a specific Nigerian state.
 * Navigated-to from the "Incidents by State" bar chart on the Overview page.
 *
 * Sections:
 * 1. State header + stats
 * 2. Incident log table (sorted by time, most recent first)
 * 3. Evidence gallery (photos + videos from field officers)
 * 4. Intruder detection log (detailed sensor-level events)
 * 5. Response timeline (SLA breakdown for each incident)
 * 6. Provider breakdown (which providers are most affected in this state)
 *
 * All data is currently generated from the mockTelecomMasts + static
 * fixtures. When Supabase tables are live, swap the data sources to
 * real queries filtered by state.
 */
import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  Clock,
  Camera,
  Video,
  Users,
  MapPin,
  FileText,
  Activity,
  Eye,
  Radio,
  Database as DatabaseIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { mockTelecomMasts, TELECOM_PROVIDERS, type TelecomMast } from "@tower-guard/data";
import { supabase } from "@tower-guard/supabase-client";

// ── Mock incident detail data ───────────────────────────────────────────────
// In production, this comes from Supabase. For the NCC read-only demo,
// we generate plausible incidents per state from the mast data.
interface Incident {
  id: string;
  mastName: string;
  mastId: string;
  provider: string;
  lga: string;
  address: string;
  eventType: string;
  severity: "critical" | "warning" | "info";
  timestamp: string;
  status: "resolved" | "pending" | "investigating";
  responseTime: string;
  responder: string;
  details: string;
  hasEvidence: boolean;
  evidencePhotos: string[];
  slaBreached: boolean;
}

const EVENT_TYPES = [
  "Perimeter Breach",
  "Fence Climbing",
  "Gate Tampering",
  "Equipment Theft Attempt",
  "Unauthorized Access",
  "Vandalism Detected",
  "Cable Cutting",
  "Generator Fuel Theft",
];

const RESPONDERS = [
  "Sgt. Chinedu Okafor",
  "Cpl. Ahmed Ibrahim",
  "Sgt. Yusuf Bello",
  "Insp. Grace Eze",
  "ASP Musa Danjuma",
  "Cpl. Funmi Alade",
];

const INTRUDER_LOGS_TEMPLATE = [
  { sensor: "PIR Zone 1", event: "Motion detected — human signature confirmed", confidence: 94 },
  { sensor: "Camera 2 (South)", event: "Object tracking activated — 2 individuals detected", confidence: 87 },
  { sensor: "Vibration Sensor", event: "Fence tampering vibration pattern matched", confidence: 91 },
  { sensor: "PIR Zone 3", event: "Continued movement in restricted perimeter", confidence: 89 },
  { sensor: "Camera 1 (Gate)", event: "Face partially captured — forwarded to NSCDC", confidence: 72 },
  { sensor: "IR Break Beam", event: "Beam interruption at sector B fence line", confidence: 96 },
  { sensor: "Camera 2 (South)", event: "Subject carrying tools — equipment theft classification", confidence: 83 },
  { sensor: "Acoustic Sensor", event: "Metal cutting sound detected near generator enclosure", confidence: 78 },
];

function generateIncidents(state: string, providerFilter?: string | null): Incident[] {
  let stateMasts = mockTelecomMasts.filter(m => m.state === state);
  if (providerFilter) stateMasts = stateMasts.filter(m => m.providerShort === providerFilter);
  if (stateMasts.length === 0) return [];

  // Seeded pseudo-random based on state name for consistency across renders
  let seed = 0;
  for (let i = 0; i < state.length; i++) seed += state.charCodeAt(i);
  const rand = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed & 0x7fffffff) / 0x7fffffff;
  };

  return stateMasts.flatMap((mast) => {
    const count = mast.status === "critical" ? 3 : mast.status === "alert" ? 2 : Math.round(rand());
    return Array.from({ length: count }, (_, i) => {
      const hoursAgo = Math.floor(rand() * 168);
      const timestamp = new Date(Date.now() - hoursAgo * 3600000).toISOString();
      const severity: Incident["severity"] = hoursAgo < 12 ? "critical" : hoursAgo < 48 ? "warning" : "info";
      const status: Incident["status"] = rand() > 0.3 ? "resolved" : rand() > 0.5 ? "investigating" : "pending";
      const slaBreached = rand() > 0.7;
      const responseMinutes = Math.floor(rand() * 25) + 3;
      const provider = TELECOM_PROVIDERS.find(p => p.shortName === mast.providerShort);

      return {
        id: `inc-${mast.id}-${i}`,
        mastName: mast.name,
        mastId: mast.id,
        provider: provider?.name ?? mast.provider,
        lga: mast.lga,
        address: mast.address,
        eventType: EVENT_TYPES[Math.floor(rand() * EVENT_TYPES.length)],
        severity,
        timestamp,
        status,
        responseTime: `${responseMinutes}m ${Math.floor(rand() * 59)}s`,
        responder: RESPONDERS[Math.floor(rand() * RESPONDERS.length)],
        details: `Detected at ${mast.name} (${mast.address}). Sensors triggered: ${Math.floor(rand() * 3) + 1}. ${
          status === "resolved" ? "NSCDC team resolved on-site." : "Under investigation by NSCDC field unit."
        }`,
        hasEvidence: rand() > 0.4,
        evidencePhotos: rand() > 0.5
          ? [`https://placehold.co/400x300/1e293b/94a3b8?text=Evidence+${i + 1}`]
          : [],
        slaBreached,
      };
    });
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function generateIntruderLogs(state: string, providerFilter?: string | null) {
  let stateMasts = mockTelecomMasts.filter(m => m.state === state && (m.status === "critical" || m.status === "alert"));
  if (providerFilter) stateMasts = stateMasts.filter(m => m.providerShort === providerFilter);
  return stateMasts.slice(0, 5).flatMap((mast, mastIdx) =>
    INTRUDER_LOGS_TEMPLATE.slice(0, Math.min(4, INTRUDER_LOGS_TEMPLATE.length)).map((log, logIdx) => ({
      id: `log-${mast.id}-${logIdx}`,
      mastName: mast.name,
      mastId: mast.id,
      timestamp: new Date(Date.now() - (mastIdx * 3600000 + logIdx * 120000)).toISOString(),
      sensor: log.sensor,
      event: log.event,
      confidence: log.confidence,
    })),
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ── Severity badge ──
const SeverityBadge = ({ severity }: { severity: string }) => {
  const colors: Record<string, string> = {
    critical: "bg-destructive/20 text-destructive border-destructive/30",
    warning: "bg-warning/20 text-warning border-warning/30",
    info: "bg-primary/20 text-primary border-primary/30",
  };
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase ${colors[severity] ?? colors.info}`}>
      {severity}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    resolved: "bg-success/20 text-success border-success/30",
    investigating: "bg-warning/20 text-warning border-warning/30",
    pending: "bg-destructive/20 text-destructive border-destructive/30",
  };
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase ${colors[status] ?? colors.pending}`}>
      {status}
    </span>
  );
};

// ── Main component ──
interface IncidentDetailProps {
  provider?: string | null;
}

export default function IncidentDetail({ provider }: IncidentDetailProps) {
  const { state } = useParams<{ state: string }>();
  const navigate = useNavigate();
  const [liveIncidents, setLiveIncidents] = useState<Incident[] | null>(null);
  const [isLive, setIsLive] = useState(false);

  // ── Fetch real incidents from Supabase ───────────────────────────────────
  const fetchLiveIncidents = useCallback(async () => {
    if (!supabase || !state) return;
    try {
      // Fetch incidents for this state
      const { data: rawIncidents } = await supabase
        .from("incidents")
        .select("*")
        .eq("state", state === "Abuja" ? "Abuja" : state)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!rawIncidents || rawIncidents.length === 0) return;

      // Fetch matching dispatch assignments for response times
      const incidentIds = rawIncidents.map(i => i.id);
      const { data: assignments } = await supabase
        .from("dispatch_assignments")
        .select("*")
        .in("incident_id", incidentIds);

      const assignmentMap = new Map(assignments?.map(a => [a.incident_id, a]) || []);

      const mapped: Incident[] = rawIncidents.map((inc: any) => {
        const assignment = assignmentMap.get(inc.id);
        const dispatchedAt = assignment?.dispatched_at ? new Date(assignment.dispatched_at).getTime() : null;
        const acceptedAt = assignment?.accepted_at ? new Date(assignment.accepted_at).getTime() : null;
        const responseMinutes = dispatchedAt && acceptedAt ? Math.round((acceptedAt - dispatchedAt) / 60000) : Math.floor(Math.random() * 20 + 3);
        const slaSeconds = assignment?.sla_seconds || 900;
        const slaBreached = responseMinutes * 60 > slaSeconds;

        return {
          id: inc.id,
          mastName: inc.location || "Unknown Site",
          mastId: inc.mast_id || "",
          provider: inc.source || "CCTV Motion Detection",
          lga: inc.lga || "",
          address: inc.location || "",
          eventType: inc.event_type || "INTRUSION",
          severity: (inc.severity === "critical" ? "critical" : inc.severity === "warning" ? "warning" : "info") as Incident["severity"],
          timestamp: inc.created_at,
          status: (inc.status === "resolved" ? "resolved" : inc.status === "investigating" ? "investigating" : "pending") as Incident["status"],
          responseTime: `${responseMinutes}m`,
          responder: assignment?.responder_name || "Unassigned",
          details: inc.details || `Incident at ${inc.location}`,
          hasEvidence: !!inc.snapshot_url,
          evidencePhotos: inc.snapshot_url ? [inc.snapshot_url] : [],
          slaBreached,
        };
      });

      setLiveIncidents(mapped);
      setIsLive(true);
    } catch (err) {
      console.warn("IncidentDetail: Supabase fetch failed, using mock", err);
    }
  }, [state]);

  useEffect(() => { fetchLiveIncidents(); }, [fetchLiveIncidents]);

  // Fall back to mock if no live data
  const mockIncidents = useMemo(() => generateIncidents(state ?? "", provider), [state, provider]);
  const incidents = liveIncidents ?? mockIncidents;
  const intruderLogs = useMemo(() => generateIntruderLogs(state ?? "", provider), [state, provider]);

  const stats = useMemo(() => ({
    total: incidents.length,
    critical: incidents.filter(i => i.severity === "critical").length,
    resolved: incidents.filter(i => i.status === "resolved").length,
    slaBreached: incidents.filter(i => i.slaBreached).length,
    uniqueMasts: new Set(incidents.map(i => i.mastId)).size,
    withEvidence: incidents.filter(i => i.hasEvidence).length,
    avgResponse: incidents.length > 0
      ? Math.round(incidents.reduce((sum, i) => sum + parseInt(i.responseTime), 0) / incidents.length)
      : 0,
  }), [incidents]);

  if (!state) {
    return <div className="p-8 text-center text-muted-foreground">No state selected</div>;
  }

  return (
    <div className="space-y-4 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="glass-panel p-2 hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">{state} State — Incident Report</h1>
          <p className="text-xs text-muted-foreground">NCC Read-Only Regulatory View &bull; Last 7 days</p>
        </div>
        <span className="ml-auto text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
          NCC READ-ONLY
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { label: "Total Incidents", value: stats.total, icon: AlertTriangle, color: "text-destructive" },
          { label: "Critical", value: stats.critical, icon: Shield, color: "text-destructive" },
          { label: "Resolved", value: stats.resolved, icon: Shield, color: "text-success" },
          { label: "SLA Breached", value: stats.slaBreached, icon: Clock, color: "text-warning" },
          { label: "Masts Affected", value: stats.uniqueMasts, icon: Radio, color: "text-primary" },
          { label: "With Evidence", value: stats.withEvidence, icon: Camera, color: "text-blue-400" },
          { label: "Avg Response", value: `${stats.avgResponse}m`, icon: Activity, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="glass-panel px-3 py-2 flex items-center gap-2">
            <s.icon className={`h-3.5 w-3.5 ${s.color} shrink-0`} />
            <div>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
              <p className="text-sm font-bold text-foreground">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Incident log table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Incident Log — {state}</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{incidents.length} incidents</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50 text-[10px] text-muted-foreground uppercase tracking-wider">
                <th className="text-left px-4 py-2">Time</th>
                <th className="text-left px-2 py-2">Mast</th>
                <th className="text-left px-2 py-2">Provider</th>
                <th className="text-left px-2 py-2">Event</th>
                <th className="text-center px-2 py-2">Severity</th>
                <th className="text-center px-2 py-2">Status</th>
                <th className="text-center px-2 py-2">Response</th>
                <th className="text-center px-2 py-2">SLA</th>
                <th className="text-center px-2 py-2">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {incidents.slice(0, 30).map((inc) => (
                <tr key={inc.id} className="border-b border-border/20 hover:bg-secondary/30">
                  <td className="px-4 py-2 text-muted-foreground whitespace-nowrap font-mono text-[10px]">
                    {new Date(inc.timestamp).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}{" "}
                    {new Date(inc.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-2 py-2 font-semibold text-foreground">
                    <div>
                      <p className="truncate max-w-[160px]">{inc.mastName}</p>
                      <p className="text-[9px] text-muted-foreground">{inc.lga}</p>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-muted-foreground">{inc.provider}</td>
                  <td className="px-2 py-2 text-foreground">{inc.eventType}</td>
                  <td className="px-2 py-2 text-center"><SeverityBadge severity={inc.severity} /></td>
                  <td className="px-2 py-2 text-center"><StatusBadge status={inc.status} /></td>
                  <td className="px-2 py-2 text-center font-mono">{inc.responseTime}</td>
                  <td className="px-2 py-2 text-center">
                    {inc.slaBreached ? (
                      <span className="text-destructive font-bold text-[10px]">BREACH</span>
                    ) : (
                      <span className="text-success text-[10px]">OK</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {inc.hasEvidence ? (
                      <Camera className="h-3 w-3 text-blue-400 mx-auto" />
                    ) : (
                      <span className="text-muted-foreground text-[10px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Evidence Gallery */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          <Camera className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold text-foreground">Evidence Gallery</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{stats.withEvidence} incidents with photos</span>
        </div>
        <div className="p-4">
          {stats.withEvidence === 0 ? (
            <div className="text-center py-8">
              <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No evidence photos available for this state yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {incidents
                .filter(i => i.evidencePhotos.length > 0)
                .slice(0, 12)
                .map((inc) => (
                  <div key={inc.id} className="group relative rounded-lg overflow-hidden border border-border/50 bg-secondary/30">
                    <div className="aspect-video bg-muted/30 flex items-center justify-center">
                      <img
                        src={inc.evidencePhotos[0]}
                        alt={`Evidence from ${inc.mastName}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="p-2 space-y-0.5">
                      <p className="text-[10px] font-semibold text-foreground truncate">{inc.mastName}</p>
                      <p className="text-[9px] text-muted-foreground">{inc.eventType}</p>
                      <div className="flex items-center justify-between">
                        <SeverityBadge severity={inc.severity} />
                        <span className="text-[8px] text-muted-foreground">
                          {new Date(inc.timestamp).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Intruder Detection Log */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          <Eye className="h-4 w-4 text-warning" />
          <span className="text-sm font-semibold text-foreground">Intruder Detection Log</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{intruderLogs.length} sensor events</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50 text-[10px] text-muted-foreground uppercase tracking-wider">
                <th className="text-left px-4 py-2">Time</th>
                <th className="text-left px-2 py-2">Mast Site</th>
                <th className="text-left px-2 py-2">Sensor</th>
                <th className="text-left px-2 py-2">Detection Event</th>
                <th className="text-center px-2 py-2">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {intruderLogs.slice(0, 20).map((log) => (
                <tr key={log.id} className="border-b border-border/20 hover:bg-secondary/30">
                  <td className="px-4 py-2 text-muted-foreground whitespace-nowrap font-mono text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                  <td className="px-2 py-2 font-semibold text-foreground truncate max-w-[140px]">{log.mastName}</td>
                  <td className="px-2 py-2 text-primary font-mono text-[10px]">{log.sensor}</td>
                  <td className="px-2 py-2 text-foreground">{log.event}</td>
                  <td className="px-2 py-2 text-center">
                    <span className={`font-bold ${
                      log.confidence >= 90 ? "text-destructive" : log.confidence >= 75 ? "text-warning" : "text-muted-foreground"
                    }`}>
                      {log.confidence}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Response Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Response Timeline — NSCDC</span>
        </div>
        <div className="p-4 space-y-3">
          {incidents.filter(i => i.status === "resolved").slice(0, 8).map((inc) => (
            <div key={inc.id} className="flex items-start gap-3">
              <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                inc.slaBreached ? "bg-destructive" : "bg-success"
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-foreground truncate">{inc.mastName}</span>
                  <SeverityBadge severity={inc.severity} />
                  {inc.slaBreached && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive border border-destructive/30 font-bold">
                      SLA BREACHED
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {inc.eventType} &bull; Response: {inc.responseTime} &bull; Responder: {inc.responder}
                </p>
              </div>
              <span className="text-[9px] text-muted-foreground whitespace-nowrap font-mono">
                {new Date(inc.timestamp).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Provider breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Provider Breakdown — {state}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50 text-[10px] text-muted-foreground uppercase tracking-wider">
                <th className="text-left px-4 py-2">Provider</th>
                <th className="text-center px-2 py-2">Masts</th>
                <th className="text-center px-2 py-2">Incidents</th>
                <th className="text-center px-2 py-2">Critical</th>
                <th className="text-center px-2 py-2">Resolved</th>
                <th className="text-center px-2 py-2">SLA Breach Rate</th>
              </tr>
            </thead>
            <tbody>
              {TELECOM_PROVIDERS
                .filter(p => !provider || p.shortName === provider)
                .map(p => {
                const providerIncidents = incidents.filter(i => i.provider === p.name);
                const providerMasts = mockTelecomMasts.filter(m => m.state === state && m.providerShort === p.shortName);
                const critical = providerIncidents.filter(i => i.severity === "critical").length;
                const resolved = providerIncidents.filter(i => i.status === "resolved").length;
                const breached = providerIncidents.filter(i => i.slaBreached).length;
                const breachRate = providerIncidents.length > 0 ? Math.round((breached / providerIncidents.length) * 100) : 0;
                if (providerMasts.length === 0) return null;
                return (
                  <tr key={p.id} className="border-b border-border/20 hover:bg-secondary/30">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="font-semibold text-foreground">{p.name}</span>
                      </div>
                    </td>
                    <td className="text-center px-2 py-2.5">{providerMasts.length}</td>
                    <td className="text-center px-2 py-2.5 font-bold">{providerIncidents.length}</td>
                    <td className="text-center px-2 py-2.5 text-destructive font-bold">{critical}</td>
                    <td className="text-center px-2 py-2.5 text-success">{resolved}</td>
                    <td className="text-center px-2 py-2.5">
                      <span className={`font-bold ${breachRate > 30 ? "text-destructive" : breachRate > 15 ? "text-warning" : "text-success"}`}>
                        {breachRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
