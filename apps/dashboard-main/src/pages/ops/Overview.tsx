import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Activity, AlertOctagon, BadgeCheck, Bell, Camera, CheckCircle2, ChevronRight, Clock, Globe2, Radio, ShieldCheck,
  Siren, Truck, Users, WifiOff, Wifi, Wrench,
} from "lucide-react";
import { Panel, PageHeader } from "@/components/ops/Panel";
import { KpiTile } from "@/components/ops/KpiTile";
import { SITE_STATES, fmtDuration, fmtNum, fmtTime, useNow, useOps, type SiteState } from "@/lib/ops";
import { OverviewMap } from "./overview/OverviewMap";
import { DrillList, StateBar } from "./overview/DrillPanel";
import { AlertsFeed } from "./overview/AlertsFeed";
import { boundsOf, countStates, drillChildren, inScope, isActive, resolveScope, scopeLevel } from "./overview/scope";

const ALL_VISIBLE = Object.fromEntries(SITE_STATES.map((s) => [s, true])) as Record<SiteState, boolean>;
const LEVEL_TITLE = { national: "Zones", zone: "States", state: "Clusters", cluster: "Sites" } as const;

/** National Operations Overview — "What is happening now?" */
export default function Overview() {
  const { snap } = useOps();
  const navigate = useNavigate();
  const now = useNow(15_000);
  const [params, setParams] = useSearchParams();
  const [visible, setVisible] = useState<Record<SiteState, boolean>>(ALL_VISIBLE);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showTeams, setShowTeams] = useState(false);

  const scope = useMemo(
    () => (snap ? resolveScope(snap, params.get("zone"), params.get("state"), params.get("cluster")) : null),
    [snap, params],
  );

  const view = useMemo(() => {
    if (!snap || !scope) return null;
    const sites = snap.sites.filter((s) => inScope(scope, s));
    const active = snap.incidents.filter((i) => isActive(i) && inScope(scope, i));
    const clusterZone = new Map(snap.clusters.map((c) => [c.id, c.zone]));
    const teams = snap.teams.filter((t) => {
      if (scope.cluster) return t.clusterId === scope.cluster.id;
      if (scope.state) return t.state === scope.state;
      if (scope.zone) return clusterZone.get(t.clusterId) === scope.zone;
      return true;
    });
    const warnings = sites.filter((s) => s.status === "warning");
    const fit = scopeLevel(scope) === "national"
      ? boundsOf(sites.map((s) => s.location), 0.3)
      : boundsOf(sites.length ? sites.map((s) => s.location) : scope.cluster ? [scope.cluster.center] : [], scope.cluster ? 0.04 : 0.1);
    return { sites, active, teams, warnings, counts: countStates(sites), children: drillChildren(snap, scope, sites, active), fit };
  }, [snap, scope]);

  if (!snap || !scope || !view) return null;
  const level = scopeLevel(scope);
  const k = snap.kpis;

  const drill = (next: { zone?: string | null; state?: string | null; cluster?: string | null }) => {
    const p = new URLSearchParams();
    if (next.zone) p.set("zone", next.zone);
    if (next.state) p.set("state", next.state);
    if (next.cluster) p.set("cluster", next.cluster);
    setParams(p);
  };
  const onChild = (key: string) => {
    if (level === "national") drill({ zone: key });
    else if (level === "zone") drill({ zone: scope.zone, state: key });
    else if (level === "state") drill({ zone: scope.zone, state: scope.state, cluster: key });
  };
  const openSite = (id: string) => navigate(`/sites/${id}`);
  const openIncident = (id: string) => navigate(`/incidents/${id}`);

  const crumbs: { label: string; onClick: () => void }[] = [{ label: "Nigeria", onClick: () => drill({}) }];
  if (scope.zone) crumbs.push({ label: scope.zone, onClick: () => drill({ zone: scope.zone }) });
  if (scope.state) crumbs.push({ label: scope.state, onClick: () => drill({ zone: scope.zone, state: scope.state }) });
  if (scope.cluster) crumbs.push({ label: scope.cluster.name, onClick: () => drill({ zone: scope.zone, state: scope.state, cluster: scope.cluster!.id }) });

  const pctTone = (v: number, good: number, ok: number) => (v >= good ? "text-success" : v >= ok ? "text-warning" : "text-destructive");
  const tiles = [
    { label: "Protected Sites", value: fmtNum(k.protectedSites), icon: ShieldCheck, to: "/sites", hint: "Site Digital Twins" },
    { label: "Fully Operational", value: fmtNum(k.fullyOperational), icon: CheckCircle2, tone: "text-success", to: "/health", hint: `${((k.fullyOperational / k.protectedSites) * 100).toFixed(1)}% of estate` },
    { label: "Degraded Mode", value: fmtNum(k.degraded), icon: Wrench, tone: "text-warning", to: "/health", hint: "Warning · maintenance · reduced protection" },
    { label: "Sites Offline", value: fmtNum(k.offline), icon: WifiOff, tone: k.offline ? "text-muted-foreground" : "text-foreground", to: "/health", hint: "System health" },
    { label: "Active Alerts", value: fmtNum(k.activeAlerts), icon: Bell, tone: "text-warning", to: "/incidents", hint: "Incidents + warning sites" },
    { label: "Critical Incidents", value: k.criticalIncidents, icon: AlertOctagon, tone: k.criticalIncidents ? "text-destructive" : "text-foreground", to: "/emergency", hint: "Emergency command" },
    { label: "Teams Dispatched", value: k.teamsDispatched, icon: Truck, tone: "text-primary", to: "/response", hint: "Response & SLA" },
    { label: "Responders On-Site", value: k.respondersOnSite, icon: Users, to: "/response", hint: "Verified arrivals" },
    { label: "Resolved Today", value: k.resolvedToday, icon: Activity, tone: "text-success", to: "/incidents", hint: "Secured or closed, 24 h" },
    { label: "CCTV Availability", value: `${k.cctvAvailabilityPct}%`, icon: Camera, tone: pctTone(k.cctvAvailabilityPct, 99, 97), to: "/health", hint: "Target 99%" },
    { label: "Connectivity", value: `${k.connectivityPct}%`, icon: Wifi, tone: pctTone(k.connectivityPct, 99.5, 98), to: "/health", hint: "Target 99.5%" },
    { label: "Avg Response Time", value: fmtDuration(k.avgResponseSec), icon: Clock, tone: k.avgResponseSec <= 1200 ? "text-success" : "text-destructive", to: "/response", hint: "Alert → verified arrival · SLA 20:00" },
    { label: "SLA Compliance", value: `${k.slaCompliancePct}%`, icon: BadgeCheck, tone: pctTone(k.slaCompliancePct, 95, 85), to: "/sla", hint: "Executive scorecard" },
  ];

  return (
    <>
      <PageHeader
        title="National Operations Overview"
        subtitle={`${snap.operatorName} · ITIPS Operator Command — what is happening across the protected estate right now`}
        icon={Globe2}
        actions={
          <>
            <span className="hud-chip"><Radio className="h-3 w-3 text-destructive animate-pulse" /> LIVE · {fmtTime(snap.generatedAt)} WAT</span>
            {k.criticalIncidents > 0 && (
              <button onClick={() => navigate("/emergency")} className="hud-chip !border-destructive/60 !text-destructive hover:bg-destructive/10">
                <Siren className="h-3 w-3" /> {k.criticalIncidents} critical · Emergency Command
              </button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2">
        {tiles.map((t) => (
          <KpiTile key={t.label} label={t.label} value={t.value} icon={t.icon} tone={t.tone} hint={t.hint} onClick={() => navigate(t.to)} />
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel
          className="col-span-12 xl:col-span-8"
          icon={Globe2}
          title={
            <nav className="flex items-center gap-1 flex-wrap" aria-label="Drill-down">
              {crumbs.map((c, idx) => (
                <span key={c.label} className="flex items-center gap-1">
                  {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  <button onClick={c.onClick} className={idx === crumbs.length - 1 ? "text-primary" : "text-muted-foreground hover:text-foreground"}>{c.label}</button>
                </span>
              ))}
            </nav>
          }
          actions={<span className="text-[10px] font-mono tabular-nums text-muted-foreground">{fmtNum(view.sites.length)} sites · {view.active.length} active incidents</span>}
          bodyClassName="p-2"
        >
          <OverviewMap
            sites={view.sites}
            incidents={view.active}
            teams={view.teams}
            counts={view.counts}
            visible={visible}
            onToggleState={(s) => setVisible((v) => ({ ...v, [s]: !v[s] }))}
            showIncidents={showIncidents}
            showTeams={showTeams}
            onToggleIncidents={() => setShowIncidents((v) => !v)}
            onToggleTeams={() => setShowTeams((v) => !v)}
            fitTo={view.fit}
            level={level}
            onSite={openSite}
            onIncident={openIncident}
          />
        </Panel>

        <div className="col-span-12 xl:col-span-4 flex flex-col gap-4 min-w-0">
          <Panel
            title={`Drill-down · ${LEVEL_TITLE[level]}`}
            actions={level !== "national" && (
              <button onClick={() => crumbs[crumbs.length - 2].onClick()} className="text-[10px] text-muted-foreground hover:text-primary">↑ Up a level</button>
            )}
            bodyClassName="p-0"
          >
            <div className="px-3 py-2 border-b border-primary/10">
              <div className="flex items-baseline justify-between">
                <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{crumbs[crumbs.length - 1].label} · site states</p>
                <p className="text-[10px] font-mono tabular-nums text-muted-foreground">{fmtNum(view.sites.length)} total</p>
              </div>
              <div className="mt-1.5"><StateBar counts={view.counts} total={view.sites.length} /></div>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              <DrillList level={level} items={view.children} sites={view.sites} onChild={onChild} onSite={openSite} />
            </div>
          </Panel>

          <Panel
            title="Live alerts"
            icon={Bell}
            actions={<span className="hud-chip">{view.active.length} incidents · {view.warnings.length} warnings</span>}
            bodyClassName="p-0"
          >
            <div className="max-h-[290px] overflow-y-auto">
              <AlertsFeed incidents={view.active} warnings={view.warnings} now={now} />
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
