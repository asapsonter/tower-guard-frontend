import { useState, useMemo } from "react";
import { Clock, Search, Filter, ChevronDown } from "lucide-react";
import { Badge } from "@tower-guard/ui";
import { motion, AnimatePresence } from "framer-motion";

interface HistoryEvent {
  id: string;
  timestamp: string;
  eventId: string;
  siteLocation: string;
  asset: string;
  eventType: string;
  status: "Responded" | "Unresponded" | "False Alarm";
  responder: string;
}

const MOCK_HISTORY: HistoryEvent[] = [
  { id: "h1", timestamp: "2026-03-17 22:14:40", eventId: "EVT-20260317-001", siteLocation: "Kano Municipal, Kano", asset: "Tower", eventType: "Kidnapping", status: "Responded", responder: "Nigerian Army" },
  { id: "h2", timestamp: "2026-03-17 22:14:38", eventId: "EVT-20260317-002", siteLocation: "Ikeja, Lagos", asset: "Gate", eventType: "Armed", status: "Responded", responder: "NPF" },
  { id: "h3", timestamp: "2026-03-17 22:12:05", eventId: "EVT-20260317-003", siteLocation: "Port Harcourt, Rivers", asset: "Fence (North)", eventType: "Tampering", status: "Unresponded", responder: "—" },
  { id: "h4", timestamp: "2026-03-17 22:08:19", eventId: "EVT-20260317-004", siteLocation: "Maiduguri, Borno", asset: "Generator", eventType: "Intruder", status: "Responded", responder: "NSCDC" },
  { id: "h5", timestamp: "2026-03-17 21:45:00", eventId: "EVT-20260317-005", siteLocation: "Kaduna North, Kaduna", asset: "Battery", eventType: "Vandalism", status: "False Alarm", responder: "—" },
  { id: "h6", timestamp: "2026-03-17 21:30:12", eventId: "EVT-20260317-006", siteLocation: "Surulere, Lagos", asset: "Fence (East)", eventType: "Tampering", status: "Responded", responder: "Community Officer" },
  { id: "h7", timestamp: "2026-03-17 20:15:44", eventId: "EVT-20260317-007", siteLocation: "Benin, Edo", asset: "Fence (South)", eventType: "Intruder", status: "Responded", responder: "NPF" },
  { id: "h8", timestamp: "2026-03-17 19:58:30", eventId: "EVT-20260317-008", siteLocation: "Warri South, Delta", asset: "Generator", eventType: "Vandalism", status: "Unresponded", responder: "—" },
  { id: "h9", timestamp: "2026-03-17 18:22:15", eventId: "EVT-20260317-009", siteLocation: "Ibadan North, Oyo", asset: "Tower", eventType: "Intruder", status: "False Alarm", responder: "—" },
  { id: "h10", timestamp: "2026-03-17 17:05:33", eventId: "EVT-20260317-010", siteLocation: "Enugu North, Enugu", asset: "Gate", eventType: "Tampering", status: "Responded", responder: "NSCDC" },
  { id: "h11", timestamp: "2026-03-16 23:48:20", eventId: "EVT-20260316-001", siteLocation: "Zaria, Kaduna", asset: "Generator", eventType: "Vandalism", status: "Responded", responder: "Nigerian Army" },
  { id: "h12", timestamp: "2026-03-16 21:11:05", eventId: "EVT-20260316-002", siteLocation: "Obio-Akpor, Rivers", asset: "Battery", eventType: "Tampering", status: "Responded", responder: "NPF" },
  { id: "h13", timestamp: "2026-03-16 19:30:42", eventId: "EVT-20260316-003", siteLocation: "Nassarawa, Kano", asset: "Fence (West)", eventType: "Armed", status: "Responded", responder: "Nigerian Army" },
  { id: "h14", timestamp: "2026-03-16 16:22:18", eventId: "EVT-20260316-004", siteLocation: "Nsukka, Enugu", asset: "Tower", eventType: "Intruder", status: "False Alarm", responder: "—" },
  { id: "h15", timestamp: "2026-03-16 14:05:55", eventId: "EVT-20260316-005", siteLocation: "Ogbomoso North, Oyo", asset: "Gate", eventType: "Kidnapping", status: "Responded", responder: "NPF" },
];

const EVENT_TYPES = ["All", "Intruder", "Tampering", "Vandalism", "Armed", "Kidnapping"];
const STATUSES = ["All", "Responded", "Unresponded", "False Alarm"];

const eventBadgeClass = (type: string) => {
  const t = type.toLowerCase();
  if (t === "armed") return "bg-red-900/20 text-red-400";
  if (t === "kidnapping") return "bg-rose-700/20 text-rose-400";
  if (t === "vandalism") return "bg-purple-600/20 text-purple-400";
  if (t === "intruder") return "bg-destructive/20 text-destructive";
  if (t === "tampering") return "bg-warning/20 text-warning";
  return "bg-primary/20 text-primary";
};

const statusBadgeClass = (status: string) => {
  if (status === "Responded") return "bg-success/20 text-success";
  if (status === "Unresponded") return "bg-destructive/20 text-destructive";
  return "bg-muted text-muted-foreground";
};

const History = () => {
  const [search, setSearch] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return MOCK_HISTORY.filter(e => {
      if (eventTypeFilter !== "All" && e.eventType !== eventTypeFilter) return false;
      if (statusFilter !== "All" && e.status !== statusFilter) return false;
      if (search && !e.siteLocation.toLowerCase().includes(search.toLowerCase()) &&
          !e.eventId.toLowerCase().includes(search.toLowerCase()) &&
          !e.asset.toLowerCase().includes(search.toLowerCase())) return false;
      if (dateFrom && e.timestamp < dateFrom) return false;
      if (dateTo && e.timestamp > dateTo + " 23:59:59") return false;
      return true;
    });
  }, [search, eventTypeFilter, statusFilter, dateFrom, dateTo]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          History
        </h1>
        <span className="text-[10px] font-mono text-muted-foreground">{filtered.length} records</span>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search location, ID..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {/* Date From */}
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-secondary border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="From date"
          />
          {/* Date To */}
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-secondary border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="To date"
          />
          {/* Event Type */}
          <select
            value={eventTypeFilter}
            onChange={e => setEventTypeFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-secondary border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t === "All" ? "All Event Types" : t}</option>)}
          </select>
          {/* Status */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-secondary border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Timestamp</th>
                <th className="px-4 py-2.5 text-left font-medium">Event ID</th>
                <th className="px-4 py-2.5 text-left font-medium">Site Location</th>
                <th className="px-4 py-2.5 text-left font-medium">Asset</th>
                <th className="px-4 py-2.5 text-left font-medium">Event Type</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium">Responder Dispatched</th>
              </tr>
            </thead>
            <AnimatePresence initial={false}>
              <tbody>
                {filtered.map((event) => (
                  <motion.tr
                    key={event.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-border/30 hover:bg-secondary/50 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono text-muted-foreground whitespace-nowrap">{event.timestamp}</td>
                    <td className="px-4 py-2.5 font-mono text-primary">{event.eventId}</td>
                    <td className="px-4 py-2.5 text-secondary-foreground">{event.siteLocation}</td>
                    <td className="px-4 py-2.5 text-secondary-foreground">{event.asset}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${eventBadgeClass(event.eventType)}`}>
                        {event.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadgeClass(event.status)}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-secondary-foreground">{event.responder}</td>
                  </motion.tr>
                ))}
              </tbody>
            </AnimatePresence>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-muted-foreground text-xs">
            No records match your filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
