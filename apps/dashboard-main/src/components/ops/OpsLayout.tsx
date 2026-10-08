import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Globe2, Building2, ScanEye, Siren, Radio, KeyRound, Network, Radar, FolderLock, HeartPulse, Gauge, LineChart, Bot,
  LogOut, Menu, X, Search, AlertOctagon, MonitorPlay, Activity, Package, MapPinned, History, FileText, Map as MapIcon,
  Loader2, Signal,
} from "lucide-react";
import { searchAnything, useNow, useOps, type SearchHit } from "@/lib/ops";

type NavItem = { to: string; label: string; icon: typeof Globe2; end?: boolean };

const NAV: { section: string; items: NavItem[] }[] = [
  { section: "Command", items: [{ to: "/", label: "Operations Overview", icon: Globe2, end: true }] },
  { section: "Sites", items: [
    { to: "/sites", label: "Site Digital Twin", icon: Building2 },
    { to: "/fusion", label: "CCTV & Sensor Fusion", icon: ScanEye },
  ] },
  { section: "Incidents", items: [{ to: "/incidents", label: "Incident Command", icon: Siren }] },
  { section: "Response", items: [{ to: "/response", label: "Response & SLA", icon: Radio }] },
  { section: "Access", items: [{ to: "/access", label: "Access & Insider Risk", icon: KeyRound }] },
  { section: "Intelligence", items: [
    { to: "/intelligence", label: "Threat & Patterns", icon: Network },
    { to: "/risk", label: "Predictive Risk", icon: Radar },
  ] },
  { section: "Cases", items: [{ to: "/cases", label: "Evidence & Prosecution", icon: FolderLock }] },
  { section: "Health", items: [{ to: "/health", label: "System Health", icon: HeartPulse }] },
  { section: "SLA", items: [{ to: "/sla", label: "Executive & SLA Scorecard", icon: Gauge }] },
  { section: "Reports", items: [
    { to: "/impact", label: "Asset Loss & Impact", icon: LineChart },
    { to: "/reports", label: "Reports", icon: FileText },
  ] },
  { section: "Site Operations", items: [
    { to: "/site-board", label: "Live Site Board", icon: MonitorPlay },
    { to: "/smart-monitoring", label: "Smart Monitoring", icon: Activity },
    { to: "/inventory", label: "Inventory", icon: Package },
    { to: "/zonal-centers", label: "Zonal Coverage", icon: MapPinned },
    { to: "/national-coverage", label: "National Coverage", icon: MapIcon },
    { to: "/geo-location", label: "Geo-Location", icon: Signal },
    { to: "/history", label: "History", icon: History },
  ] },
];

const HIT_ICON: Record<SearchHit["kind"], typeof Globe2> = {
  site: Building2, incident: Siren, person: KeyRound, vehicle: Radio, contractor: KeyRound, case: FolderLock, team: Radio, campaign: Network,
};

export function OpsLayout({ children, userName, onLogout }: { children: ReactNode; userName?: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const { snap, loading, error } = useOps();
  const navigate = useNavigate();
  const now = useNow();
  const clock = new Date(now).toLocaleTimeString("en-GB", { timeZone: "Africa/Lagos", hour12: false });
  const date = new Date(now).toLocaleDateString("en-GB", { timeZone: "Africa/Lagos", weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  const critical = snap?.incidents.filter((i) => i.status !== "closed" && i.severity === "critical").length ?? 0;

  return (
    <div className="min-h-screen bg-background hud-bg flex">
      <aside className={`fixed lg:sticky top-0 z-40 h-screen w-[236px] shrink-0 border-r border-primary/15 bg-[hsl(var(--sidebar-background))] flex flex-col transition-transform ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-primary/15">
          <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center"><Radar className="h-4 w-4 text-primary" /></div>
          <div className="min-w-0">
            <p className="font-display text-[11px] font-bold text-foreground leading-tight">ITIPS · OPERATOR</p>
            <p className="text-[9px] text-muted-foreground leading-tight truncate">{snap?.operatorName ?? "Operator"} Command</p>
          </div>
          <button className="ml-auto lg:hidden p-1" onClick={() => setOpen(false)}><X className="h-4 w-4" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
          {NAV.map((g) => (
            <div key={g.section}>
              <p className="px-2 mb-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">{g.section}</p>
              {g.items.map((it) => (
                <NavLink key={it.to} to={it.to} end={it.end} onClick={() => setOpen(false)}
                  className={({ isActive }) => `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[12px] transition-colors ${isActive ? "bg-gradient-to-r from-primary/20 to-transparent text-primary shadow-[inset_2px_0_0_hsl(var(--primary))]" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>
                  <it.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{it.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-primary/15 p-3">
          <p className="text-[11px] font-semibold text-foreground truncate">{userName ?? "NOC Operator"}</p>
          <p className="text-[9px] text-muted-foreground">Network Operations Centre</p>
          <button onClick={onLogout} className="mt-2 flex items-center gap-1.5 text-[11px] text-destructive hover:underline"><LogOut className="h-3 w-3" /> Sign out</button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="hud-header sticky top-0 z-[1100] h-14 flex items-center gap-3 px-4 border-b border-border">
          <button className="lg:hidden p-1" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <SearchAnything onPick={(h) => navigate(h.link)} />
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => navigate("/guardian")} className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-primary/40 bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20">
              <Bot className="h-3.5 w-3.5" /> Guardian AI
            </button>
            <button onClick={() => navigate("/emergency")} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-bold tracking-wide ${critical ? "border-destructive bg-destructive/20 text-red-200 animate-pulse" : "border-destructive/40 text-destructive hover:bg-destructive/10"}`}>
              <AlertOctagon className="h-3.5 w-3.5" /> EMERGENCY{critical ? ` · ${critical}` : ""}
            </button>
            <div className="text-right hidden md:block pl-2">
              <p className="font-mono text-sm font-bold text-foreground tabular-nums leading-tight">{clock} <span className="text-[9px] text-muted-foreground">WAT</span></p>
              <p className="text-[9px] text-muted-foreground leading-tight">{date}</p>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 space-y-4 min-w-0">
          {loading && !snap ? (
            <div className="flex items-center justify-center h-64"><div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          ) : error && !snap ? (
            <div className="glass-panel p-6 text-sm text-destructive">Could not load operator data: {error}</div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

/** Search Anything — Site ID, incident, person, vehicle, contractor, case. Ctrl/⌘+K focuses it. */
function SearchAnything({ onPick }: { onPick: (hit: SearchHit) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); inputRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    setBusy(true);
    const t = setTimeout(async () => {
      const res = await searchAnything(q);
      setHits(res); setActive(0); setBusy(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const choose = (h: SearchHit) => { onPick(h); setOpen(false); setQ(""); inputRef.current?.blur(); };

  return (
    <div className="relative w-full max-w-[460px]">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === "Enter" && hits[active]) choose(hits[active]);
          if (e.key === "Escape") inputRef.current?.blur();
        }}
        placeholder="Search anything — site ID, incident, person, vehicle, contractor, case"
        className="w-full rounded-md bg-secondary/60 border border-primary/20 pl-8 pr-14 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-muted-foreground border border-border rounded px-1">⌘K</span>
      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-1 rounded-md border border-primary/30 bg-popover/95 backdrop-blur-xl shadow-2xl max-h-[60vh] overflow-y-auto">
          {busy && hits.length === 0 ? (
            <p className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Searching…</p>
          ) : hits.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">No matches for “{q}”.</p>
          ) : (
            hits.map((h, i) => {
              const Icon = HIT_ICON[h.kind];
              return (
                <button key={`${h.kind}-${h.id}`} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(h)} onMouseEnter={() => setActive(i)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left ${i === active ? "bg-primary/15" : ""}`}>
                  <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground truncate">{h.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{h.detail}</p>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{h.kind}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
