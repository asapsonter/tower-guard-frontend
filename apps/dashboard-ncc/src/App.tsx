import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster, SonnerToaster, TooltipProvider, LiveFlowMonitor, RoleMismatchScreen } from "@tower-guard/ui";
import { AuthProvider, useAuth, useRoleGuard, useFlowMonitorSubscriptions } from "@tower-guard/hooks";
import { TELECOM_PROVIDERS } from "@tower-guard/data";
import { NCCSidebar } from "./components/NCCSidebar";
import ProviderFilter from "./components/ProviderFilter";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import NationalCoverage from "./pages/NationalCoverage";
import IncidentDetail from "./pages/IncidentDetail";
import Providers from "./pages/Providers";
import Compliance from "./pages/Compliance";
import Reports from "./pages/Reports";

const queryClient = new QueryClient();

// Provider short names used for filtering — null means "All"
export type ProviderShort = "MTN" | "GLO" | "AIR" | "9MB";

const ProtectedApp = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<ProviderShort | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Read-only NCC monitoring dashboard
  const roleGuard = useRoleGuard("ncc_regulator");

  // Subscribe to Supabase realtime so the LiveFlowMonitor sees every push
  useFlowMonitorSubscriptions({ appName: "dashboard-ncc" });

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
    <div className="min-h-screen bg-background hud-bg flex">
      <LiveFlowMonitor />
      <NCCSidebar userName={user?.full_name} onLogout={logout} />
      <main className="flex-1 overflow-y-auto p-4">
        <ProviderFilter selected={selectedProvider} onSelect={setSelectedProvider} selectedState={selectedState} onStateSelect={setSelectedState} />
        <Routes>
          <Route path="/" element={<Overview provider={selectedProvider} state={selectedState} />} />
          <Route path="/national-coverage" element={<NationalCoverage provider={selectedProvider} state={selectedState} />} />
          <Route path="/incidents/:state" element={<IncidentDetail provider={selectedProvider} />} />
          <Route path="/providers" element={<Providers provider={selectedProvider} state={selectedState} />} />
          <Route path="/compliance" element={<Compliance provider={selectedProvider} state={selectedState} />} />
          <Route path="/reports" element={<Reports provider={selectedProvider} state={selectedState} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
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
