import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, CheckCircle2, XCircle, MapPin, MessageSquare, Mic,
  Send, Navigation, Phone, AlertTriangle, Clock, Loader2,
  Camera, Image as ImageIcon, X
} from "lucide-react";
import { Button, sonnerToast as toast, flowMonitor } from "@tower-guard/ui";
import { Input } from "@tower-guard/ui";
import { useAuth } from "@tower-guard/hooks";
import { supabase } from "@tower-guard/supabase-client";
import {
  useResponderAssignments,
  useAssignmentMessages,
  acceptAssignment,
  rejectAssignment,
  updateAssignmentStatus,
  sendDispatchMessage,
  reportLocation,
  type DispatchAssignment,
  type Incident,
} from "@tower-guard/hooks";

type AssignmentWithIncident = DispatchAssignment & { incident?: Incident };

const ResponderApp = () => {
  const { user } = useAuth();
  const { assignments, loading } = useResponderAssignments();
  const [activeAssignment, setActiveAssignment] = useState<AssignmentWithIncident | null>(null);
  const { messages, refresh: refreshMessages } = useAssignmentMessages(activeAssignment?.id || null);

  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [gpsActive, setGpsActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Recording timer
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => setRecordingTime(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  // GPS tracking when active
  useEffect(() => {
    if (!gpsActive || !activeAssignment || !user) return;
    const watchId = navigator.geolocation?.watchPosition(
      (pos) => {
        reportLocation(user.id, activeAssignment.id, pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      undefined,
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => { if (watchId !== undefined) navigator.geolocation?.clearWatch(watchId); };
  }, [gpsActive, activeAssignment, user]);

  // Keep active assignment in sync with realtime data
  useEffect(() => {
    if (!activeAssignment) return;
    const updated = assignments.find(a => a.id === activeAssignment.id);
    if (updated) setActiveAssignment(updated);
  }, [assignments, activeAssignment]);

  const handleAccept = async (a: AssignmentWithIncident) => {
    if (!user) return;
    const mastSite = a.incident?.location ?? `Assignment ${a.id.slice(0, 8)}`;

    flowMonitor.emit({
      source: "user-action",
      category: "dispatch",
      level: "info",
      message: `Accept tapped on ${mastSite}`,
      details: { assignmentId: a.id, responderId: user.id },
    });

    const result = await acceptAssignment(a.id, user.id, user.full_name);
    if (result.ok) {
      setActiveAssignment({ ...a, status: "accepted", responder_name: user.full_name, responder_id: user.id });
      setGpsActive(true);
      toast.success(`Accepted: ${mastSite}`, {
        description: "GPS tracking started. Mark En-Route when you depart.",
      });
      flowMonitor.emit({
        source: "user-action",
        category: "dispatch",
        level: "success",
        message: `Accepted ${mastSite}`,
        details: { assignmentId: a.id, responder: user.full_name },
      });
      await sendDispatchMessage({
        assignmentId: a.id,
        senderName: "System",
        senderRole: "command",
        messageType: "status",
        content: `Assignment accepted by ${user.full_name}. Proceed to location.`,
      });
    } else {
      const errMsg = result.error?.message ?? "Unknown error";
      const errCode = result.error?.code ? ` [${result.error.code}]` : "";
      toast.error(`Accept failed${errCode}`, {
        description: errMsg,
      });
      flowMonitor.emit({
        source: "error",
        category: "dispatch",
        level: "error",
        message: `Accept FAILED for ${mastSite}: ${errMsg}`,
        details: { assignmentId: a.id, error: result.error },
      });
    }
  };

  const handleReject = async (a: AssignmentWithIncident) => {
    if (!user) return;
    const mastSite = a.incident?.location ?? `Assignment ${a.id.slice(0, 8)}`;

    flowMonitor.emit({
      source: "user-action",
      category: "dispatch",
      level: "warning",
      message: `Reject tapped on ${mastSite}`,
      details: { assignmentId: a.id },
    });

    const result = await rejectAssignment(a.id);
    if (result.ok) {
      toast(`Rejected: ${mastSite}`, {
        description: "Returned to dispatch pool for reassignment.",
      });
      flowMonitor.emit({
        source: "user-action",
        category: "dispatch",
        level: "warning",
        message: `Rejected ${mastSite}`,
        details: { assignmentId: a.id },
      });
    } else {
      const errMsg = result.error?.message ?? "Unknown error";
      toast.error("Reject failed", { description: errMsg });
      flowMonitor.emit({
        source: "error",
        category: "dispatch",
        level: "error",
        message: `Reject FAILED for ${mastSite}: ${errMsg}`,
        details: { assignmentId: a.id, error: result.error },
      });
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!activeAssignment || !user) return;
    const mastSite = activeAssignment.incident?.location ?? `Assignment ${activeAssignment.id.slice(0, 8)}`;

    flowMonitor.emit({
      source: "user-action",
      category: "dispatch",
      level: "info",
      message: `Status change → ${newStatus.toUpperCase()} for ${mastSite}`,
      details: { assignmentId: activeAssignment.id, newStatus },
    });

    const result = await updateAssignmentStatus(activeAssignment.id, newStatus);

    if (!result.ok) {
      const errMsg = result.error?.message ?? "Unknown error";
      toast.error(`Status update failed → ${newStatus}`, { description: errMsg });
      flowMonitor.emit({
        source: "error",
        category: "dispatch",
        level: "error",
        message: `Status update FAILED → ${newStatus}: ${errMsg}`,
        details: { assignmentId: activeAssignment.id, error: result.error },
      });
      return;
    }

    // Friendly per-status copy
    const statusCopy: Record<string, { title: string; description: string }> = {
      "en-route":  { title: "En route", description: "Command has been notified you are en route." },
      "on-site":   { title: "On site", description: "Command has been notified you have arrived." },
      "resolved":  { title: "Resolved", description: "Incident closed. Returning to standby." },
    };
    const copy = statusCopy[newStatus] ?? { title: newStatus.toUpperCase(), description: "Status updated." };
    toast.success(copy.title, { description: copy.description });

    flowMonitor.emit({
      source: "user-action",
      category: "dispatch",
      level: "success",
      message: `Status: ${newStatus.toUpperCase()} for ${mastSite}`,
      details: { assignmentId: activeAssignment.id, responder: user.full_name },
    });

    await sendDispatchMessage({
      assignmentId: activeAssignment.id,
      senderId: user.id,
      senderName: user.full_name,
      senderRole: "responder",
      messageType: "status",
      content: `Status updated: ${newStatus.toUpperCase()}`,
    });

    if (newStatus === "resolved") {
      setTimeout(() => {
        setActiveAssignment(null);
        setGpsActive(false);
      }, 3000);
    }
  };

  /**
   * The next valid status given the current one. The flow is strictly:
   *   pending → accepted → en-route → on-site → resolved
   * Returns null when there is no next step (already resolved).
   */
  const getNextStatus = (current: string): { value: string; label: string } | null => {
    switch (current) {
      case "accepted":  return { value: "en-route", label: "Mark En-Route" };
      case "en-route":  return { value: "on-site",  label: "Mark On-Site" };
      case "on-site":   return { value: "resolved", label: "Mark Resolved" };
      default:          return null;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeAssignment || !user) return;
    const msg = newMessage.trim();
    setNewMessage("");
    const result = await sendDispatchMessage({
      assignmentId: activeAssignment.id,
      senderId: user.id,
      senderName: user.full_name,
      senderRole: "responder",
      messageType: "text",
      content: msg,
    });

    if (result.ok) {
      flowMonitor.emit({
        source: "user-action",
        category: "message",
        level: "success",
        message: `Message sent: "${msg.slice(0, 40)}${msg.length > 40 ? "…" : ""}"`,
        details: { assignmentId: activeAssignment.id },
      });
    } else {
      const errMsg = result.error?.message ?? "Unknown error";
      toast.error("Message failed to send", { description: errMsg });
      // Restore the unsent text so the user can retry
      setNewMessage(msg);
      flowMonitor.emit({
        source: "error",
        category: "message",
        level: "error",
        message: `Send message FAILED: ${errMsg}`,
        details: { assignmentId: activeAssignment.id, error: result.error },
      });
    }

    // Refresh immediately + delayed fallback to ensure the message appears
    await refreshMessages();
    setTimeout(() => refreshMessages(), 1000);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeAssignment || !user || !supabase) return;

    setUploading(true);
    const fileName = `${activeAssignment.id}/${Date.now()}-${file.name}`;

    flowMonitor.emit({
      source: "user-action",
      category: "message",
      level: "info",
      message: `Uploading evidence photo: ${file.name}`,
      details: { assignmentId: activeAssignment.id, size: file.size, mime: file.type },
    });

    const { data, error: uploadErr } = await supabase.storage
      .from("evidence-photos")
      .upload(fileName, file);

    if (uploadErr) {
      console.error("Upload failed:", uploadErr);
      toast.error("Photo upload failed", { description: uploadErr.message });
      flowMonitor.emit({
        source: "error",
        category: "message",
        level: "error",
        message: `Photo upload FAILED: ${uploadErr.message}`,
        details: { assignmentId: activeAssignment.id, error: uploadErr },
      });
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const { data: urlData } = supabase.storage
      .from("evidence-photos")
      .getPublicUrl(data.path);

    // Send as a "photo" message type. The NSCDC evidence tab queries
    // responder_messages WHERE message_type = 'photo', so this is the
    // contract that links the field-app upload to the NSCDC gallery.
    // Content holds the public URL (no prefix needed).
    const result = await sendDispatchMessage({
      assignmentId: activeAssignment.id,
      senderId: user.id,
      senderName: user.full_name,
      senderRole: "responder",
      messageType: "photo",
      content: urlData.publicUrl,
    });

    if (result.ok) {
      toast.success("Evidence photo uploaded", {
        description: "Now visible in NSCDC evidence gallery.",
      });
      flowMonitor.emit({
        source: "user-action",
        category: "message",
        level: "success",
        message: `Evidence photo uploaded`,
        details: { assignmentId: activeAssignment.id, url: urlData.publicUrl },
      });
    } else {
      toast.error("Photo uploaded but message failed", { description: result.error?.message });
    }

    setTimeout(() => refreshMessages(), 500);

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleRecording = async () => {
    if (isRecording && activeAssignment && user) {
      // Stop recording — send the (dummy) voice message
      const result = await sendDispatchMessage({
        assignmentId: activeAssignment.id,
        senderId: user.id,
        senderName: user.full_name,
        senderRole: "responder",
        messageType: "voice",
        content: `🎤 Voice note (${recordingTime}s) — playback unavailable in demo build`,
        voiceDuration: recordingTime,
      });
      if (result.ok) {
        toast.success(`Voice note sent (${recordingTime}s)`);
        flowMonitor.emit({
          source: "user-action",
          category: "message",
          level: "success",
          message: `Voice note sent (${recordingTime}s)`,
          details: { assignmentId: activeAssignment.id },
        });
      } else {
        toast.error("Voice note failed", { description: result.error?.message });
      }
      setRecordingTime(0);
      setTimeout(() => refreshMessages(), 500);
    } else if (!isRecording) {
      flowMonitor.emit({
        source: "user-action",
        category: "message",
        level: "info",
        message: "Voice recording started",
      });
    }
    setIsRecording(!isRecording);
  };

  const locationStr = (a: AssignmentWithIncident) =>
    a.incident?.location || a.incident?.state || "Unknown Location";

  const isImageUrl = (text: string) => {
    return text.startsWith("📸 Evidence photo:");
  };

  const getImageUrl = (text: string) => {
    return text.replace("📸 Evidence photo: ", "");
  };

  // ── Assignment list view ──
  if (!activeAssignment) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-green-600/20 border border-green-600/30 flex items-center justify-center">
            <Shield className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Field Mobile App</h1>
            <p className="text-xs text-muted-foreground">AMAC Area — Incoming Assignments</p>
          </div>
        </div>

        {gpsActive && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/30 text-[10px] text-success font-semibold">
            <Navigation className="h-3 w-3" /> GPS Tracking Active
          </div>
        )}

        {loading ? (
          <div className="glass-panel p-8 text-center">
            <Loader2 className="h-6 w-6 text-primary mx-auto animate-spin mb-2" />
            <p className="text-xs text-muted-foreground">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No active assignments in AMAC</p>
            <p className="text-[10px] text-muted-foreground mt-1">Standing by for dispatch</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {assignments.map(a => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="glass-panel overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-destructive/5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
                    <span className="text-xs font-mono font-bold text-foreground">{a.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">AMAC</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive border border-destructive/30 font-semibold">
                      {(a.incident?.severity || "CRITICAL").toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-2 text-xs">
                    <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">{locationStr(a)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{a.incident?.details || "Intruder detected"}</p>
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Dispatched: {new Date(a.dispatched_at).toLocaleTimeString()}
                  </div>
                  {a.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button onClick={() => handleAccept(a)} className="flex-1 gap-1" size="sm">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                      </Button>
                      <Button onClick={() => handleReject(a)} variant="destructive" className="flex-1 gap-1" size="sm">
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => setActiveAssignment(a)} className="w-full gap-1" size="sm" variant="outline">
                      <MessageSquare className="h-3.5 w-3.5" /> Open Assignment
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    );
  }

  // ── Active assignment + chat view ──
  return (
    <div className="max-w-md mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="glass-panel rounded-b-none border-b-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveAssignment(null)} className="text-xs text-primary hover:underline">← Back</button>
            <span className="text-xs font-mono font-bold text-foreground">{activeAssignment.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">AMAC</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
              activeAssignment.status === "resolved" ? "bg-success/20 text-success border-success/30" :
              "bg-warning/20 text-warning border-warning/30"
            }`}>
              {activeAssignment.status.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="px-4 py-2 text-[10px] text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3 text-primary" /> {locationStr(activeAssignment)}
        </div>

        {/* Status timeline + next-step CTA */}
        <div className="px-4 pb-3 space-y-2">
          {/* Timeline pills — show progress through accepted → en-route → on-site → resolved */}
          <div className="flex gap-1">
            {(["accepted", "en-route", "on-site", "resolved"] as const).map((step) => {
              const order = ["accepted", "en-route", "on-site", "resolved"];
              const currentIdx = order.indexOf(activeAssignment.status);
              const stepIdx = order.indexOf(step);
              const isDone = stepIdx <= currentIdx;
              const isCurrent = stepIdx === currentIdx;
              return (
                <div
                  key={step}
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    isDone
                      ? isCurrent
                        ? "bg-primary"
                        : "bg-success"
                      : "bg-secondary"
                  }`}
                  title={step.toUpperCase()}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono">
            <span>ACCEPTED</span>
            <span>EN-ROUTE</span>
            <span>ON-SITE</span>
            <span>RESOLVED</span>
          </div>

          {/* Single next-step button — only the next valid action is shown */}
          {(() => {
            const next = getNextStatus(activeAssignment.status);
            if (!next) {
              return (
                <div className="flex items-center justify-center gap-1.5 py-2 rounded-md bg-success/15 border border-success/30">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-xs font-bold text-success">Incident Resolved</span>
                </div>
              );
            }
            return (
              <Button
                onClick={() => handleStatusUpdate(next.value)}
                className="w-full gap-1.5"
                size="sm"
              >
                <Navigation className="h-3.5 w-3.5" /> {next.label}
              </Button>
            );
          })()}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto bg-secondary/20 border-x border-border/50 p-3 space-y-2">
        {/* Image preview overlay */}
        {previewImage && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
            <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 text-white">
              <X className="h-6 w-6" />
            </button>
            <img src={previewImage} alt="Evidence" className="max-w-full max-h-full rounded-lg object-contain" />
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender_role === "responder" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-2.5 rounded-lg text-xs ${
              m.message_type === "status"
                ? "bg-muted/50 text-muted-foreground text-center w-full text-[10px] italic"
                : m.sender_role === "responder"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-secondary border border-border/50 text-foreground rounded-bl-sm"
            }`}>
              {m.message_type !== "status" && (
                <p className="text-[9px] font-semibold mb-0.5 opacity-70">{m.sender_name}</p>
              )}
              {m.message_type === "voice" ? (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <div className="flex-1 flex gap-0.5">
                    {Array.from({ length: 15 }).map((_, i) => (
                      <div key={i} className="w-0.5 rounded-full opacity-70" style={{
                        height: `${Math.random() * 10 + 4}px`,
                        backgroundColor: m.sender_role === "responder" ? "white" : "hsl(var(--primary))"
                      }} />
                    ))}
                  </div>
                  <span className="text-[9px]">{m.content}</span>
                </div>
              ) : m.message_type === "photo" || (m.content && isImageUrl(m.content)) ? (
                <div className="space-y-1">
                  <p className="text-[9px] flex items-center gap-1"><Camera className="h-3 w-3" /> Evidence Photo</p>
                  <img
                    src={m.message_type === "photo" ? (m.content ?? "") : getImageUrl(m.content!)}
                    alt="Evidence"
                    className="rounded-md max-w-full cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setPreviewImage(m.message_type === "photo" ? (m.content ?? "") : getImageUrl(m.content!))}
                  />
                </div>
              ) : (
                <p>{m.content}</p>
              )}
              {m.message_type !== "status" && (
                <p className="text-[8px] opacity-50 mt-1">{new Date(m.created_at).toLocaleTimeString()}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="glass-panel rounded-t-none border-t-0 p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoUpload}
        />
        {isRecording ? (
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-mono text-destructive flex-1">
              Recording... {String(Math.floor(recordingTime / 60)).padStart(2, "0")}:{String(recordingTime % 60).padStart(2, "0")}
            </span>
            <Button onClick={toggleRecording} size="sm" variant="destructive" className="gap-1">
              <Send className="h-3.5 w-3.5" /> Send
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={toggleRecording}
              className="h-9 w-9 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center hover:bg-destructive/20 transition-colors shrink-0"
            >
              <Mic className="h-4 w-4 text-destructive" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-9 w-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center hover:bg-primary/20 transition-colors shrink-0"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : (
                <Camera className="h-4 w-4 text-primary" />
              )}
            </button>
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendMessage()}
              placeholder="Type a message..."
              className="text-xs"
            />
            <Button onClick={handleSendMessage} size="sm" className="gap-1 shrink-0">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponderApp;
