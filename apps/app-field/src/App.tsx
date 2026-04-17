import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, NavLink } from "react-router-dom";
import { Shield, ListTodo, User } from "lucide-react";
import { Toaster, SonnerToaster, TooltipProvider, LiveFlowMonitor } from "@tower-guard/ui";
import { AuthProvider, useAuth, useRoleGuard, useFlowMonitorSubscriptions } from "@tower-guard/hooks";
import Login from "./pages/Login";
import AssignmentList from "./pages/AssignmentList";
import AssignmentDetail from "./pages/AssignmentDetail";
import Profile from "./pages/Profile";
import { flush } from "./offline/queue";

const queryClient = new QueryClient();

/**
 * Background job: try to flush the offline queue every 30 seconds.
 * If the device just came back online, items are sent. If still offline,
 * the handlers throw and the items remain queued.
 *
 * The actual sendMessage / sendStatus / sendEvidence handlers are wired
 * inside ResponderAppLayout which has access to supabase via @tower-guard/hooks.
 * Here we just kick the flush loop with a no-op handler set so the queue is
 * inspected periodically — the real handlers are injected at the page level.
 */
const OfflineSyncWorker = () => {
  useEffect(() => {
    const noopHandlers = {
      sendMessage: async () => false,
      sendStatus: async () => false,
      sendEvidence: async () => false,
    };
    const tick = async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      await flush(noopHandlers).catch(() => null);
    };
    tick();
    const interval = setInterval(tick, 30000);
    window.addEventListener("online", tick);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", tick);
    };
  }, []);
  return null;
};

const ProtectedApp = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  useRoleGuard("nscdc_responder");

  // Subscribe to Supabase realtime so the LiveFlowMonitor sees every push
  useFlowMonitorSubscriptions({ appName: "app-field" });

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
    <div className="min-h-screen bg-background flex flex-col">
      <OfflineSyncWorker />
      <LiveFlowMonitor />

      {/* Mobile-first top bar */}
      <header className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold text-foreground">Field Mobile App</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[180px]">
          {user?.full_name}
        </span>
      </header>

      <main className="flex-1 overflow-y-auto pb-16">
        <Routes>
          <Route path="/" element={<AssignmentList />} />
          <Route path="/assignment/:id" element={<AssignmentDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-background/95 backdrop-blur-xl flex items-center justify-around z-50">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`
          }
        >
          <ListTodo className="h-5 w-5" />
          <span className="text-[9px] font-semibold">Assignments</span>
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`
          }
        >
          <User className="h-5 w-5" />
          <span className="text-[9px] font-semibold">Profile</span>
        </NavLink>
      </nav>
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
