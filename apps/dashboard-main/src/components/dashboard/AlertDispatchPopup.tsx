import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Shield, X } from "lucide-react";
import { FIRST_RESPONDERS } from "@tower-guard/data";
import type { Alert } from "@tower-guard/data";

interface Responder {
  id: string;
  name: string;
  fullName: string;
  icon: string;
}

interface DispatchNotification {
  id: string;
  alert: Alert;
  responders: Responder[];
  timestamp: Date;
}

interface AlertDispatchPopupProps {
  alerts: Alert[];
}

const AlertDispatchPopup = ({ alerts }: AlertDispatchPopupProps) => {
  const [notifications, setNotifications] = useState<DispatchNotification[]>([]);
  const [seenAlerts, setSeenAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const criticals = alerts.filter(a => a.severity === "critical" && !seenAlerts.has(a.id));
    if (criticals.length === 0) return;

    const newNotifs: DispatchNotification[] = criticals.map(alert => {
      // Auto-select responders based on event type
      let responders = [...FIRST_RESPONDERS];
      if (alert.eventType === "ARMED" || alert.eventType === "KIDNAPPING") {
        responders = FIRST_RESPONDERS.filter(r => ["police", "army", "nscdc"].includes(r.id));
      } else if (alert.eventType === "TAMPERING" || alert.eventType === "VANDALISM") {
        responders = FIRST_RESPONDERS.filter(r => ["nscdc", "police", "community"].includes(r.id));
      }
      return {
        id: `dispatch-${alert.id}`,
        alert,
        responders,
        timestamp: new Date(),
      };
    });

    setNotifications(prev => [...newNotifs, ...prev].slice(0, 3));
    setSeenAlerts(prev => {
      const next = new Set(prev);
      criticals.forEach(a => next.add(a.id));
      return next;
    });

    // Auto-dismiss after 8s
    const timeout = setTimeout(() => {
      setNotifications(prev => prev.filter(n => !newNotifs.some(nn => nn.id === n.id)));
    }, 8000);

    return () => clearTimeout(timeout);
  }, [alerts, seenAlerts]);

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="pointer-events-auto glass-panel border-destructive/50 overflow-hidden"
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-destructive/20 border-b border-destructive/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive animate-blink" />
                <span className="text-xs font-bold text-destructive tracking-wide">
                  🚨 ALERT DISPATCHED
                </span>
              </div>
              <button
                onClick={() => dismiss(notif.id)}
                className="p-0.5 rounded hover:bg-destructive/20 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Incident info */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">{notif.alert.eventType}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    📍 {notif.alert.sensorName} | {notif.alert.timestamp}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-[10px] font-bold">
                  CRITICAL
                </span>
              </div>

              {/* Responders notified */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                  Responders Notified:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {notif.responders.map(r => (
                    <motion.span
                      key={r.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 text-[11px] font-semibold text-primary"
                    >
                      <span>{r.icon}</span>
                      {r.name}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Progress bar auto-dismiss indicator */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 8, ease: "linear" }}
                className="h-0.5 bg-destructive/40 rounded-full origin-left"
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AlertDispatchPopup;
