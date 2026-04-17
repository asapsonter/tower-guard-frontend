import { useState } from "react";
import { List, Search, Image as ImageIcon, X } from "lucide-react";
import type { EventLog } from "@tower-guard/data";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

const eventBadgeClass = (): string => "bg-destructive/20 text-destructive";

const EventLogTable = ({ events }: { events: EventLog[] }) => {
  const [filter, setFilter] = useState("");
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const filteredEvents = events.filter(
    (e) =>
      e.eventType.toLowerCase().includes(filter.toLowerCase()) ||
      e.source.toLowerCase().includes(filter.toLowerCase())
  );

  const getSnapshotSrc = (event: EventLog) => {
    if (!event.snapshotUrl) return null;
    // If it starts with / it's a relative backend path
    if (event.snapshotUrl.startsWith("/")) return `${API_BASE_URL}${event.snapshotUrl}`;
    return event.snapshotUrl;
  };

  return (
    <div className="glass-panel flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <List className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Event & Intruder Log</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter events..."
            className="pl-8 pr-3 py-1.5 text-xs bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50 text-muted-foreground">
              <th className="px-4 py-2.5 text-left font-medium">Timestamp</th>
              <th className="px-4 py-2.5 text-left font-medium">Event Type</th>
              <th className="px-4 py-2.5 text-left font-medium">Source</th>
              <th className="px-4 py-2.5 text-left font-medium">Details</th>
              <th className="px-4 py-2.5 text-left font-medium">Snapshot</th>
            </tr>
          </thead>
          <AnimatePresence initial={false}>
            <tbody>
              {filteredEvents.map((event) => {
                const src = getSnapshotSrc(event);
                return (
                  <motion.tr
                    key={event.id}
                    layout
                    initial={{ opacity: 0, backgroundColor: "hsl(207 90% 54% / 0.1)" }}
                    animate={{ opacity: 1, backgroundColor: "transparent" }}
                    transition={{ duration: 0.6 }}
                    className={`border-b border-border/30 hover:bg-secondary/50 transition-colors ${
                      event.eventType.toLowerCase().includes("armed") || event.eventType.toLowerCase().includes("kidnapping") ? "bg-destructive/5" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 font-mono text-muted-foreground whitespace-nowrap">{event.timestamp}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${eventBadgeClass()}`}>
                        {event.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-secondary-foreground">{event.source}</td>
                    <td className="px-4 py-2.5 text-muted-foreground max-w-[250px] truncate">{event.details}</td>
                    <td className="px-4 py-2.5">
                      {event.hasSnapshot && src ? (
                        <button onClick={() => setExpandedImage(src)} className="relative group">
                          <img src={src} alt="Snapshot" className="h-8 w-8 rounded object-cover border border-destructive/50" />
                          <div className="absolute inset-0 bg-background/50 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ImageIcon className="h-3 w-3 text-foreground" />
                          </div>
                        </button>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </AnimatePresence>
        </table>
      </div>

      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setExpandedImage(null)}
          >
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="relative max-w-lg" onClick={(e) => e.stopPropagation()}>
              <img src={expandedImage} alt="Incident snapshot" className="rounded-lg border border-destructive/50" />
              <button onClick={() => setExpandedImage(null)} className="absolute -top-3 -right-3 bg-destructive rounded-full p-1">
                <X className="h-4 w-4 text-destructive-foreground" />
              </button>
              <div className="absolute bottom-3 left-3 bg-destructive/90 px-3 py-1 rounded text-xs font-bold text-destructive-foreground">
                ALERT SNAPSHOT
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventLogTable;
