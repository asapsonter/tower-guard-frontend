import { AlertTriangle, Radio, Eye } from "lucide-react";
import type { Alert, AlertSeverity } from "@tower-guard/data";
import { motion, AnimatePresence } from "framer-motion";

const severityConfig: Record<AlertSeverity, { icon: typeof AlertTriangle; colorClass: string; bgClass: string }> = {
  critical: { icon: AlertTriangle, colorClass: "text-destructive", bgClass: "bg-destructive/10 border-destructive/30" },
  warning: { icon: Radio, colorClass: "text-warning", bgClass: "bg-warning/10 border-warning/30" },
  info: { icon: Eye, colorClass: "text-primary", bgClass: "bg-primary/10 border-primary/30" },
};

const AlertItem = ({ alert }: { alert: Alert }) => {
  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 p-3 rounded-lg border ${config.bgClass}`}
    >
      <Icon className={`h-4 w-4 mt-0.5 ${config.colorClass} shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold tracking-wide ${config.colorClass}`}>{alert.eventType}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{alert.sensorName}</p>
        <p className="text-[10px] font-mono text-muted-foreground/70 mt-1">{alert.timestamp}</p>
      </div>
    </motion.div>
  );
};

const RealTimeAlerts = ({ alerts }: { alerts: Alert[] }) => {
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  return (
    <div className="glass-panel h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm font-semibold text-foreground">Intruder Alerts</span>
        </div>
        <span className="text-[10px] font-mono bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">
          {alerts.length} DETECTED
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence initial={false}>
          {alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RealTimeAlerts;
