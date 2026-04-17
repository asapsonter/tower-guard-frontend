import { useState, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import {
  SonnerToaster,
  Toaster,
  TooltipProvider,
  SidebarProvider,
  SidebarTrigger,
  LiveFlowMonitor,
} from "@tower-guard/ui";
import {
  AuthProvider,
  useAuth,
  useTheme,
  useSimulation,
  useAlertDispatchBridge,
  useRoleGuard,
  useFlowMonitorSubscriptions,
} from "@tower-guard/hooks";
import { type AssetType, mockTelecomMasts, TELECOM_PROVIDERS } from "@tower-guard/data";
import { AppSidebar } from "./components/AppSidebar";
import Login from "./pages/Login";
import Index from "./pages/Index";
import LiveMonitoring from "./pages/LiveMonitoring";
import Incidents from "./pages/Incidents";
import ZonalCenters from "./pages/ZonalCenters";
import History from "./pages/History";
import Reports from "./pages/Reports";
import NationalCoverage from "./pages/NationalCoverage";
import MastDashboard from "./pages/MastDashboard";
import Inventory from "./pages/Inventory";
import SmartMonitoring from "./pages/SmartMonitoring";
import GeoLocation from "./pages/GeoLocation";

const queryClient = new QueryClient();

/**
 * AlertDispatchBridge — invisible component that owns its own WebSocket
 * subscription via useSimulation() and bridges critical alerts into the
 * Supabase dispatch_assignments table. Only mounted in dashboard-main.
 *
 * The hardware (AX-Pro panel + cameras) physically lives in the office,
 * but represents a specific telecom mast site for the demo. Configure
 * which mast it represents via VITE_HARDWARE_MAST_ID in .env. The bridge
 * looks the mast up and writes its name/address into the dispatch so the
 * NSCDC Station Dashboard shows the alert as coming from that mast site.
 *
 * Default: tm_021 — MTN Maitama Tower (Aguiyi Ironsi Street, Maitama).
 * To change: set VITE_HARDWARE_MAST_ID=tm_xxx in .env and restart vite.
 */
const HARDWARE_MAST_ID =
  (import.meta.env.VITE_HARDWARE_MAST_ID as string | undefined) ?? "tm_021";

const AlertDispatchBridge = () => {
  const { alerts } = useSimulation();

  // Resolve the mast object once. useMemo so we don't search 380 records
  // on every render.
  const hardwareMast = useMemo(
    () => mockTelecomMasts.find((m) => m.id === HARDWARE_MAST_ID),
    [],
  );

  useAlertDispatchBridge({ enabled: true, alerts, hardwareMast });
  return null;
};

// Resolve the site mast that this dashboard is logged into. This is the
// same mast the hardware represents. The site name is displayed in the
// header and never changes during the session.
const siteMatch = mockTelecomMasts.find((m) => m.id === HARDWARE_MAST_ID);
const SITE_MAST = siteMatch ?? {
  id: HARDWARE_MAST_ID,
  name: "Unknown Mast Site",
  provider: "Unknown",
  providerShort: "???",
  state: "FCT",
  lga: "Unknown",
  address: "Address not configured",
  lat: 9.06, lng: 7.49,
  tampered: 0, intruders: 0, status: "secure" as const,
  towerHeight: 0, generatorFuel: 0, batteryCharge: 0,
  lastMaintenance: "",
};

const ProtectedApp = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<AssetType>("Telecom Mast");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedLga, setSelectedLga] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  // Redirect users with the wrong role to their home app.
  useRoleGuard("telecom_admin");

  // Subscribe to Supabase realtime so the LiveFlowMonitor sees every push
  useFlowMonitorSubscriptions({ appName: "dashboard-main" });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <SidebarProvider>
      <AlertDispatchBridge />
      <LiveFlowMonitor />
      <div className="min-h-screen flex w-full">
        <AppSidebar
          selectedAsset={selectedAsset}
          onAssetChange={setSelectedAsset}
          onStateSelect={(state) => { setSelectedState(state); setSelectedLga(null); }}
          onLgaSelect={setSelectedLga}
          theme={theme}
          onToggleTheme={toggleTheme}
          user={user}
          onLogout={logout}
          appRole="telecom_admin"
        />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-3 shrink-0 gap-3">
            <SidebarTrigger />
            {/* Site identity — permanent for this session */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${TELECOM_PROVIDERS.find(p => p.shortName === SITE_MAST.providerShort)?.color ?? "#6366f1"}20` }}>
                <span className="text-[10px] font-bold"
                  style={{ color: TELECOM_PROVIDERS.find(p => p.shortName === SITE_MAST.providerShort)?.color }}>
                  {SITE_MAST.providerShort}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{SITE_MAST.name}</p>
                <p className="text-[9px] text-muted-foreground truncate">{SITE_MAST.address}</p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Live indicator */}
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 border border-success/30 text-[9px] font-semibold text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                LIVE
              </span>
              {selectedState && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                  {selectedState}{selectedLga ? ` / ${selectedLga}` : ""}
                  <button
                    onClick={() => { setSelectedState(null); setSelectedLga(null); }}
                    className="ml-1 hover:text-destructive"
                  >
                    ��
                  </button>
                </span>
              )}
            </div>
          </header>
          <main className="flex-1 p-4 overflow-y-auto">
            <Routes>
              <Route path="/" element={
                <Index selectedState={selectedState} selectedLga={selectedLga} onStateSelect={setSelectedState} onLgaSelect={setSelectedLga} />
              } />
              <Route path="/live-monitoring" element={<LiveMonitoring />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/smart-monitoring" element={<SmartMonitoring />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/zonal-centers" element={<ZonalCenters />} />
              <Route path="/history" element={<History />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/national-coverage" element={<NationalCoverage />} />
              <Route path="/geo-location" element={
                <GeoLocation selectedState={selectedState} selectedLga={selectedLga} />
              } />
              <Route path="/mast/:id" element={<MastDashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SonnerToaster />
        <BrowserRouter>
          <AuthProvider>
            <ProtectedApp />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
