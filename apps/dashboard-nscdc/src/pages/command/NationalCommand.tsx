import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Activity, AlertOctagon, BadgeCheck, Banknote, ChevronRight, Clock, FolderSearch, Gavel, Globe2, Lock, Radio,
  Scale, ShieldAlert, Truck, Users,
} from "lucide-react";
import { Panel, PageHeader } from "@/components/cnii/Panel";
import { KpiTile } from "@/components/cnii/KpiTile";
import { Pill } from "@/components/cnii/Pill";
import {
  INCIDENT_STATUS_LABEL, INCIDENT_TYPE_COLOR, INCIDENT_TYPE_LABEL, SEVERITY_COLOR, fmtDuration, fmtNaira, fmtTime, timeAgo,
  useCnii, useNow, type Formation, type GeoPoint, type Zone,
} from "@/lib/cnii";
import { NationalMap } from "./national/NationalMap";
import { DrillPanel } from "./national/DrillPanel";
import { DEFAULT_LAYERS, INCIDENT_TYPES, LAYERS, type LayerKey } from "./national/layers";
import { NIGERIA_BOUNDS, bySeverityThenRecency, inScope, isActive, resolveScope, scopeLevel } from "./national/scope";

const WINDOWS = [
  { key: "24h", label: "24H", days: 1 },
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
] as const;
type WindowKey = (typeof WINDOWS)[number]["key"];

/** Pad a lone point so fitBounds lands at a sensible city-level zoom. */
function padPoints(points: GeoPoint[], deg = 0.12): GeoPoint[] {
  if (points.length !== 1) return points;
  const [p] = points;
  return [{ lat: p.lat - deg, lng: p.lng - deg }, { lat: p.lat + deg, lng: p.lng + deg }];
}

export default function NationalCommand() {
  const { snap } = useCnii();
  const navigate = useNavigate();
  const now = useNow(15_000);
  const [params, setParams] = useSearchParams();
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>(DEFAULT_LAYERS);
  const [win, setWin] = useState<WindowKey>("30d");

  const scope = useMemo(
    () => (snap ? resolveScope(snap, params.get("zone"), params.get("sc"), params.get("ac")) : null),
    [snap, params],
  );

  const view = useMemo(() => {
    if (!snap || !scope) return null;
    const cutoff = now - WINDOWS.find((w) => w.key === win)!.days * 86_400_000;
    const incidents = snap.incidents.filter((i) => inScope(scope, i) && (isActive(i) || new Date(i.detectedAt).getTime() >= cutoff));
    const active = incidents.filter(isActive).sort(bySeverityThenRecency);
    const units = snap.units.filter((u) => inScope(scope, u));
    const formations = snap.formations.filter((f) => {
      if (scope.areaCommand) return f.id === scope.areaCommand.id || f.id === scope.stateCommand?.id;
      if (scope.stateCommand) return f.state === scope.stateCommand.state;
      if (scope.zone) return f.zone === scope.zone && f.kind !== "national_hq";
      return true;
    });
    const incById = new Map(snap.incidents.map((i) => [i.id, i]));
    const recovered = snap.stolenAssets.filter((a) => {
      if (!a.recoveryLocation) return false;
      const inc = incById.get(a.incidentId);
      return scopeLevel(scope) === "national" || (inc != null && inScope(scope, inc));
    });

    let fit: GeoPoint[] = NIGERIA_BOUNDS;
    if (scope.areaCommand) fit = padPoints([scope.areaCommand.location, ...incidents.filter((i) => i.areaCommandId === scope.areaCommand!.id).map((i) => i.location)]);
    else if (scope.stateCommand) fit = padPoints([scope.stateCommand.location, ...scope.stateCommand.areaCommands.map((a) => a.location), ...active.map((i) => i.location)]);
    else if (scope.zone) fit = padPoints(snap.stateCommands.filter((s) => s.zone === scope.zone).map((s) => s.location), 0.5);

    const counts = Object.fromEntries(LAYERS.map((l) => [l.key, 0])) as Record<LayerKey, number>;
    counts.active = active.length;
    for (const t of INCIDENT_TYPES) counts[t] = incidents.filter((i) => i.type === t).length;
    counts.units = units.length;
    counts.formations = formations.length;
    counts.hotspots = snap.hotspots.length;
    counts.corridors = snap.corridors.length;
    counts.recovered = recovered.length;

    return { incidents, active, units, formations, recovered, fit, counts };
  }, [snap, scope, win, now]);

  if (!snap || !scope || !view) return null;
  const level = scopeLevel(scope);
  const k = snap.kpis;

  const drill = (next: { zone?: string; sc?: string; ac?: string }) => {
    const p = new URLSearchParams();
    if (next.zone) p.set("zone", next.zone);
    if (next.sc) p.set("sc", next.sc);
    if (next.ac) p.set("ac", next.ac);
    setParams(p);
  };
  const toZone = (z: Zone) => drill({ zone: z });
  const toState = (scId: string) => {
    const sc = snap.stateCommands.find((s) => s.id === scId);
    drill({ zone: sc?.zone, sc: scId });
  };
  const toArea = (acId: string) => {
    const sc = snap.stateCommands.find((s) => s.areaCommands.some((a) => a.id === acId));
    if (sc) drill({ zone: sc.zone, sc: sc.id, ac: acId });
  };
  const openIncident = (id: string) => navigate(`/incident/${id}`);
  const onFormation = (f: Formation) => {
    if (f.kind === "national_hq") drill({});
    else if (f.kind === "zonal_command") toZone(f.zone);
    else if (f.kind === "state_command") toState(f.id);
    else if (f.kind === "area_command") toArea(f.id);
  };

  const crumbs: { label: string; onClick: () => void }[] = [{ label: "National", onClick: () => drill({}) }];
  if (scope.zone) crumbs.push({ label: scope.zone, onClick: () => toZone(scope.zone!) });
  if (scope.stateCommand) crumbs.push({ label: `${scope.stateCommand.state} Command`, onClick: () => toState(scope.stateCommand!.id) });
  if (scope.areaCommand) crumbs.push({ label: scope.areaCommand.name, onClick: () => toArea(scope.areaCommand!.id) });

  const kpis = [
    { label: "Active CNII Incidents", value: k.activeIncidents, icon: Activity, tone: "text-warning", to: "/incident", hint: "Open incident command" },
    { label: "Critical Incidents", value: k.criticalIncidents, icon: AlertOctagon, tone: k.criticalIncidents ? "text-destructive" : "text-foreground", to: "/incident", hint: "Severity: critical" },
    { label: "Teams Dispatched", value: k.teamsDispatched, icon: Truck, to: "/dispatch", hint: "Dispatch command" },
    { label: "Teams On-Site", value: k.teamsOnSite, icon: Users, to: "/dispatch", hint: "Units at incident sites" },
    { label: "Avg. Response", value: fmtDuration(k.avgResponseSeconds), icon: Clock, to: "/sla", hint: "Alert → arrival" },
    { label: "Response SLA Met", value: `${k.slaMetPct}%`, icon: BadgeCheck, tone: k.slaMetPct >= 85 ? "text-success" : k.slaMetPct >= 70 ? "text-warning" : "text-destructive", to: "/sla", hint: "SLA accountability" },
    { label: "Arrests Today", value: k.arrestsToday, icon: Lock, to: "/prosecution", hint: "Arrest → prosecution" },
    { label: "Assets Recovered Today", value: fmtNaira(k.assetsRecoveredNairaToday), icon: Banknote, tone: "text-success", to: "/assets", hint: "Asset recovery" },
    { label: "Open Investigations", value: k.openInvestigations, icon: FolderSearch, to: "/investigations", hint: "Case management" },
    { label: "Cases Under Prosecution", value: k.casesUnderProsecution, icon: Scale, to: "/prosecution", hint: "Prosecution tracker" },
    { label: "Convictions YTD", value: k.convictionsYtd, icon: Gavel, tone: "text-primary", to: "/prosecution", hint: "Outcomes" },
  ];

  return (
    <>
      <PageHeader
        title="National CNII Security Command"
        subtitle="Commandant-General · National Command Centre — all ITIPS-connected telecom incidents, response posture and outcomes"
        icon={Globe2}
        actions={
          <>
            <span className="hud-chip"><Radio className="h-3 w-3 text-destructive animate-pulse" /> LIVE · {fmtTime(snap.generatedAt)} WAT</span>
            <span className="hud-chip">{view.active.length} active in scope</span>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-11 gap-2">
        {kpis.map((t) => (
          <KpiTile key={t.label} label={t.label} value={t.value} icon={t.icon} tone={t.tone} hint={t.hint} onClick={() => navigate(t.to)} />
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel
          className="col-span-12 xl:col-span-8"
          icon={ShieldAlert}
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
          actions={
            <div className="flex rounded-md border border-primary/25 overflow-hidden">
              {WINDOWS.map((w) => (
                <button key={w.key} onClick={() => setWin(w.key)} title={`Show closed incidents from the last ${w.label}`}
                  className={`px-2 py-0.5 text-[9px] font-mono ${win === w.key ? "bg-primary/25 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {w.label}
                </button>
              ))}
            </div>
          }
          bodyClassName="p-2"
        >
          <NationalMap
            incidents={view.incidents}
            units={view.units}
            formations={view.formations}
            hotspots={snap.hotspots}
            corridors={snap.corridors}
            recovered={view.recovered}
            layers={layers}
            counts={view.counts}
            onToggleLayer={(key) => setLayers((l) => ({ ...l, [key]: !l[key] }))}
            onAllLayers={(on) => setLayers(Object.fromEntries(LAYERS.map((l) => [l.key, on])) as Record<LayerKey, boolean>)}
            fitTo={view.fit}
            now={now}
            showUnitLabels={level !== "national"}
            onIncident={openIncident}
            onFormation={onFormation}
          />
        </Panel>

        <Panel
          className="col-span-12 xl:col-span-4 xl:max-h-[628px]"
          title={level === "national" ? "Drill-down · Zones" : level === "zone" ? "Drill-down · States" : level === "state" ? "Drill-down · Commands" : "Drill-down · Incidents"}
          actions={level !== "national" && (
            <button onClick={() => crumbs[crumbs.length - 2].onClick()} className="text-[10px] text-muted-foreground hover:text-primary">↑ Up a level</button>
          )}
          bodyClassName="p-3 overflow-y-auto"
        >
          <DrillPanel snap={snap} scope={scope} incidents={view.incidents} now={now} onZone={toZone} onState={toState} onArea={toArea} onIncident={openIncident} />
        </Panel>
      </div>

      <Panel
        icon={Activity}
        title={`Active incidents feed · ${crumbs[crumbs.length - 1].label}`}
        actions={<span className="text-[10px] text-muted-foreground">Sorted by severity, then most recent</span>}
        bodyClassName="p-0 overflow-x-auto"
      >
        {view.active.length === 0 ? (
          <p className="text-[12px] text-muted-foreground text-center py-8">No active CNII incidents in this scope.</p>
        ) : (
          <table className="w-full min-w-[860px] text-[12px]">
            <thead>
              <tr className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground border-b border-primary/15">
                {["Severity", "Incident", "Type / site", "Status", "Operator", "State · LGA", "Unit", "Detected"].map((h) => (
                  <th key={h} className="text-left font-medium px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.active.map((i) => (
                <tr key={i.id} onClick={() => openIncident(i.id)} className="border-b border-primary/5 hover:bg-primary/5 cursor-pointer">
                  <td className="px-3 py-1.5"><Pill color={SEVERITY_COLOR[i.severity]} solid={i.severity === "critical"}>{i.severity.toUpperCase()}</Pill></td>
                  <td className="px-3 py-1.5 font-mono text-primary whitespace-nowrap">{i.id}</td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: INCIDENT_TYPE_COLOR[i.type] }} />
                      <span className="truncate max-w-[260px]">{INCIDENT_TYPE_LABEL[i.type]} · {i.siteName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 whitespace-nowrap">{INCIDENT_STATUS_LABEL[i.status]}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">{i.operator}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap text-muted-foreground">{i.state} · {i.lga}</td>
                  <td className="px-3 py-1.5 font-mono whitespace-nowrap">{i.respondingUnitId ?? <span className="text-warning">unassigned</span>}</td>
                  <td className="px-3 py-1.5 font-mono tabular-nums whitespace-nowrap text-muted-foreground">{timeAgo(i.detectedAt, now)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  );
}
