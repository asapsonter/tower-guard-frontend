import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster, SonnerToaster, TooltipProvider, LiveFlowMonitor } from "@tower-guard/ui";
import { AuthProvider, useAuth, useRoleGuard, useFlowMonitorSubscriptions } from "@tower-guard/hooks";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Officers from "./pages/Officers";
import Incidents from "./pages/Incidents";
import Accountability from "./pages/Accountability";
import Evidence from "./pages/Evidence";

const queryClient = new QueryClient();

const ProtectedApp = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  // Redirect users with the wrong role to their home app.
  useRoleGuard("nscdc_command");

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

  return (
    <div className="min-h-screen bg-background p-4">
      <LiveFlowMonitor />
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-muted-foreground">
          Logged in as <strong className="text-foreground">{user?.full_name}</strong> · NSCDC Station
        </span>
        <button onClick={logout} className="text-xs text-destructive hover:underline">Sign Out</button>
      </div>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/officers" element={<Officers />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/accountability" element={<Accountability />} />
        <Route path="/evidence" element={<Evidence />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
