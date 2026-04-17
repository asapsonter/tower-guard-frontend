import { useState, useEffect, useRef } from "react";
import { Timer, AlertTriangle } from "lucide-react";

interface SlaTimerProps {
  isActive: boolean;
  incidentId?: string;
  dispatchTime?: Date;
}

const SlaTimer = ({ isActive, incidentId, dispatchTime }: SlaTimerProps) => {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<Date>(dispatchTime || new Date());

  useEffect(() => {
    if (!isActive) {
      setElapsed(0);
      return;
    }
    startRef.current = dispatchTime || new Date();

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, dispatchTime]);

  if (!isActive) return null;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const hrs = Math.floor(mins / 60);
  const displayMins = mins % 60;

  // SLA thresholds
  const isWarning = elapsed > 600; // 10 min
  const isCritical = elapsed > 1200; // 20 min

  return (
    <div className={`glass-panel border ${
      isCritical ? "border-destructive/50 glow-destructive" :
      isWarning ? "border-warning/50 glow-warning" : "border-primary/30"
    }`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <Timer className={`h-4 w-4 ${isCritical ? "text-destructive" : isWarning ? "text-warning" : "text-primary"}`} />
        <span className="text-sm font-semibold text-foreground">SLA Response Timer</span>
        {isCritical && <AlertTriangle className="h-3.5 w-3.5 text-destructive animate-pulse ml-auto" />}
      </div>
      <div className="p-4 flex flex-col items-center gap-2">
        <p className="text-[10px] text-muted-foreground font-mono">
          TIME TO RESPONSE — {incidentId || "Active Incident"}
        </p>
        <div className={`font-mono text-3xl font-bold tabular-nums tracking-wider ${
          isCritical ? "text-destructive animate-pulse" :
          isWarning ? "text-warning" : "text-primary"
        }`}>
          {hrs > 0 && <span>{String(hrs).padStart(2, "0")}:</span>}
          {String(displayMins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </div>
        <div className="flex gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> &lt;10m Optimal
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" /> 10-20m Warning
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive" /> &gt;20m Critical
          </span>
        </div>
      </div>
    </div>
  );
};

export default SlaTimer;
