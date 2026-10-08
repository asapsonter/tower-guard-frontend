import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  Globe2, Siren, Radio, Timer, BarChart3, FolderSearch, FileLock2, Network, UserX, PackageSearch, Gavel, Radar,
  Bot, LayoutDashboard, LogOut, Menu, X, Shield, AlertTriangle,
} from "lucide-react";
import { useCnii, useNow } from "@/lib/cnii";

const NAV: { section: string; items: { to: string; label: string; icon: typeof Globe2; end?: boolean }[] }[] = [
  { section: "Command", items: [
    { to: "/", label: "National CNII Command", icon: Globe2, end: true },
    { to: "/incident", label: "Live Incident Command", icon: Siren },
    { to: "/dispatch", label: "Dispatch & Response", icon: Radio },
    { to: "/sla", label: "SLA & Accountability", icon: Timer },
  ] },
  { section: "Performance", items: [
    { to: "/performance", label: "Officer & Formation", icon: BarChart3 },
  ] },
  { section: "Investigations", items: [
    { to: "/investigations", label: "Investigation Workspace", icon: FolderSearch },
    { to: "/evidence", label: "Evidence & Custody", icon: FileLock2 },
    { to: "/intelligence", label: "Suspect & MO Intelligence", icon: Network },
    { to: "/insider", label: "Insider-Collusion", icon: UserX },
  ] },
  { section: "Outcomes", items: [
    { to: "/assets", label: "Asset Recovery", icon: PackageSearch },
    { to: "/prosecution", label: "Prosecution Tracker", icon: Gavel },
  ] },
  { section: "Intelligence", items: [
    { to: "/threat", label: "Threat & Predictive", icon: Radar },
    { to: "/guardian", label: "Guardian AI", icon: Bot },
  ] },
  { section: "Operations", items: [
    { to: "/station", label: "FCT Station Board", icon: LayoutDashboard },
  ] },
];

export function CommandLayout({ children, userName, onLogout }: { children: ReactNode; userName?: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const { snap, loading, error } = useCnii();
  const now = useNow();
  const clock = new Date(now).toLocaleTimeString("en-GB", { timeZone: "Africa/Lagos", hour12: false });
  const date = new Date(now).toLocaleDateString("en-GB", { timeZone: "Africa/Lagos", weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-background hud-bg flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 z-40 h-screen w-[236px] shrink-0 border-r border-primary/15 bg-[hsl(var(--sidebar-background))] flex flex-col transition-transform ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-primary/15">
          <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center"><Shield className="h-4 w-4 text-primary" /></div>
          <div className="min-w-0">
            <p className="font-display text-[11px] font-bold text-foreground leading-tight">NSCDC · CNII</p>
            <p className="text-[9px] text-muted-foreground leading-tight">National Security Command</p>
          </div>
          <button className="ml-auto lg:hidden p-1" onClick={() => setOpen(false)}><X className="h-4 w-4" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
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
          <p className="text-[11px] font-semibold text-foreground truncate">{userName ?? "Duty Officer"}</p>
          <p className="text-[9px] text-muted-foreground">National Command Centre</p>
          <button onClick={onLogout} className="mt-2 flex items-center gap-1.5 text-[11px] text-destructive hover:underline"><LogOut className="h-3 w-3" /> Sign out</button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="hud-header sticky top-0 z-20 h-14 flex items-center gap-3 px-4 border-b border-border">
          <button className="lg:hidden p-1" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <p className="font-display text-[12px] font-bold text-foreground hidden sm:block">CRITICAL INFRASTRUCTURE PROTECTION</p>
          <div className="ml-auto flex items-center gap-2">
            {snap && (
              <>
                <span className="hud-chip"><Siren className="h-3 w-3" /> {snap.kpis.activeIncidents} active</span>
                <span className="hud-chip !text-destructive !border-destructive/40 !bg-destructive/10"><AlertTriangle className="h-3 w-3" /> {snap.kpis.criticalIncidents} critical</span>
              </>
            )}
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 border border-success/30 text-[9px] font-semibold text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> LIVE
            </span>
            <div className="text-right hidden md:block">
              <p className="font-mono text-sm font-bold text-foreground tabular-nums leading-tight">{clock} <span className="text-[9px] text-muted-foreground">WAT</span></p>
              <p className="text-[9px] text-muted-foreground leading-tight">{date}</p>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 space-y-4 min-w-0">
          {loading && !snap ? (
            <div className="flex items-center justify-center h-64"><div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          ) : error && !snap ? (
            <div className="glass-panel p-6 text-sm text-destructive">Could not load CNII data: {error}</div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
