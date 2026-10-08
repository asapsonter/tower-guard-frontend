import { useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { SonnerToaster, Toaster, TooltipProvider, LiveFlowMonitor, RoleMismatchScreen } from "@tower-guard/ui";
import {
  AuthProvider,
  useAuth,
  useSimulation,
  useAlertDispatchBridge,
  useRoleGuard,
  useFlowMonitorSubscriptions,
} from "@tower-guard/hooks";
import { mockTelecomMasts } from "@tower-guard/data";
import { OpsProvider } from "./lib/ops";
import { OpsLayout } from "./components/ops/OpsLayout";
import Login from "./pages/Login";
// Site Operations (hardware-linked live site board and legacy views)
import Index from "./pages/Index";
import SmartMonitoring from "./pages/SmartMonitoring";
import Incidents from "./pages/Incidents";
import ZonalCenters from "./pages/ZonalCenters";
import History from "./pages/History";
import Reports from "./pages/Reports";
import NationalCoverage from "./pages/NationalCoverage";
import MastDashboard from "./pages/MastDashboard";
import Inventory from "./pages/Inventory";
import GeoLocation from "./pages/GeoLocation";
// Operator Command workspaces
import Overview from "./pages/ops/Overview";
import Emergency from "./pages/ops/Emergency";
import SiteTwin from "./pages/ops/SiteTwin";
import SensorFusion from "./pages/ops/SensorFusion";
import IncidentCommand from "./pages/ops/IncidentCommand";
import ResponseSla from "./pages/ops/ResponseSla";
import AccessInsider from "./pages/ops/AccessInsider";
import ThreatPatterns from "./pages/ops/ThreatPatterns";
import PredictiveRisk from "./pages/ops/PredictiveRisk";
import Cases from "./pages/ops/Cases";
import SystemHealth from "./pages/ops/SystemHealth";
import Scorecard from "./pages/ops/Scorecard";
import Impact from "./pages/ops/Impact";
import Guardian from "./pages/ops/Guardian";

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

const ProtectedApp = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  // Redirect users with the wrong role to their home app.
  const roleGuard = useRoleGuard("telecom_admin");

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

  // Signed in with another app's account (often a remembered session)
  if (roleGuard.mismatch) {
    return (
      <RoleMismatchScreen
        userName={user?.full_name}
        accountAppName={roleGuard.accountAppName!}
        accountAppUrl={roleGuard.accountAppUrl!}
        thisAppName={roleGuard.thisAppName}
        onSignOut={logout}
      />
    );
  }

  return (
    <OpsProvider>
      <AlertDispatchBridge />
      <LiveFlowMonitor />
      <OpsLayout userName={user?.full_name} onLogout={logout}>
        <Routes>
          {/* Operator Command workspaces */}
          <Route path="/" element={<Overview />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/sites" element={<SiteTwin />} />
          <Route path="/sites/:id" element={<SiteTwin />} />
          <Route path="/fusion" element={<SensorFusion />} />
          <Route path="/fusion/:siteId" element={<SensorFusion />} />
          <Route path="/incidents" element={<IncidentCommand />} />
          <Route path="/incidents/:id" element={<IncidentCommand />} />
          <Route path="/response" element={<ResponseSla />} />
          <Route path="/access" element={<AccessInsider />} />
          <Route path="/intelligence" element={<ThreatPatterns />} />
          <Route path="/risk" element={<PredictiveRisk />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/:id" element={<Cases />} />
          <Route path="/health" element={<SystemHealth />} />
          <Route path="/sla" element={<Scorecard />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/guardian" element={<Guardian />} />
          {/* Site Operations — hardware-linked board and earlier views */}
          <Route path="/site-board" element={<Index />} />
          <Route path="/smart-monitoring" element={<SmartMonitoring />} />
          <Route path="/live-monitoring" element={<Navigate to="/smart-monitoring" replace />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/legacy-incidents" element={<Incidents />} />
          <Route path="/zonal-centers" element={<ZonalCenters />} />
          <Route path="/history" element={<History />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/national-coverage" element={<NationalCoverage />} />
          <Route path="/geo-location" element={<GeoLocation selectedState={null} selectedLga={null} />} />
          <Route path="/mast/:id" element={<MastDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </OpsLayout>
    </OpsProvider>
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
