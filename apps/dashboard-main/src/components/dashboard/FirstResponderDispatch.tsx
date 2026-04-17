import { useState } from "react";
import { Shield, Send, CheckCircle2 } from "lucide-react";
import { FIRST_RESPONDERS } from "@tower-guard/data";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@tower-guard/ui";

interface FirstResponderDispatchProps {
  incidentId?: string;
  incidentType?: string;
  location?: string;
}

const FirstResponderDispatch = ({ incidentId, incidentType, location }: FirstResponderDispatchProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dispatched, setDispatched] = useState(false);
  const { toast } = useToast();

  const toggleResponder = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDispatch = () => {
    if (selected.size === 0) return;
    setDispatched(true);
    const names = FIRST_RESPONDERS.filter(r => selected.has(r.id)).map(r => r.name).join(", ");
    toast({
      title: "🚨 Responders Dispatched",
      description: `${names} dispatched to ${location || "incident location"}.`,
    });
    setTimeout(() => {
      setDispatched(false);
      setSelected(new Set());
    }, 4000);
  };

  return (
    <div className="glass-panel flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-destructive" />
          <span className="text-sm font-semibold text-foreground">Dispatch First Responders</span>
        </div>
        {incidentType && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">
            {incidentType}
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {incidentId && (
          <div className="text-[10px] text-muted-foreground font-mono">
            Incident: <span className="text-foreground">{incidentId}</span>
            {location && <> | Location: <span className="text-foreground">{location}</span></>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {FIRST_RESPONDERS.map((responder) => {
            const isSelected = selected.has(responder.id);
            return (
              <motion.button
                key={responder.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleResponder(responder.id)}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                    : "border-border bg-secondary/50 hover:bg-sidebar-accent"
                }`}
              >
                <span className="text-lg">{responder.icon}</span>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {responder.name}
                  </p>
                  <p className="text-[9px] text-muted-foreground truncate">{responder.fullName}</p>
                </div>
                {isSelected && <CheckCircle2 className="h-4 w-4 text-primary ml-auto shrink-0" />}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {dispatched ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-success/10 border border-success/30"
            >
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-xs font-semibold text-success">Responders dispatched successfully</span>
            </motion.div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleDispatch}
              disabled={selected.size === 0}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm tracking-wide transition-all ${
                selected.size > 0
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 glow-destructive"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <Send className="h-4 w-4" />
              Dispatch Now ({selected.size})
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FirstResponderDispatch;
