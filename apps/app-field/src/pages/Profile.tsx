import { useEffect, useState } from "react";
import { useAuth } from "@tower-guard/hooks";
import { countPending } from "../offline/queue";

export default function Profile() {
  const { user, logout } = useAuth();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    countPending().then(setPending);
    const interval = setInterval(() => countPending().then(setPending), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-bold text-foreground">Profile</h1>
      <div className="glass-panel p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Officer</span>
          <span className="text-sm font-semibold text-foreground">{user?.full_name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Email</span>
          <span className="text-xs text-foreground">{user?.email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Role</span>
          <span className="text-xs text-foreground">{user?.role}</span>
        </div>
      </div>

      <div className="glass-panel p-4 space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Offline Queue</h2>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Pending items</span>
          <span className={`text-sm font-bold ${pending > 0 ? "text-warning" : "text-success"}`}>{pending}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Items queued while offline will sync automatically when network returns.
        </p>
      </div>

      <button
        onClick={logout}
        className="w-full glass-panel p-3 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
