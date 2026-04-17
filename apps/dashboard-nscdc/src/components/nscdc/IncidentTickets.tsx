import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Users, MessageSquare, Camera, Phone, X,
  ChevronRight, Clock, Image as ImageIcon, Shield
} from "lucide-react";
import { supabase } from "@tower-guard/supabase-client";
import type { ResponderMessage } from "@tower-guard/hooks";

interface TeamMember {
  id: string;
  assignment_id: string;
  responder_name: string;
  role: string;
  status: string;
  joined_at: string;
}

interface Assignment {
  id: string;
  incident_id: string;
  status: string;
  dispatched_at: string;
  responder_name: string | null;
  accepted_at: string | null;
  on_site_at: string | null;
  en_route_at: string | null;
  resolved_at: string | null;
  sla_seconds: number | null;
}

interface Incident {
  id: string;
  event_type: string;
  details: string;
  severity: string;
  location: string | null;
  status: string;
  created_at: string;
}

interface Props {
  assignments: Assignment[];
  teamMembers: Record<string, TeamMember[]>;
  messages: ResponderMessage[];
  scopeLabel?: string;
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  accepted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "en-route": "bg-primary/20 text-primary border-primary/30",
  "on-site": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  resolved: "bg-success/20 text-success border-success/30",
};

export default function IncidentTickets({ assignments, teamMembers, messages, scopeLabel = "AMAC" }: Props) {
  const [openTicket, setOpenTicket] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<Record<string, Incident>>({});
  const [ticketMessages, setTicketMessages] = useState<ResponderMessage[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Fetch incidents for all assignments
  const fetchIncidents = useCallback(async () => {
    if (!supabase) return;
    const incidentIds = [...new Set(assignments.map(a => a.incident_id))];
    if (incidentIds.length === 0) return;
    const { data } = await supabase
      .from("incidents")
      .select("*")
      .in("id", incidentIds);
    if (data) {
      const map: Record<string, Incident> = {};
      data.forEach(i => { map[i.id] = i; });
      setIncidents(map);
    }
  }, [assignments]);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  // When a ticket is opened, fetch all messages for that assignment
  const fetchTicketMessages = useCallback(async (assignmentId: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from("responder_messages")
      .select("*")
      .eq("assignment_id", assignmentId)
      .order("created_at", { ascending: true });
    if (data) setTicketMessages(data);
  }, []);

  useEffect(() => {
    if (!openTicket) return;
    fetchTicketMessages(openTicket);
    if (!supabase) return;
    const ch = supabase
      .channel(`ticket-msgs-${openTicket}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "responder_messages", filter: `assignment_id=eq.${openTicket}` }, () => {
        fetchTicketMessages(openTicket);
      })
      .subscribe();
    return () => { supabase!.removeChannel(ch); };
  }, [openTicket, fetchTicketMessages]);

  // Group assignments: active first, then resolved
  const active = assignments.filter(a => a.status !== "resolved");
  const resolved = assignments.filter(a => a.status === "resolved");
  const sorted = [...active, ...resolved];

  const openAssignment = openTicket ? assignments.find(a => a.id === openTicket) : null;
  const openIncident = openAssignment ? incidents[openAssignment.incident_id] : null;
  const openTeam = openTicket ? teamMembers[openTicket] || [] : [];
  const photos = ticketMessages.filter(m => m.message_type === "photo");
  const textAndVoice = ticketMessages.filter(m => m.message_type !== "photo");

  return (
    <div className="space-y-3">
      <div className="glass-panel">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span className="text-sm font-semibold text-foreground">Incident Tickets — {scopeLabel}</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{active.length} active • {resolved.length} resolved</span>
        </div>

        <div className="divide-y divide-border/30 max-h-[450px] overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No incidents yet</p>
            </div>
          ) : (
            sorted.map(a => {
              const inc = incidents[a.incident_id];
              const team = teamMembers[a.id] || [];
              const msgCount = messages.filter(m => m.assignment_id === a.id).length;
              return (
                <button
                  key={a.id}
                  onClick={() => setOpenTicket(openTicket === a.id ? null : a.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-all text-left ${
                    openTicket === a.id ? "bg-secondary/70" : ""
                  }`}
                >
                  <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                    a.status === "resolved" ? "bg-success" : a.status === "on-site" ? "bg-orange-400" : a.status === "en-route" ? "bg-primary" : "bg-warning animate-pulse"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-foreground">{a.incident_id.slice(0, 8)}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${STATUS_BADGE[a.status] || ""}`}>
                        {a.status.toUpperCase()}
                      </span>
                      {inc && <span className="text-[9px] text-muted-foreground truncate">{inc.location}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {team.length} officers</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {msgCount} msgs</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(a.dispatched_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  {/* Team avatars */}
                  <div className="flex -space-x-1.5 shrink-0">
                    {team.slice(0, 3).map(m => (
                      <span
                        key={m.id}
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-bold border-2 ${
                          m.role === "team_lead" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border"
                        }`}
                        title={m.responder_name}
                      >
                        {m.responder_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </span>
                    ))}
                    {team.length > 3 && (
                      <span className="h-6 w-6 rounded-full bg-muted text-[8px] font-bold text-muted-foreground flex items-center justify-center border-2 border-border">
                        +{team.length - 3}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Open Ticket Detail */}
      <AnimatePresence>
        {openTicket && openAssignment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-panel overflow-hidden"
          >
            {/* Ticket header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">Ticket: {openAssignment.incident_id.slice(0, 8)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${STATUS_BADGE[openAssignment.status] || ""}`}>
                    {openAssignment.status.toUpperCase()}
                  </span>
                </div>
                {openIncident && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {openIncident.event_type} • {openIncident.location} • {openIncident.severity}
                  </p>
                )}
              </div>
              <button onClick={() => setOpenTicket(null)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border/30">
              {/* Team panel */}
              <div className="p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Response Team ({openTeam.length})
                </p>
                <div className="space-y-1.5">
                  {openTeam.map(m => (
                    <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary/30">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-bold ${
                        m.role === "team_lead" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {m.responder_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-foreground truncate">{m.responder_name}</p>
                        <p className="text-[9px] text-muted-foreground">{m.role === "team_lead" ? "Team Lead" : "Member"}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                        m.status === "active" ? "bg-success/20 text-success" :
                        m.status === "ducked" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
                      }`}>
                        {m.status === "ducked" && <AlertTriangle className="h-2.5 w-2.5 inline mr-0.5" />}
                        {m.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat log */}
              <div className="p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Communications Log ({textAndVoice.length})
                </p>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {textAndVoice.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground py-4 text-center">No messages yet</p>
                  ) : (
                    textAndVoice.map(m => (
                      <div key={m.id} className={`p-2 rounded-lg text-[10px] ${
                        m.sender_role === "command" ? "bg-primary/10 border border-primary/20 ml-3" : "bg-secondary/50 border border-border/30 mr-3"
                      }`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-foreground">{m.sender_name}</span>
                          <span className="text-[8px] text-muted-foreground">{new Date(m.created_at).toLocaleTimeString()}</span>
                        </div>
                        {m.message_type === "voice" ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="h-3 w-3 text-primary" />
                            <div className="flex-1 h-3 rounded-full bg-primary/20 flex items-center px-1.5">
                              <div className="flex gap-px">
                                {Array.from({ length: 16 }).map((_, i) => (
                                  <div key={i} className="w-0.5 bg-primary/60 rounded-full" style={{ height: `${Math.random() * 8 + 3}px` }} />
                                ))}
                              </div>
                            </div>
                            <span className="text-[8px]">{m.voice_duration_seconds}s</span>
                          </div>
                        ) : (
                          <p className="text-foreground">{m.content}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Evidence photos */}
              <div className="p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Evidence Photos ({photos.length})
                </p>
                {photos.length === 0 ? (
                  <div className="text-center py-4">
                    <Camera className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">No photos uploaded</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                    {photos.map(p => (
                      <div
                        key={p.id}
                        className="relative rounded-lg overflow-hidden border border-border/30 cursor-pointer hover:border-primary/50 transition-all"
                        onClick={() => setSelectedPhoto(p.content)}
                      >
                        <div className="aspect-square">
                          <img
                            src={p.content || "/placeholder.svg"}
                            alt={`Evidence by ${p.sender_name}`}
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                          />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-1 bg-background/80 text-[8px]">
                          <p className="font-semibold text-foreground truncate">{p.sender_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-secondary border border-border hover:bg-destructive/20 transition-colors"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
            <img src={selectedPhoto} alt="Evidence" className="max-w-full max-h-[85vh] rounded-lg object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
