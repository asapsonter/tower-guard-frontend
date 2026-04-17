import { useState } from "react";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@tower-guard/api-client";
import { toast } from "sonner";
import { friendlyAlarmError } from "@/lib/alarmErrors";

interface AlarmControlsProps {
  isArmed?: boolean;
}

const AlarmControls = ({ isArmed }: AlarmControlsProps) => {
  const [confirmAction, setConfirmAction] = useState<"arm" | "disarm" | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [optimisticArmed, setOptimisticArmed] = useState<boolean | null>(null);

  const displayArmed = optimisticArmed ?? isArmed ?? false;

  const handleConfirm = async () => {
    setLoading(true);
    setStatusText(confirmAction === "arm" ? "Sending arm command..." : "Sending disarm command...");
    try {
      if (confirmAction === "arm") {
        await api.armSystem();
        setOptimisticArmed(true);
        toast.success("System armed successfully");
      } else if (confirmAction === "disarm") {
        await api.disarmSystem();
        setOptimisticArmed(false);
        toast.success("System disarmed successfully");
      }
    } catch (err: any) {
      const action = confirmAction === "disarm" ? "disarm" : "arm";
      toast.error(friendlyAlarmError(action, err, err?.status));
    } finally {
      setLoading(false);
      setStatusText("");
      setConfirmAction(null);
    }
  };

  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Security Panel</p>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${displayArmed ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'}`}>
          {displayArmed ? 'ARMED' : 'DISARMED'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setConfirmAction("arm")}
          disabled={displayArmed || loading}
          className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-xs font-semibold transition-colors
            ${displayArmed ? 'opacity-50 cursor-not-allowed bg-muted border-muted text-muted-foreground' : 'bg-destructive/15 border-destructive/40 text-destructive hover:bg-destructive/25'}`}
        >
          <ShieldAlert className="h-4 w-4" />
          Arm System
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setConfirmAction("disarm")}
          disabled={!displayArmed || loading}
          className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-xs font-semibold transition-colors
            ${!displayArmed ? 'opacity-50 cursor-not-allowed bg-muted border-muted text-muted-foreground' : 'bg-success/15 border-success/40 text-success hover:bg-success/25'}`}
        >
          <ShieldCheck className="h-4 w-4" />
          Disarm System
        </motion.button>
      </div>

      {/* Confirmation dialog */}
      {confirmAction && (
        <motion.div
           initial={{ opacity: 0, y: -5 }}
           animate={{ opacity: 1, y: 0 }}
           className="mt-2 p-3 rounded-lg bg-secondary border border-border"
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <p className="text-[11px] text-muted-foreground font-mono">{statusText}</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-foreground mb-3 text-center">
                Confirm: <strong className="text-destructive tracking-widest uppercase">
                  {confirmAction === "arm" ? "Arm System" : "Disarm System"}
                </strong>?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-1.5 rounded bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-1.5 rounded bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AlarmControls;
