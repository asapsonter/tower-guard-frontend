import { useState, useEffect } from "react";
import { Settings, User, Bell, Volume2, VolumeX } from "lucide-react";
import logo from "@/assets/seismic-logo.png";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardHeaderProps {
  unreadCount: number;
  onClearUnread: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const DashboardHeader = ({ unreadCount, onClearUnread, soundEnabled, onToggleSound }: DashboardHeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="glass-panel flex items-center justify-between px-6 py-3 mb-4">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Seismic Surveillance" className="h-9 w-9" />
        <h1 className="text-lg font-bold tracking-tight text-gradient-primary">
          TOWER GUARD CITADEL
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-xs text-muted-foreground font-mono">
            {currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </p>
          <p className="text-sm font-mono text-foreground">
            {currentTime.toLocaleTimeString("en-US", { hour12: false })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-lg transition-colors ${soundEnabled ? "hover:bg-secondary text-primary" : "hover:bg-secondary text-muted-foreground"}`}
            title={soundEnabled ? "Mute alerts" : "Unmute alerts"}
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>

          <button
            onClick={onClearUnread}
            className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
            title="Clear notifications"
          >
            <Bell className={`h-5 w-5 ${unreadCount > 0 ? "text-warning" : "text-muted-foreground"}`} />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  key={unreadCount}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 bg-destructive rounded-full text-[9px] flex items-center justify-center font-bold text-destructive-foreground"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <User className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
