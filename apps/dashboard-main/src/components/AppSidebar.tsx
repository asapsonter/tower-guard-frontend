import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Monitor, Package, AlertTriangle, Building2, Clock, FileText, Globe,
  MapPin, ChevronDown, ChevronRight, User, Signal, Shield, Sun, Moon, LogOut, Eye
} from "lucide-react";
import logo from "@/assets/seismic-logo.png";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarGroup,
  SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, useSidebar,
} from "@tower-guard/ui";
import { ASSET_TYPES, NIGERIAN_STATES, type AssetType } from "@tower-guard/data";
import type { AppRole } from "@tower-guard/hooks";

const SHARED_NAV = [
  { title: "National Coverage", path: "/national-coverage", icon: Globe },
  { title: "Reports", path: "/reports", icon: FileText },
];

const TELECOM_ADMIN_NAV = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Live Monitoring", path: "/live-monitoring", icon: Monitor },
  { title: "Inventory", path: "/inventory", icon: Package },
  { title: "Smart Monitoring", path: "/smart-monitoring", icon: Eye },
  { title: "Incidents", path: "/incidents", icon: AlertTriangle },
  { title: "Zonal Coverage", path: "/zonal-centers", icon: Building2 },
  { title: "History", path: "/history", icon: Clock },
  { title: "Reports", path: "/reports", icon: FileText },
  { title: "National Coverage", path: "/national-coverage", icon: Globe },
];

// NOTE: these branches are dead code in the monorepo split — each role now
// has its own app with its own sidebar. Kept for backward compatibility with
// the typed Record below; safe to delete in a follow-up.
const NSCDC_COMMAND_NAV = [
  { title: "NSCDC Station Dashboard", path: "/", icon: Shield },
  ...SHARED_NAV,
];

const NCC_REGULATOR_NAV = [
  { title: "NCC Monitoring Dashboard", path: "/", icon: Globe },
  ...SHARED_NAV,
];

const NAV_ITEMS_BY_ROLE: Record<AppRole, typeof TELECOM_ADMIN_NAV> = {
  telecom_admin: TELECOM_ADMIN_NAV,
  nscdc_command: NSCDC_COMMAND_NAV,
  ncc_regulator: NCC_REGULATOR_NAV,
  nscdc_responder: [],
};

const ROLE_BADGE: Record<AppRole, { label: string; color: string }> = {
  telecom_admin: { label: "Telecom Admin", color: "text-primary" },
  nscdc_command: { label: "NSCDC Station", color: "text-green-500" },
  nscdc_responder: { label: "NSCDC Responder", color: "text-orange-500" },
  ncc_regulator: { label: "NCC Monitoring", color: "text-blue-500" },
};

interface AppSidebarProps {
  selectedAsset: AssetType;
  onAssetChange: (asset: AssetType) => void;
  onStateSelect?: (state: string | null) => void;
  onLgaSelect?: (lga: string | null) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  user?: { full_name: string; role: string; email: string } | null;
  onLogout?: () => void;
  appRole?: AppRole;
}

export function AppSidebar({ selectedAsset, onAssetChange, onStateSelect, onLgaSelect, theme, onToggleTheme, user, onLogout, appRole = "telecom_admin" }: AppSidebarProps) {
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = useMemo(() => NAV_ITEMS_BY_ROLE[appRole] ?? TELECOM_ADMIN_NAV, [appRole]);

  const [assetOpen, setAssetOpen] = useState(false);
  const [geoOpen, setGeoOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [stateListOpen, setStateListOpen] = useState(false);
  const [lgaListOpen, setLgaListOpen] = useState(false);

  const handleStateSelect = (stateName: string) => {
    setSelectedState(stateName);
    setStateListOpen(false);
    setLgaListOpen(true);
    onStateSelect?.(stateName);
    if (location.pathname !== "/geo-location") navigate("/geo-location");
  };

  const handleLgaSelect = (lga: string) => {
    setLgaListOpen(false);
    setGeoOpen(false);
    onLgaSelect?.(lga);
    if (location.pathname !== "/geo-location") navigate("/geo-location");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border pb-3">
        <div className="flex items-center gap-2 px-1 mb-3">
          <img src={logo} alt="Tower Guard" className="h-8 w-8 shrink-0" />
          {!collapsed && (
            <span className="text-sm font-bold tracking-tight text-gradient-primary truncate">
              TOWER GUARD CITADEL
            </span>
          )}
        </div>
        {!collapsed && (
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.full_name || "John Adebayo"}</p>
                <div className="flex items-center gap-1">
                  <Shield className={`h-2.5 w-2.5 ${ROLE_BADGE[appRole].color}`} />
                  <p className={`text-[10px] font-medium ${ROLE_BADGE[appRole].color}`}>{user?.role || ROLE_BADGE[appRole].label}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onToggleTheme}
                className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4 text-primary" />}
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <button onClick={onToggleTheme} className="p-1 rounded-lg hover:bg-sidebar-accent transition-colors">
              {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-warning" /> : <Moon className="h-3.5 w-3.5 text-primary" />}
            </button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {!collapsed && appRole === "telecom_admin" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Asset Type</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-1">
                <button onClick={() => setAssetOpen(!assetOpen)} className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-secondary border border-border text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                  <span className="flex items-center gap-2"><Signal className="h-3.5 w-3.5 text-primary" />{selectedAsset}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${assetOpen ? "rotate-180" : ""}`} />
                </button>
                {assetOpen && (
                  <div className="mt-1 rounded-md border border-border bg-popover overflow-hidden">
                    {ASSET_TYPES.map((asset) => (
                      <button key={asset} onClick={() => { onAssetChange(asset); setAssetOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-sidebar-accent transition-colors ${asset === selectedAsset ? "bg-primary/10 text-primary font-medium" : "text-sidebar-foreground"}`}>
                        {asset}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton isActive={location.pathname === item.path} onClick={() => navigate(item.path)} tooltip={item.title}>
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed ? (
          <div>
            <button onClick={() => { setGeoOpen(!geoOpen); if (!geoOpen) { setStateListOpen(true); setLgaListOpen(false); setSelectedState(null); } }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md text-xs font-semibold text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />Geo-Location</span>
              <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${geoOpen ? "rotate-90" : ""}`} />
            </button>
            {geoOpen && (
              <div className="mt-1 max-h-[240px] overflow-y-auto rounded-md border border-border bg-popover">
                {stateListOpen && !lgaListOpen && (
                  <>
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold bg-secondary sticky top-0">Select State</div>
                    {Object.keys(NIGERIAN_STATES).sort().map((stateName) => (
                      <button key={stateName} onClick={() => handleStateSelect(stateName)}
                        className="w-full text-left px-3 py-1.5 text-xs text-sidebar-foreground hover:bg-sidebar-accent transition-colors">{stateName}</button>
                    ))}
                  </>
                )}
                {lgaListOpen && selectedState && (
                  <>
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold bg-secondary sticky top-0 flex items-center gap-1">
                      <button onClick={() => { setLgaListOpen(false); setStateListOpen(true); setSelectedState(null); onStateSelect?.(null); }} className="text-primary hover:underline">← States</button>
                      <span>/ {selectedState}</span>
                    </div>
                    {NIGERIAN_STATES[selectedState]?.map((lga) => (
                      <button key={lga} onClick={() => handleLgaSelect(lga)}
                        className="w-full text-left px-3 py-1.5 text-xs text-sidebar-foreground hover:bg-sidebar-accent transition-colors">{lga}</button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Geo-Location" onClick={() => navigate("/geo-location")}>
                <MapPin className="h-4 w-4" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
