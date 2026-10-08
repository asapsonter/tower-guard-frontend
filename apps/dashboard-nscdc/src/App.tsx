import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster, SonnerToaster, TooltipProvider, LiveFlowMonitor, RoleMismatchScreen } from "@tower-guard/ui";
import { AuthProvider, useAuth, useRoleGuard, useFlowMonitorSubscriptions } from "@tower-guard/hooks";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Officers from "./pages/Officers";
import Incidents from "./pages/Incidents";
import Accountability from "./pages/Accountability";
import Evidence from "./pages/Evidence";
import { CniiProvider } from "./lib/cnii";
import { CommandLayout } from "./components/cnii/CommandLayout";
import NationalCommand from "./pages/command/NationalCommand";
import IncidentCommand from "./pages/command/IncidentCommand";
import DispatchCommand from "./pages/command/DispatchCommand";
import SlaAccountability from "./pages/command/SlaAccountability";
import Performance from "./pages/command/Performance";
import Investigations from "./pages/command/Investigations";
import EvidenceCustody from "./pages/command/EvidenceCustody";
import Intelligence from "./pages/command/Intelligence";
import InsiderCollusion from "./pages/command/InsiderCollusion";
import AssetRecovery from "./pages/command/AssetRecovery";
import Prosecution from "./pages/command/Prosecution";
import ThreatIntel from "./pages/command/ThreatIntel";
import Guardian from "./pages/command/Guardian";

const queryClient = new QueryClient();

const ProtectedApp = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  // Redirect users with the wrong role to their home app.
  const roleGuard = useRoleGuard("nscdc_command");

  // Subscribe to Supabase realtime so the LiveFlowMonitor sees every push
  useFlowMonitorSubscriptions({ appName: "dashboard-nscdc" });

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
    <CniiProvider>
      <LiveFlowMonitor />
      <CommandLayout userName={user?.full_name} onLogout={logout}>
        <Routes>
          <Route path="/" element={<NationalCommand />} />
          <Route path="/incident" element={<IncidentCommand />} />
          <Route path="/incident/:id" element={<IncidentCommand />} />
          <Route path="/dispatch" element={<DispatchCommand />} />
          <Route path="/sla" element={<SlaAccountability />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/investigations" element={<Investigations />} />
          <Route path="/investigations/:id" element={<Investigations />} />
          <Route path="/evidence" element={<EvidenceCustody />} />
          <Route path="/intelligence" element={<Intelligence />} />
          <Route path="/insider" element={<InsiderCollusion />} />
          <Route path="/assets" element={<AssetRecovery />} />
          <Route path="/prosecution" element={<Prosecution />} />
          <Route path="/threat" element={<ThreatIntel />} />
          <Route path="/guardian" element={<Guardian />} />
          {/* FCT station board (original NSCDC dashboard) */}
          <Route path="/station" element={<Overview />} />
          <Route path="/station/officers" element={<Officers />} />
          <Route path="/station/incidents" element={<Incidents />} />
          <Route path="/station/accountability" element={<Accountability />} />
          <Route path="/station/evidence" element={<Evidence />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CommandLayout>
    </CniiProvider>
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
