import { NavLink } from "react-router-dom";
import {
  Globe,
  BarChart3,
  Shield,
  FileText,
  Map,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface NCCSidebarProps {
  userName?: string;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { path: "/", label: "Overview", icon: BarChart3, end: true },
  { path: "/national-coverage", label: "National Coverage", icon: Map, end: false },
  { path: "/providers", label: "Providers", icon: Globe, end: false },
  { path: "/compliance", label: "Compliance", icon: Shield, end: false },
  { path: "/reports", label: "Reports", icon: FileText, end: false },
];

export function NCCSidebar({ userName, onLogout }: NCCSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col border-r border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-200 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-4 border-b border-border/30">
        <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
          <Globe className="h-4 w-4 text-primary" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">NCC Monitoring</p>
            <p className="text-[9px] text-muted-foreground truncate">Read-Only Dashboard</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary/15 text-primary border border-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent"
              } ${collapsed ? "justify-center" : ""}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/30 p-2 space-y-1">
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          {!collapsed && <span>Collapse</span>}
        </button>

        {/* User + logout */}
        {!collapsed && userName && (
          <p className="text-[10px] text-muted-foreground truncate px-2.5">{userName}</p>
        )}
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] text-destructive hover:bg-destructive/10 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
