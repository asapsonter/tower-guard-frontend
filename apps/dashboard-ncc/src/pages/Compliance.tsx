/**
 * NCC Compliance Page
 *
 * Read-only view of all reports, incident files, and field officer submissions.
 * Organised into three tabs so NCC regulators can review:
 *   1. Site Reports — published reports from the main site admin
 *   2. Incident Files — evidence and details from each incident
 *   3. Field Officer Files — dispatch records, officer notes, and evidence from NSCDC responders
 *
 * Respects the global provider filter.
 */
import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Shield, Camera, Users, Clock, Search, Eye,
  Download, MapPin, AlertTriangle, Radio, ChevronDown, ChevronRight,
  Database as DatabaseIcon,
} from "lucide-react";
import { mockTelecomMasts, TELECOM_PROVIDERS, type TelecomMast } from "@tower-guard/data";
import { supabase } from "@tower-guard/supabase-client";
import type { ProviderShort } from "../App";

// ── Mock: Site Reports (from main site admin) ──────────────────────────────
interface SiteReport {
  id: string;
  title: string;
  author: string;
  date: string;
  excerpt: string;
  status: "published" | "under_review";
  provider: string | null; // null = all providers
  category: "security_assessment" | "incident_response" | "trend_analysis" | "strategy" | "compliance_audit";
}

const SITE_REPORTS: SiteReport[] = [
  { id: "sr1", title: "Q1 2026 National Infrastructure Security Assessment", author: "John Adebayo", date: "2026-03-15", excerpt: "Comprehensive analysis of telecom mast security across all six geopolitical zones. Covers 380 monitored sites.", status: "published", provider: null, category: "security_assessment" },
  { id: "sr2", title: "Borno State Critical Incident Response Report", author: "Amina Yusuf", date: "2026-03-12", excerpt: "Detailed incident response timeline for the Maiduguri mast breach on March 10. Three sites affected.", status: "published", provider: "MTN", category: "incident_response" },
  { id: "sr3", title: "South-South Zone Vandalism Trend Analysis", author: "Emeka Okafor", date: "2026-03-08", excerpt: "Analysis of increasing vandalism incidents across Rivers, Delta, and Bayelsa states.", status: "published", provider: null, category: "trend_analysis" },
  { id: "sr4", title: "Generator Fuel Theft Prevention Strategy", author: "Fatima Bello", date: "2026-02-28", excerpt: "Proposed countermeasures against systematic generator fuel siphoning at remote sites.", status: "published", provider: null, category: "strategy" },
  { id: "sr5", title: "NSCDC Response Time Improvement Plan", author: "John Adebayo", date: "2026-02-20", excerpt: "Plan to reduce average first-responder dispatch time from 18 to 8 minutes.", status: "under_review", provider: null, category: "strategy" },
  { id: "sr6", title: "MTN Lagos Cluster Compliance Audit", author: "Chioma Eze", date: "2026-03-01", excerpt: "Audit of 45 MTN mast sites in Lagos metropolitan area. 3 non-compliant sites flagged.", status: "published", provider: "MTN", category: "compliance_audit" },
  { id: "sr7", title: "Airtel North-Central Zone Risk Report", author: "Ibrahim Musa", date: "2026-02-15", excerpt: "Risk assessment for 68 Airtel sites across Plateau, Nasarawa, and FCT.", status: "published", provider: "AIR", category: "security_assessment" },
  { id: "sr8", title: "Glo South-West Infrastructure Review", author: "Tunde Bakare", date: "2026-02-10", excerpt: "Structural and security compliance review of Glo mast installations in Ogun and Oyo states.", status: "published", provider: "GLO", category: "compliance_audit" },
  { id: "sr9", title: "9mobile Battery Theft Incident Summary", author: "Grace Nwankwo", date: "2026-01-28", excerpt: "Summary of 12 battery theft incidents at 9mobile sites in Enugu and Anambra over the past quarter.", status: "published", provider: "9MB", category: "incident_response" },
];

// ── Mock: Incident Files (evidence from incidents) ─────────────────────────
interface IncidentFile {
  id: string;
  mastName: string;
  mastId: string;
  provider: string;
  providerShort: string;
  state: string;
  lga: string;
  eventType: string;
  severity: "critical" | "warning" | "info";
  timestamp: string;
  status: "resolved" | "investigating" | "pending";
  hasPhoto: boolean;
  hasVideo: boolean;
  description: string;
}

const EVENT_TYPES = ["Perimeter Breach", "Fence Climbing", "Gate Tampering", "Equipment Theft Attempt", "Generator Fuel Siphoning", "Cable Cutting"];

function generateIncidentFiles(providerFilter?: string | null): IncidentFile[] {
  let masts = mockTelecomMasts.filter(m => m.status !== "secure" || m.tampered > 0);
  if (providerFilter) masts = masts.filter(m => m.providerShort === providerFilter);

  let seed = 42;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed & 0x7fffffff) / 0x7fffffff; };

  return masts.slice(0, 30).map((mast, i) => {
    const hoursAgo = Math.floor(rand() * 336);
    const provider = TELECOM_PROVIDERS.find(p => p.shortName === mast.providerShort);
    return {
      id: `if-${mast.id}-${i}`,
      mastName: mast.name,
      mastId: mast.id,
      provider: provider?.name ?? mast.provider,
      providerShort: mast.providerShort,
      state: mast.state,
      lga: mast.lga,
      eventType: EVENT_TYPES[Math.floor(rand() * EVENT_TYPES.length)],
      severity: (hoursAgo < 24 ? "critical" : hoursAgo < 72 ? "warning" : "info") as IncidentFile["severity"],
      timestamp: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
      status: (rand() > 0.3 ? "resolved" : rand() > 0.5 ? "investigating" : "pending") as IncidentFile["status"],
      hasPhoto: rand() > 0.35,
      hasVideo: rand() > 0.7,
      description: `${EVENT_TYPES[Math.floor(rand() * EVENT_TYPES.length)]} detected at ${mast.name}. ${Math.floor(rand() * 3) + 1} sensor(s) triggered. NSCDC notified.`,
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ── Mock: Field Officer Files (dispatch / NSCDC records) ───────────────────
interface FieldOfficerFile {
  id: string;
  assignmentRef: string;
  responderName: string;
  agency: string;
  mastName: string;
  providerShort: string;
  state: string;
  dispatchedAt: string;
  arrivedAt: string | null;
  resolvedAt: string | null;
  status: "resolved" | "en_route" | "on_site" | "pending";
  responseMinutes: number;
  slaMet: boolean;
  notes: string;
  hasEvidence: boolean;
}

const RESPONDER_NAMES = [
  "Sgt. Musa Ibrahim", "Cpl. Adaeze Obi", "Insp. Yusuf Ahmed",
  "Sgt. Blessing Ojo", "Cpl. Chukwudi Nnamdi", "Insp. Hauwa Abubakar",
  "Sgt. Tunde Olaiya", "Cpl. Ngozi Eze", "Insp. Aliyu Danjuma",
];

function generateFieldOfficerFiles(providerFilter?: string | null): FieldOfficerFile[] {
  let masts = mockTelecomMasts.filter(m => m.status === "critical" || m.status === "alert");
  if (providerFilter) masts = masts.filter(m => m.providerShort === providerFilter);

  let seed = 99;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed & 0x7fffffff) / 0x7fffffff; };

  return masts.slice(0, 25).map((mast, i) => {
    const hoursAgo = Math.floor(rand() * 168);
    const responseMin = Math.floor(rand() * 25) + 3;
    const resolved = rand() > 0.3;
    return {
      id: `fo-${mast.id}-${i}`,
      assignmentRef: `DSP-${String(2000 + i).padStart(4, "0")}`,
      responderName: RESPONDER_NAMES[Math.floor(rand() * RESPONDER_NAMES.length)],
      agency: "NSCDC",
      mastName: mast.name,
      providerShort: mast.providerShort,
      state: mast.state,
      dispatchedAt: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
      arrivedAt: resolved || rand() > 0.2 ? new Date(Date.now() - (hoursAgo - 0.3) * 3600000).toISOString() : null,
      resolvedAt: resolved ? new Date(Date.now() - (hoursAgo - 1) * 3600000).toISOString() : null,
      status: (resolved ? "resolved" : rand() > 0.5 ? "on_site" : rand() > 0.3 ? "en_route" : "pending") as FieldOfficerFile["status"],
      responseMinutes: responseMin,
      slaMet: responseMin <= 15,
      notes: resolved
        ? "Site secured. Evidence collected and uploaded. Perimeter restored."
        : "En route to site. ETA confirmed.",
      hasEvidence: resolved && rand() > 0.3,
    };
  }).sort((a, b) => new Date(b.dispatchedAt).getTime() - new Date(a.dispatchedAt).getTime());
}

// ── Badge helpers ──────────────────────────────────────────────────────────
const SeverityBadge = ({ severity }: { severity: string }) => {
  const c: Record<string, string> = {
    critical: "bg-destructive/20 text-destructive border-destructive/30",
    warning: "bg-warning/20 text-warning border-warning/30",
    info: "bg-primary/20 text-primary border-primary/30",
  };
  return <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase ${c[severity] ?? c.info}`}>{severity}</span>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const c: Record<string, string> = {
    resolved: "bg-success/20 text-success border-success/30",
    investigating: "bg-warning/20 text-warning border-warning/30",
    on_site: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    en_route: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    pending: "bg-destructive/20 text-destructive border-destructive/30",
    published: "bg-success/20 text-success border-success/30",
    under_review: "bg-warning/20 text-warning border-warning/30",
  };
  return <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase whitespace-nowrap ${c[status] ?? c.pending}`}>{status.replace("_", " ")}</span>;
};

const CategoryBadge = ({ category }: { category: string }) => {
  const labels: Record<string, string> = {
    security_assessment: "Security Assessment",
    incident_response: "Incident Response",
    trend_analysis: "Trend Analysis",
    strategy: "Strategy",
    compliance_audit: "Compliance Audit",
  };
  return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/50 font-medium">{labels[category] ?? category}</span>;
};

// ── Tabs ───────────────────────────────────────────────────────────────────
type Tab = "reports" | "incidents" | "field_officers";

interface ComplianceProps {
  provider?: ProviderShort | null;
  state?: string | null;
}

export default function Compliance({ provider, state: stateFilter }: ComplianceProps) {
  const [tab, setTab] = useState<Tab>("reports");
  const [search, setSearch] = useState("");
  const [liveIncidents, setLiveIncidents] = useState<IncidentFile[] | null>(null);
  const [liveFieldFiles, setLiveFieldFiles] = useState<FieldOfficerFile[] | null>(null);
  const [isLive, setIsLive] = useState(false);

  // ── Fetch real data from Supabase ───────────────────────────────────────
  const fetchLiveData = useCallback(async () => {
    if (!supabase) return;
    try {
      // Fetch real incidents
      const { data: incidents } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (incidents && incidents.length > 0) {
        setIsLive(true);
        setLiveIncidents(incidents.map((inc: any) => ({
          id: inc.id,
          mastName: inc.location || "Unknown Site",
          mastId: inc.mast_id || "",
          provider: inc.source || "Unknown",
          providerShort: "",
          state: inc.state || "Unknown",
          lga: inc.lga || "",
          eventType: inc.event_type || "Unknown",
          severity: (inc.severity === "critical" ? "critical" : inc.severity === "warning" ? "warning" : "info") as IncidentFile["severity"],
          timestamp: inc.created_at,
          status: (inc.status === "resolved" ? "resolved" : inc.status === "investigating" ? "investigating" : "pending") as IncidentFile["status"],
          hasPhoto: !!inc.snapshot_url,
          hasVideo: false,
          description: inc.details || "",
        })));
      }

      // Fetch real dispatch assignments for field officer files
      const { data: assignments } = await supabase
        .from("dispatch_assignments")
        .select("*")
        .order("dispatched_at", { ascending: false })
        .limit(50);

      if (assignments && assignments.length > 0) {
        setLiveFieldFiles(assignments.map((a: any) => {
          const dispatchedMs = new Date(a.dispatched_at).getTime();
          const acceptedMs = a.accepted_at ? new Date(a.accepted_at).getTime() : null;
          const responseMinutes = acceptedMs ? Math.round((acceptedMs - dispatchedMs) / 60000) : 0;

          return {
            id: a.id,
            assignmentRef: `DSP-${a.id.slice(0, 4).toUpperCase()}`,
            responderName: a.responder_name || "Unassigned",
            agency: a.agency || "NSCDC",
            mastName: a.council_area || "AMAC",
            providerShort: "",
            state: "FCT",
            dispatchedAt: a.dispatched_at,
            arrivedAt: a.on_site_at,
            resolvedAt: a.resolved_at,
            status: (a.status === "resolved" ? "resolved" : a.status === "on-site" ? "on_site" : a.status === "en-route" ? "en_route" : "pending") as FieldOfficerFile["status"],
            responseMinutes,
            slaMet: responseMinutes <= 15 || (a.sla_seconds ? responseMinutes * 60 <= a.sla_seconds : true),
            notes: a.status === "resolved" ? "Site secured. Evidence collected." : "Dispatch in progress.",
            hasEvidence: !!a.resolved_at,
          };
        }));
      }
    } catch (err) {
      console.warn("Compliance: Supabase fetch failed, using mock data", err);
    }
  }, []);

  useEffect(() => { fetchLiveData(); }, [fetchLiveData]);

  // ── Data (live → mock fallback) ─────────────────────────────────────────
  const reports = useMemo(() => {
    let list = SITE_REPORTS;
    if (provider) list = list.filter(r => r.provider === null || r.provider === provider);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => r.title.toLowerCase().includes(q) || r.author.toLowerCase().includes(q));
    }
    return list;
  }, [provider, search]);

  const incidentFiles = useMemo(() => {
    let list = liveIncidents ?? generateIncidentFiles(provider);
    if (stateFilter) list = list.filter(f => f.state === stateFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(f => f.mastName.toLowerCase().includes(q) || f.state.toLowerCase().includes(q) || f.provider.toLowerCase().includes(q));
    }
    return list;
  }, [provider, stateFilter, search, liveIncidents]);

  const fieldFiles = useMemo(() => {
    let list = liveFieldFiles ?? generateFieldOfficerFiles(provider);
    if (stateFilter) list = list.filter(f => f.state === stateFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(f => f.mastName.toLowerCase().includes(q) || f.responderName.toLowerCase().includes(q) || f.assignmentRef.toLowerCase().includes(q));
    }
    return list;
  }, [provider, stateFilter, search, liveFieldFiles]);

  const tabs: { id: Tab; label: string; icon: typeof FileText; count: number }[] = [
    { id: "reports", label: "Site Reports", icon: FileText, count: reports.length },
    { id: "incidents", label: "Incident Files", icon: Camera, count: incidentFiles.length },
    { id: "field_officers", label: "Field Officer Files", icon: Users, count: fieldFiles.length },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Compliance &amp; Files</h1>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
          NCC READ-ONLY
        </span>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                tab === t.id ? "bg-primary-foreground/20" : "bg-border"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${tabs.find(t => t.id === tab)?.label.toLowerCase()}...`}
            className="pl-8 pr-3 py-1.5 text-xs bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-60"
          />
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === "reports" && (
          <motion.div key="reports" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <ReportsTable reports={reports} />
          </motion.div>
        )}
        {tab === "incidents" && (
          <motion.div key="incidents" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <IncidentFilesTable files={incidentFiles} />
          </motion.div>
        )}
        {tab === "field_officers" && (
          <motion.div key="field" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <FieldOfficerTable files={fieldFiles} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Site Reports Table ─────────────────────────────────────────────────────
function ReportsTable({ reports }: { reports: SiteReport[] }) {
  return (
    <div className="glass-panel">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50 text-[10px] text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-4 py-2.5">Report</th>
              <th className="text-left px-4 py-2.5">Category</th>
              <th className="text-left px-4 py-2.5">Author</th>
              <th className="text-left px-4 py-2.5">Date</th>
              <th className="text-left px-4 py-2.5">Provider</th>
              <th className="text-center px-4 py-2.5">Status</th>
              <th className="text-center px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No reports found</td></tr>
            ) : reports.map(r => (
              <tr key={r.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3 max-w-xs">
                  <p className="font-medium text-foreground">{r.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{r.excerpt}</p>
                </td>
                <td className="px-4 py-3"><CategoryBadge category={r.category} /></td>
                <td className="px-4 py-3 text-secondary-foreground whitespace-nowrap">{r.author}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">{r.date}</td>
                <td className="px-4 py-3">
                  {r.provider ? (
                    <span className="text-[10px] font-bold" style={{ color: TELECOM_PROVIDERS.find(p => p.shortName === r.provider)?.color }}>
                      {r.provider}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">All</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1.5">
                    <button className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" title="View"><Eye className="h-3.5 w-3.5" /></button>
                    <button className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" title="Download"><Download className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Incident Files Table ───────────────────────────────────────────────────
function IncidentFilesTable({ files }: { files: IncidentFile[] }) {
  return (
    <div className="glass-panel">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50 text-[10px] text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-4 py-2.5">Mast / Location</th>
              <th className="text-left px-4 py-2.5">Provider</th>
              <th className="text-left px-4 py-2.5">Event</th>
              <th className="text-center px-4 py-2.5">Severity</th>
              <th className="text-left px-4 py-2.5">Time</th>
              <th className="text-center px-4 py-2.5">Evidence</th>
              <th className="text-center px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No incident files found</td></tr>
            ) : files.map(f => {
              const providerObj = TELECOM_PROVIDERS.find(p => p.shortName === f.providerShort);
              return (
                <tr key={f.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{f.mastName}</p>
                    <p className="text-[10px] text-muted-foreground">{f.lga}, {f.state}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold" style={{ color: providerObj?.color }}>{f.provider}</span>
                  </td>
                  <td className="px-4 py-3 text-foreground">{f.eventType}</td>
                  <td className="px-4 py-3 text-center"><SeverityBadge severity={f.severity} /></td>
                  <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap text-[10px]">
                    {new Date(f.timestamp).toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1.5">
                      {f.hasPhoto && <span title="Photo evidence"><Camera className="h-3.5 w-3.5 text-blue-400" /></span>}
                      {f.hasVideo && <span title="Video evidence"><Radio className="h-3.5 w-3.5 text-purple-400" /></span>}
                      {!f.hasPhoto && !f.hasVideo && <span className="text-[9px] text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={f.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Field Officer Files Table ──────────────────────────────────────────────
function FieldOfficerTable({ files }: { files: FieldOfficerFile[] }) {
  return (
    <div className="glass-panel">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50 text-[10px] text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-4 py-2.5">Ref</th>
              <th className="text-left px-4 py-2.5">Responder</th>
              <th className="text-left px-4 py-2.5">Mast Site</th>
              <th className="text-left px-4 py-2.5">Dispatched</th>
              <th className="text-center px-4 py-2.5">Response</th>
              <th className="text-center px-4 py-2.5">SLA</th>
              <th className="text-center px-4 py-2.5">Evidence</th>
              <th className="text-center px-4 py-2.5">Status</th>
              <th className="text-left px-4 py-2.5">Notes</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No field officer records found</td></tr>
            ) : files.map(f => {
              const providerObj = TELECOM_PROVIDERS.find(p => p.shortName === f.providerShort);
              return (
                <tr key={f.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-primary font-bold whitespace-nowrap">{f.assignmentRef}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground whitespace-nowrap">{f.responderName}</p>
                    <p className="text-[9px] text-muted-foreground">{f.agency}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{f.mastName}</p>
                    <p className="text-[9px]">
                      <span style={{ color: providerObj?.color }} className="font-bold">{f.providerShort}</span>
                      <span className="text-muted-foreground"> &bull; {f.state}</span>
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap text-[10px]">
                    {new Date(f.dispatchedAt).toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold whitespace-nowrap">
                    {f.responseMinutes}m
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${
                      f.slaMet
                        ? "bg-success/20 text-success border-success/30"
                        : "bg-destructive/20 text-destructive border-destructive/30"
                    }`}>
                      {f.slaMet ? "MET" : "BREACH"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {f.hasEvidence ? (
                      <div className="flex justify-center gap-1">
                        <Camera className="h-3.5 w-3.5 text-blue-400" />
                        <span title="Download evidence"><Download className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer" /></span>
                      </div>
                    ) : (
                      <span className="text-[9px] text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={f.status} /></td>
                  <td className="px-4 py-3 text-[10px] text-muted-foreground max-w-[200px] truncate">{f.notes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
