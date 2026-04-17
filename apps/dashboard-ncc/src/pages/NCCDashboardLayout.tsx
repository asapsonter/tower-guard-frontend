import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Globe, Shield, TrendingUp,
  AlertTriangle, CheckCircle2, Clock, Building2,
  Signal, MapPin, Database as DatabaseIcon,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { mockTelecomMasts, TELECOM_PROVIDERS } from "@tower-guard/data";
import { supabase } from "@tower-guard/supabase-client";
import type { ProviderShort } from "../App";

// ── Provider shortName → display label mapping ────────────────────────────
const PROVIDER_LABEL: Record<string, string> = {
  MTN: "MTN",
  GLO: "Glo",
  AIR: "Airtel",
  "9MB": "9mobile",
};

// ── Fallback mock data (used when Supabase is unavailable) ────────────────
const MOCK_PROVIDER_DATA = [
  { shortName: "MTN", name: "MTN", masts: 1247, incidents: 89, slaCompliance: 94 },
  { shortName: "GLO", name: "Glo", masts: 842, incidents: 56, slaCompliance: 88 },
  { shortName: "AIR", name: "Airtel", masts: 968, incidents: 72, slaCompliance: 91 },
  { shortName: "9MB", name: "9mobile", masts: 456, incidents: 34, slaCompliance: 85 },
];

const MOCK_INCIDENT_BY_STATE = [
  { state: "Lagos", incidents: 47, resolved: 42 },
  { state: "Abuja", incidents: 31, resolved: 28 },
  { state: "Kano", incidents: 28, resolved: 22 },
  { state: "Rivers", incidents: 24, resolved: 20 },
  { state: "Kaduna", incidents: 19, resolved: 17 },
  { state: "Oyo", incidents: 16, resolved: 14 },
  { state: "Enugu", incidents: 14, resolved: 13 },
  { state: "Delta", incidents: 12, resolved: 10 },
];

const MOCK_RESPONSE_DISTRIBUTION = [
  { range: "0-5 min", count: 34 },
  { range: "5-10 min", count: 28 },
  { range: "10-15 min", count: 18 },
  { range: "15-20 min", count: 12 },
  { range: "20-30 min", count: 6 },
  { range: "30+ min", count: 3 },
];

const SLA_COMPLIANCE_TREND = [
  { month: "Jan", compliance: 82, target: 90 },
  { month: "Feb", compliance: 85, target: 90 },
  { month: "Mar", compliance: 88, target: 90 },
  { month: "Apr", compliance: 84, target: 90 },
  { month: "May", compliance: 91, target: 90 },
  { month: "Jun", compliance: 93, target: 90 },
];

const THREAT_TYPES = [
  { name: "Perimeter Breach", value: 45, color: "hsl(var(--destructive))" },
  { name: "Fence Climbing", value: 25, color: "hsl(var(--warning))" },
  { name: "Gate Tampering", value: 18, color: "hsl(var(--primary))" },
  { name: "Equipment Theft Attempt", value: 12, color: "hsl(var(--accent-foreground))" },
  { name: "Vandalised Equipments", value: 3.5, color: "hsl(var(--muted-foreground))" },
];

// ── Response time bucketing helper ────────────────────────────────────────
function bucketResponseTimes(assignments: { dispatched_at: string; accepted_at: string | null }[]) {
  const buckets = [
    { range: "0-5 min", min: 0, max: 300, count: 0 },
    { range: "5-10 min", min: 300, max: 600, count: 0 },
    { range: "10-15 min", min: 600, max: 900, count: 0 },
    { range: "15-20 min", min: 900, max: 1200, count: 0 },
    { range: "20-30 min", min: 1200, max: 1800, count: 0 },
    { range: "30+ min", min: 1800, max: Infinity, count: 0 },
  ];
  for (const a of assignments) {
    if (!a.accepted_at) continue;
    const secs = (new Date(a.accepted_at).getTime() - new Date(a.dispatched_at).getTime()) / 1000;
    const bucket = buckets.find(b => secs >= b.min && secs < b.max);
    if (bucket) bucket.count++;
  }
  return buckets.map(({ range, count }) => ({ range, count }));
}

interface NCCDashboardProps {
  provider?: ProviderShort | null;
  state?: string | null;
}

const NCCDashboard = ({ provider, state: stateFilter }: NCCDashboardProps) => {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [isLive, setIsLive] = useState(false);

  // ── Live Supabase data ──────────────────────────────────────────────────
  const [liveIncidentsByState, setLiveIncidentsByState] = useState<{ state: string; incidents: number; resolved: number }[] | null>(null);
  const [liveResponseDist, setLiveResponseDist] = useState<{ range: string; count: number }[] | null>(null);
  const [liveTotalIncidents, setLiveTotalIncidents] = useState<number | null>(null);
  const [liveTotalResolved, setLiveTotalResolved] = useState<number | null>(null);
  const [liveSlaRate, setLiveSlaRate] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // ── Fetch real data from Supabase ───────────────────────────────────────
  const fetchLiveData = useCallback(async () => {
    if (!supabase) return;

    try {
      // 1. Incidents grouped by state
      const { data: incidents } = await supabase
        .from("incidents")
        .select("state, status")
        .order("created_at", { ascending: false })
        .limit(500);

      if (incidents && incidents.length > 0) {
        setIsLive(true);
        setLiveTotalIncidents(incidents.length);
        setLiveTotalResolved(incidents.filter(i => i.status === "resolved").length);

        // Group by state
        const byState = new Map<string, { incidents: number; resolved: number }>();
        for (const inc of incidents) {
          const s = inc.state || "Unknown";
          const entry = byState.get(s) || { incidents: 0, resolved: 0 };
          entry.incidents++;
          if (inc.status === "resolved") entry.resolved++;
          byState.set(s, entry);
        }
        const stateData = [...byState.entries()]
          .map(([state, counts]) => ({ state, ...counts }))
          .sort((a, b) => b.incidents - a.incidents)
          .slice(0, 10);
        setLiveIncidentsByState(stateData);
      }

      // 2. Dispatch assignments for response time distribution + SLA
      const { data: assignments } = await supabase
        .from("dispatch_assignments")
        .select("dispatched_at, accepted_at, resolved_at, sla_seconds")
        .order("dispatched_at", { ascending: false })
        .limit(200);

      if (assignments && assignments.length > 0) {
        // Response time buckets
        const dist = bucketResponseTimes(assignments);
        if (dist.some(b => b.count > 0)) {
          setLiveResponseDist(dist);
        }

        // SLA compliance rate
        const withResolution = assignments.filter(a => a.resolved_at && a.dispatched_at);
        if (withResolution.length > 0) {
          const met = withResolution.filter(a => {
            const secs = (new Date(a.resolved_at!).getTime() - new Date(a.dispatched_at).getTime()) / 1000;
            return secs <= (a.sla_seconds || 900);
          }).length;
          setLiveSlaRate(Math.round((met / withResolution.length) * 100));
        }
      }
    } catch (err) {
      console.warn("NCC Dashboard: Supabase fetch failed, using mock data", err);
    }
  }, []);

  useEffect(() => { fetchLiveData(); }, [fetchLiveData]);

  // Refresh every 30 seconds if live
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(fetchLiveData, 30000);
    return () => clearInterval(id);
  }, [isLive, fetchLiveData]);

  // ── Derive display data (live → mock fallback) ─────────────────────────
  const providerData = useMemo(() => {
    if (!provider) return MOCK_PROVIDER_DATA;
    return MOCK_PROVIDER_DATA.filter(p => p.shortName === provider);
  }, [provider]);

  const incidentByState = useMemo(() => {
    let data = liveIncidentsByState ?? MOCK_INCIDENT_BY_STATE;
    if (provider && !liveIncidentsByState) {
      // Scale mock data by provider ratio
      const pd = MOCK_PROVIDER_DATA.find(p => p.shortName === provider);
      if (pd) {
        const totalIncAll = MOCK_PROVIDER_DATA.reduce((s, x) => s + x.incidents, 0);
        const ratio = pd.incidents / totalIncAll;
        data = data.map(s => ({
          state: s.state,
          incidents: Math.round(s.incidents * ratio),
          resolved: Math.round(s.resolved * ratio),
        }));
      }
    }
    if (stateFilter) {
      const stateLabel = stateFilter === "FCT" ? "Abuja" : stateFilter;
      data = data.filter(s => s.state === stateLabel || s.state === stateFilter);
    }
    return data;
  }, [provider, stateFilter, liveIncidentsByState]);

  const responseDist = liveResponseDist ?? MOCK_RESPONSE_DISTRIBUTION;

  const filteredMastCount = useMemo(() => {
    if (!provider && !stateFilter) return null;
    let masts = mockTelecomMasts;
    if (provider) masts = masts.filter(m => m.providerShort === provider);
    if (stateFilter) masts = masts.filter(m => m.state === stateFilter);
    return masts.length;
  }, [provider, stateFilter]);

  const totalIncidents = liveTotalIncidents ?? incidentByState.reduce((s, x) => s + x.incidents, 0);
  const totalResolved = liveTotalResolved ?? incidentByState.reduce((s, x) => s + x.resolved, 0);
  const avgSla = liveSlaRate ?? Math.round(providerData.reduce((s, x) => s + x.slaCompliance, 0) / providerData.length);
  const totalMasts = filteredMastCount ?? providerData.reduce((s, x) => s + x.masts, 0);

  const providerColor = provider
    ? TELECOM_PROVIDERS.find(p => p.shortName === provider)?.color
    : undefined;

  const filterLabel = provider ? PROVIDER_LABEL[provider] : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
            <Globe className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              NCC Monitoring Dashboard
              {filterLabel && (
                <span className="ml-2 text-sm font-semibold" style={{ color: providerColor }}>
                  — {filterLabel}
                </span>
              )}
            </h1>
            <p className="text-xs text-muted-foreground">Nigerian Communications Commission — National Oversight</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <p className="text-[10px] text-muted-foreground font-mono">{now.toLocaleDateString()}</p>
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-success/10 border border-success/30 text-success font-semibold">
                <DatabaseIcon className="h-2.5 w-2.5" /> LIVE DATA
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold">
              READ-ONLY ACCESS
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4">
          <div className="flex items-center justify-between mb-2">
            <Signal className="h-5 w-5 text-primary" />
            <TrendingUp className="h-3.5 w-3.5 text-success" />
          </div>
          <p className="text-2xl font-bold text-foreground">{totalMasts.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Monitored Masts</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-[10px] text-muted-foreground">{isLive ? "All Time" : "This Month"}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalIncidents}</p>
          <p className="text-[10px] text-muted-foreground">Total Incidents</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span className="text-[10px] text-success font-semibold">{totalIncidents > 0 ? Math.round((totalResolved / totalIncidents) * 100) : 0}%</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalResolved}</p>
          <p className="text-[10px] text-muted-foreground">Resolved</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-4">
          <div className="flex items-center justify-between mb-2">
            <Shield className="h-5 w-5 text-green-500" />
            <span className={`text-[10px] font-semibold ${avgSla >= 90 ? "text-success" : "text-warning"}`}>{avgSla}%</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgSla}%</p>
          <p className="text-[10px] text-muted-foreground">NSCDC SLA Compliance</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Incidents by State */}
        <div className="glass-panel">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Incidents by State</span>
            </div>
            <span className="text-[9px] text-muted-foreground italic">Click a bar for full details</span>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={incidentByState}
                onClick={(data) => {
                  const state = data?.activePayload?.[0]?.payload?.state;
                  if (state) navigate(`/incidents/${encodeURIComponent(state)}`);
                }}
                style={{ cursor: "pointer" }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="state" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 11 }}
                  labelFormatter={(label: string) => `${label} — Click for details`}
                />
                <Bar dataKey="incidents" fill={providerColor || "hsl(var(--destructive))"} radius={[4, 4, 0, 0]} name="Incidents" />
                <Bar dataKey="resolved" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA Compliance Trend (mock — no monthly aggregation in Supabase) */}
        <div className="glass-panel">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-sm font-semibold text-foreground">NSCDC SLA Compliance Trend</span>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SLA_COMPLIANCE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="compliance" stroke={providerColor || "hsl(var(--primary))"} strokeWidth={2} dot={{ r: 4 }} name="NSCDC Compliance %" />
                <Line type="monotone" dataKey="target" stroke="hsl(var(--destructive))" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Target (90%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Types (mock — no threat classification table) */}
        <div className="glass-panel">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm font-semibold text-foreground">Threat Classification</span>
          </div>
          <div className="p-4 flex items-center gap-4">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={THREAT_TYPES} cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={3} dataKey="value">
                    {THREAT_TYPES.map((t, i) => <Cell key={i} fill={t.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 flex-1">
              {THREAT_TYPES.map(t => (
                <div key={t.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-[10px] text-foreground">{t.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-foreground">{t.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Response Time Distribution (live from dispatch_assignments or mock) */}
        <div className="glass-panel">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Response Time Distribution</span>
          </div>
          <div className="p-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 11 }} />
                <Bar dataKey="count" fill={providerColor || "hsl(var(--primary))"} radius={[4, 4, 0, 0]} name="Assignments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Telecom Provider Table */}
      <div className="glass-panel">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Telecom Provider Overview</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/50">
                <th className="text-left px-4 py-2">Provider</th>
                <th className="text-center px-4 py-2">Monitored Masts</th>
                <th className="text-center px-4 py-2">Incidents (Month)</th>
                <th className="text-center px-4 py-2">Incident Rate</th>
                <th className="text-center px-4 py-2">NSCDC SLA</th>
                <th className="text-center px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {providerData.map(p => {
                const rate = ((p.incidents / p.masts) * 100).toFixed(1);
                return (
                  <tr key={p.name} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-semibold text-foreground">{p.name}</td>
                    <td className="px-4 py-3 text-xs text-center text-foreground">{p.masts.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-center text-foreground">{p.incidents}</td>
                    <td className="px-4 py-3 text-xs text-center">
                      <span className={`${Number(rate) > 5 ? "text-destructive" : "text-success"}`}>{rate}%</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-center">
                      <span className={`font-semibold ${p.slaCompliance >= 90 ? "text-success" : p.slaCompliance >= 80 ? "text-warning" : "text-destructive"}`}>
                        {p.slaCompliance}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                        p.slaCompliance >= 90
                          ? "bg-success/20 text-success border-success/30"
                          : "bg-warning/20 text-warning border-warning/30"
                      }`}>
                        {p.slaCompliance >= 90 ? "COMPLIANT" : "REVIEW"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NCCDashboard;
