/**
 * LiveFlowMonitor — floating bottom-right widget that shows the real-time
 * data flow across every layer in every Tower Guard app.
 *
 * Click the pill to expand. Each event row shows:
 *   - Time (HH:MM:SS.mmm)
 *   - Source icon (WebSocket / Supabase write / Realtime push / Action / Error)
 *   - Category badge (dispatch / incident / message / etc)
 *   - Message
 *   - Expandable details on click
 *
 * The component reads from the FlowMonitor singleton via useFlowMonitor.
 * It is purely a viewer — events are produced elsewhere.
 */
import { useState, useMemo, type ComponentType } from "react";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Radio,
  Database,
  RadioTower,
  MousePointerClick,
  AlertTriangle,
  Trash2,
  Filter,
} from "lucide-react";
import { useFlowMonitor, flowMonitor, type FlowEvent, type FlowEventSource } from "../lib/flow-monitor";

const SOURCE_META: Record<FlowEventSource, { icon: ComponentType<{ className?: string }>; label: string; color: string }> = {
  websocket:          { icon: Radio,            label: "WS",      color: "text-cyan-400" },
  "supabase-write":   { icon: Database,         label: "WRITE",   color: "text-blue-400" },
  "supabase-realtime":{ icon: RadioTower,       label: "RT",      color: "text-violet-400" },
  "user-action":      { icon: MousePointerClick,label: "ACT",     color: "text-orange-400" },
  auth:               { icon: Activity,         label: "SYS",     color: "text-muted-foreground" },
  error:              { icon: AlertTriangle,    label: "ERR",     color: "text-destructive" },
};

const LEVEL_BG: Record<FlowEvent["level"], string> = {
  info:    "bg-secondary/30",
  success: "bg-green-500/10",
  warning: "bg-orange-500/10",
  error:   "bg-destructive/15",
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

function FlowEventRow({ event }: { event: FlowEvent }) {
  const [expanded, setExpanded] = useState(false);
  const meta = SOURCE_META[event.source];
  const Icon = meta.icon;

  return (
    <div className={`rounded px-2 py-1.5 text-[10px] font-mono ${LEVEL_BG[event.level]}`}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-2 text-left"
      >
        <Icon className={`h-3 w-3 mt-0.5 shrink-0 ${meta.color}`} />
        <span className="text-muted-foreground shrink-0">{formatTime(event.timestamp)}</span>
        <span className={`shrink-0 font-bold ${meta.color}`}>[{meta.label}]</span>
        <span className="shrink-0 px-1 rounded bg-secondary/60 text-[9px] uppercase tracking-wider">
          {event.category}
        </span>
        <span className="text-foreground truncate flex-1">{event.message}</span>
        {event.details && (
          <ChevronDown
            className={`h-3 w-3 text-muted-foreground transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`}
          />
        )}
      </button>
      {expanded && event.details && (
        <pre className="mt-1 ml-5 p-2 bg-background/60 rounded text-[9px] text-muted-foreground overflow-x-auto whitespace-pre-wrap break-words">
          {JSON.stringify(event.details, null, 2)}
        </pre>
      )}
    </div>
  );
}

type FilterMode = "all" | "dispatch" | "errors";

export function LiveFlowMonitor() {
  const events = useFlowMonitor();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("all");

  // Count "live" events (last 5 seconds) for the collapsed pill badge
  const recentCount = useMemo(
    () => events.filter((e: FlowEvent) => Date.now() - e.timestamp < 5000).length,
    [events],
  );

  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;
    if (filter === "errors") return events.filter((e: FlowEvent) => e.level === "error" || e.source === "error");
    if (filter === "dispatch") return events.filter((e: FlowEvent) => e.category === "dispatch" || e.category === "incident");
    return events;
  }, [events, filter]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] glass-panel px-3 py-2 flex items-center gap-2 hover:bg-secondary transition-colors shadow-lg"
        aria-label="Open Live Flow Monitor"
      >
        <Activity className={`h-4 w-4 ${recentCount > 0 ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
        <span className="text-xs font-mono text-foreground">Flow</span>
        {recentCount > 0 && (
          <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 font-bold">
            {recentCount}
          </span>
        )}
        <ChevronUp className="h-3 w-3 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] glass-panel w-[420px] max-h-[70vh] flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-xs font-bold text-foreground">Live Flow Monitor</span>
          <span className="text-[10px] text-muted-foreground">{events.length} events</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => flowMonitor.clear()}
            className="text-muted-foreground hover:text-destructive p-1 rounded"
            title="Clear buffer"
          >
            <Trash2 className="h-3 w-3" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground p-1 rounded"
            title="Collapse"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/30">
        <Filter className="h-3 w-3 text-muted-foreground" />
        {(["all", "dispatch", "errors"] as FilterMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setFilter(mode)}
            className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
              filter === mode
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {filteredEvents.length === 0 && (
          <div className="text-center py-8 px-3">
            <p className="text-[11px] text-muted-foreground mb-1">No events yet.</p>
            <p className="text-[10px] text-muted-foreground/70">
              Trigger a sensor or create a dispatch to see real-time activity.
            </p>
          </div>
        )}
        {filteredEvents.map((e: FlowEvent) => (
          <FlowEventRow key={e.id} event={e} />
        ))}
      </div>

      {/* Legend footer */}
      <div className="px-3 py-1.5 border-t border-border/30 flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-muted-foreground">
        <span><Radio className="h-2.5 w-2.5 inline text-cyan-400" /> WS</span>
        <span><Database className="h-2.5 w-2.5 inline text-blue-400" /> WRITE</span>
        <span><RadioTower className="h-2.5 w-2.5 inline text-violet-400" /> RT</span>
        <span><MousePointerClick className="h-2.5 w-2.5 inline text-orange-400" /> ACT</span>
        <span><AlertTriangle className="h-2.5 w-2.5 inline text-destructive" /> ERR</span>
      </div>
    </div>
  );
}
