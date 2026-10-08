import { useMemo } from "react";
import { CircleMarker, LayerGroup, Marker, Tooltip } from "react-leaflet";
import { OpsMap, dotIcon } from "@/components/ops/OpsMap";
import {
  INCIDENT_STATUS_LABEL, SEVERITY_COLOR, SITE_STATES, SITE_STATE_COLOR, SITE_STATE_LABEL, TEAM_STATUS_COLOR, TEAM_STATUS_LABEL,
  type GeoPoint, type Incident, type ResponseTeam, type SiteState, type SiteSummary,
} from "@/lib/ops";
import { STATE_RANK, type ScopeLevel, type StateCounts } from "./scope";

const BASE_RADIUS: Record<SiteState, number> = { normal: 2.5, maintenance: 3, offline: 3, warning: 3.5, incident: 6, critical: 7.5 };

interface OverviewMapProps {
  sites: SiteSummary[];
  incidents: Incident[];
  teams: ResponseTeam[];
  counts: StateCounts;
  visible: Record<SiteState, boolean>;
  onToggleState: (s: SiteState) => void;
  showIncidents: boolean;
  showTeams: boolean;
  onToggleIncidents: () => void;
  onToggleTeams: () => void;
  fitTo: GeoPoint[];
  level: ScopeLevel;
  onSite: (id: string) => void;
  onIncident: (id: string) => void;
  height?: number;
}

/** Estate map: every protected site as a canvas CircleMarker, coloured by operating state. */
export function OverviewMap(p: OverviewMapProps) {
  const zoomBoost = p.level === "cluster" ? 2.2 : p.level === "state" ? 1.6 : p.level === "zone" ? 1.2 : 1;

  // Low-severity first so critical/incident sites are drawn on top
  const ordered = useMemo(
    () => p.sites.filter((s) => p.visible[s.status]).sort((a, b) => STATE_RANK[a.status] - STATE_RANK[b.status]),
    [p.sites, p.visible],
  );
  const layerKey = SITE_STATES.filter((s) => p.visible[s]).join(",") + `|${p.sites.length}|${p.level}`;

  return (
    <OpsMap
      height={p.height ?? 560}
      fitTo={p.fitTo}
      overlay={
        <div className="absolute bottom-2 left-2 z-[500] rounded-md border border-primary/25 bg-card/85 backdrop-blur p-2 space-y-1 max-w-[calc(100%-1rem)]">
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Site state · click to toggle</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-0.5">
            {SITE_STATES.map((s) => (
              <button key={s} onClick={() => p.onToggleState(s)} className={`flex items-center gap-1.5 text-[10px] text-left ${p.visible[s] ? "text-foreground" : "text-muted-foreground/50 line-through"}`}>
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: SITE_STATE_COLOR[s], opacity: p.visible[s] ? 1 : 0.3 }} />
                {SITE_STATE_LABEL[s]}
                <span className="font-mono tabular-nums text-muted-foreground ml-auto">{p.counts[s]}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-1 border-t border-primary/15">
            <button onClick={p.onToggleIncidents} className={`flex items-center gap-1.5 text-[10px] ${p.showIncidents ? "text-foreground" : "text-muted-foreground/50 line-through"}`}>
              <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" /> Active incidents ({p.incidents.length})
            </button>
            <button onClick={p.onToggleTeams} className={`flex items-center gap-1.5 text-[10px] ${p.showTeams ? "text-foreground" : "text-muted-foreground/50 line-through"}`}>
              <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Response teams ({p.teams.length})
            </button>
          </div>
        </div>
      }
    >
      <LayerGroup key={layerKey}>
        {ordered.map((s) => {
          const color = SITE_STATE_COLOR[s.status];
          const hot = s.status === "critical" || s.status === "incident";
          return (
            <CircleMarker
              key={s.id}
              center={[s.location.lat, s.location.lng]}
              radius={BASE_RADIUS[s.status] * zoomBoost}
              pathOptions={{ color: hot ? "#ffffff" : color, weight: hot ? 1.5 : 0.6, fillColor: color, fillOpacity: hot ? 0.95 : 0.75 }}
              eventHandlers={{ click: () => p.onSite(s.id) }}
            >
              <Tooltip className="cnii-tip" direction="top">
                <div className="text-[11px]">
                  <p className="font-mono font-semibold">{s.id}</p>
                  <p>{s.name} · {s.state}</p>
                  <p style={{ color }}>{SITE_STATE_LABEL[s.status]} · protection {s.protectionScore}</p>
                  <p className="opacity-70">Risk 72h {s.riskScore} · {s.tenants.join(", ")}</p>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </LayerGroup>

      {p.showTeams && p.teams.map((t) => (
        <Marker key={t.id} position={[t.location.lat, t.location.lng]} icon={dotIcon(TEAM_STATUS_COLOR[t.status], { size: 9, shape: "square", label: p.level !== "national" ? t.callsign : undefined })}>
          <Tooltip className="cnii-tip" direction="top">
            <div className="text-[11px]">
              <p className="font-mono font-semibold">{t.callsign}</p>
              <p>{t.provider}</p>
              <p style={{ color: TEAM_STATUS_COLOR[t.status] }}>{TEAM_STATUS_LABEL[t.status]}{t.currentIncidentId ? ` · ${t.currentIncidentId}` : ""}</p>
            </div>
          </Tooltip>
        </Marker>
      ))}

      {p.showIncidents && p.incidents.map((i) => (
        <Marker
          key={i.id}
          position={[i.location.lat, i.location.lng]}
          icon={dotIcon(SEVERITY_COLOR[i.severity], { size: i.severity === "critical" ? 16 : 12, pulse: i.severity === "critical" || i.severity === "high", shape: "diamond" })}
          eventHandlers={{ click: () => p.onIncident(i.id) }}
          zIndexOffset={1000}
        >
          <Tooltip className="cnii-tip" direction="top">
            <div className="text-[11px]">
              <p className="font-mono font-semibold">{i.id}</p>
              <p>{i.title} · {i.state}</p>
              <p style={{ color: SEVERITY_COLOR[i.severity] }}>{i.severity.toUpperCase()} · {INCIDENT_STATUS_LABEL[i.status]}</p>
              <p className="opacity-70">{i.siteName}</p>
            </div>
          </Tooltip>
        </Marker>
      ))}
    </OpsMap>
  );
}
