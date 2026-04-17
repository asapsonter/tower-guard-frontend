import { useState } from "react";
import { Hand, Zap, AlertTriangle, Volume2, Lightbulb, Radio, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FIRST_RESPONDERS } from "@tower-guard/data";
import { useToast } from "@tower-guard/ui";

interface ManualModePanelProps {
  onManualAlert?: (eventType: string) => void;
}

const MANUAL_EVENTS = [
  { type: "INTRUDER", label: "Intruder Alert", icon: AlertTriangle, colorClass: "text-destructive", bgClass: "bg-destructive/10 border-destructive/30 hover:bg-destructive/20" },
  { type: "TAMPERING", label: "Tampering Alert", icon: Radio, colorClass: "text-warning", bgClass: "bg-warning/10 border-warning/30 hover:bg-warning/20" },
  { type: "ARMED", label: "Armed Threat", icon: AlertTriangle, colorClass: "text-destructive", bgClass: "bg-destructive/10 border-destructive/30 hover:bg-destructive/20" },
  { type: "VANDALISM", label: "Vandalism", icon: Zap, colorClass: "text-warning", bgClass: "bg-warning/10 border-warning/30 hover:bg-warning/20" },
];

const ManualModePanel = ({ onManualAlert }: ManualModePanelProps) => {
  const [isManual, setIsManual] = useState(false);
  const [confirmEvent, setConfirmEvent] = useState<string | null>(null);
  const [selectedResponders, setSelectedResponders] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggleResponder = (id: string) => {
    setSelectedResponders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTrigger = () => {
    if (!confirmEvent) return;
    onManualAlert?.(confirmEvent);
    const names = FIRST_RESPONDERS.filter(r => selectedResponders.has(r.id)).map(r => r.name).join(", ");
    toast({
      title: `🚨 Manual ${confirmEvent} Alert Triggered`,
      description: names ? `Dispatched to: ${names}` : "No responders selected for dispatch.",
    });
    setConfirmEvent(null);
    setSelectedResponders(new Set());
  };

  return (
    <div className="glass-panel">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Hand className="h-4 w-4 text-warning" />
          <span className="text-sm font-semibold text-foreground">Manual Mode</span>
        </div>
        <button
          onClick={() => { setIsManual(!isManual); setConfirmEvent(null); }}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            isManual ? "bg-warning" : "bg-muted"
          }`}
        >
          <motion.div
            animate={{ x: isManual ? 20 : 2 }}
            className="absolute top-0.5 w-4 h-4 rounded-full bg-foreground"
          />
        </button>
      </div>

      <AnimatePresence>
        {isManual && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <p className="text-[10px] text-warning font-semibold uppercase tracking-wider">
                ⚠ Manual Override Active — Auto-detection paused
              </p>

              {/* Manual trigger buttons */}
              <div className="grid grid-cols-2 gap-2">
                {MANUAL_EVENTS.map(evt => (
                  <button
                    key={evt.type}
                    onClick={() => setConfirmEvent(evt.type)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${evt.bgClass} ${
                      confirmEvent === evt.type ? "ring-1 ring-primary" : ""
                    }`}
                  >
                    <evt.icon className={`h-3.5 w-3.5 ${evt.colorClass}`} />
                    {evt.label}
                  </button>
                ))}
              </div>

              {/* Quick alarm controls */}
              <div className="flex gap-2">
                <button
                  onClick={() => toast({ title: "🔊 Siren Activated", description: "Manual siren triggered." })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-destructive/15 border border-destructive/40 text-destructive text-[11px] font-semibold hover:bg-destructive/25 transition-colors"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  Siren
                </button>
                <button
                  onClick={() => toast({ title: "💡 Lights Activated", description: "Manual strobe lights triggered." })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-warning/15 border border-warning/40 text-warning text-[11px] font-semibold hover:bg-warning/25 transition-colors"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  Lights
                </button>
              </div>

              {/* Confirmation with responder selection */}
              <AnimatePresence>
                {confirmEvent && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="p-3 rounded-lg bg-secondary border border-border space-y-2"
                  >
                    <p className="text-xs text-foreground">
                      Dispatch responders for <strong className="text-destructive">{confirmEvent}</strong>?
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {FIRST_RESPONDERS.map(r => (
                        <button
                          key={r.id}
                          onClick={() => toggleResponder(r.id)}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-[11px] transition-all ${
                            selectedResponders.has(r.id)
                              ? "border-primary bg-primary/10 text-primary font-semibold"
                              : "border-border text-muted-foreground hover:bg-sidebar-accent"
                          }`}
                        >
                          <span>{r.icon}</span>
                          {r.name}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleTrigger}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 transition-colors"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Confirm & Dispatch
                      </button>
                      <button
                        onClick={() => { setConfirmEvent(null); setSelectedResponders(new Set()); }}
                        className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManualModePanel;
