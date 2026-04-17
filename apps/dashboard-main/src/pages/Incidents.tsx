import { useState, useEffect } from "react";
import { AlertTriangle, Camera, X, Clock, Video, MapPin, Car, Play, ChevronDown, ChevronUp } from "lucide-react";
import EventLogTable from "@/components/dashboard/EventLogTable";
import FirstResponderDispatch from "@/components/dashboard/FirstResponderDispatch";
import SlaTimer from "@/components/dashboard/SlaTimer";
import { useSimulation } from "@tower-guard/hooks";
import { api } from "@tower-guard/api-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

interface PlateDetection {
  plate_image: string;
  plate_text: string | null;
  camera_id: string;
  bbox: { x: number; y: number; w: number; h: number };
}

interface SiteLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface Incident {
  id: string;
  timestamp: string;
  zone_name: string;
  alarm_type: string;
  status: string;
  snapshots: string[];
  video_clips?: string[];
  plate_detections?: PlateDetection[];
  location?: SiteLocation;
}

const ALARM_LABELS: Record<string, string> = {
  tamper_alarm: "TAMPER",
  zone_alarm: "INTRUSION",
  human_detected: "HUMAN DETECTED",
  vehicle_detected: "VEHICLE DETECTED",
  animal_detected: "ANIMAL DETECTED",
};

const Incidents = () => {
  const { events, alerts } = useSimulation();
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [dispatchedAt, setDispatchedAt] = useState<Date | null>(null);
  const [isDispatched, setIsDispatched] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [expandedMedia, setExpandedMedia] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [expandedIncidentId, setExpandedIncidentId] = useState<string | null>(null);

  const criticalAlerts = alerts.filter(a => a.severity === "critical");
  const activeIncident = criticalAlerts.find(a => a.id === selectedIncident) || criticalAlerts[0];

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const data = await api.getIncidents(50);
        setIncidents(data);
      } catch {
        // Backend may not be available
      }
    };
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (alerts.length > 0) {
      api.getIncidents(50).then(setIncidents).catch(() => {});
    }
  }, [alerts.length]);

  useEffect(() => {
    setIsDispatched(false);
    setDispatchedAt(null);
  }, [selectedIncident]);

  const getUrl = (path: string) => {
    if (path.startsWith("/")) return `${API_BASE_URL}${path}`;
    return path;
  };

  const toggleExpand = (id: string) => {
    setExpandedIncidentId(prev => prev === id ? null : id);
  };

  const getAlarmStyle = (type: string) => {
    if (type.includes("human") || type.includes("vehicle")) return "bg-destructive/20 text-destructive";
    if (type === "animal_detected") return "bg-yellow-500/20 text-yellow-600";
    return "bg-destructive/20 text-destructive";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Incidents</h1>
        <span className="text-[10px] font-mono bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
          {incidents.length} recorded incidents
        </span>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Active Critical Alerts */}
        <div className="col-span-12 lg:col-span-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            Active Critical Alerts
          </p>
          {criticalAlerts.length === 0 && (
            <div className="p-4 rounded-lg border border-border bg-card text-center">
              <p className="text-[10px] text-muted-foreground">No active alerts</p>
            </div>
          )}
          {criticalAlerts.map(alert => (
            <button
              key={alert.id}
              onClick={() => setSelectedIncident(alert.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                activeIncident?.id === alert.id
                  ? "border-destructive bg-destructive/10"
                  : "border-border bg-card hover:bg-secondary"
              }`}
            >
              <p className="text-xs font-bold text-destructive">{alert.eventType}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{alert.sensorName}</p>
              <p className="text-[9px] font-mono text-muted-foreground/70 mt-1">{alert.timestamp}</p>
            </button>
          ))}
        </div>

        {/* Dispatch Panel + SLA Timer */}
        <div className="col-span-12 lg:col-span-5">
          {activeIncident && (
            <FirstResponderDispatch
              incidentId={activeIncident.id}
              incidentType={activeIncident.eventType}
              location={activeIncident.sensorName}
            />
          )}
        </div>

        <div className="col-span-12 lg:col-span-4">
          <SlaTimer
            isActive={!!activeIncident}
            incidentId={activeIncident?.id}
            dispatchTime={dispatchedAt || undefined}
          />
        </div>
      </div>

      {/* Incident Evidence Log */}
      {incidents.length > 0 && (
        <div className="glass-panel">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
            <Camera className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Incident Evidence</span>
          </div>
          <div className="p-4 space-y-3 max-h-[700px] overflow-y-auto">
            {incidents.map((incident) => {
              const isExpanded = expandedIncidentId === incident.id;
              const totalEvidence =
                incident.snapshots.length +
                (incident.video_clips?.length ?? 0) +
                (incident.plate_detections?.length ?? 0);

              return (
                <div key={incident.id} className="rounded-lg border border-border/50 bg-card overflow-hidden">
                  {/* Compact header — always visible */}
                  <button
                    onClick={() => toggleExpand(incident.id)}
                    className="w-full text-left p-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors"
                  >
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${getAlarmStyle(incident.alarm_type)}`}>
                      {ALARM_LABELS[incident.alarm_type] || incident.alarm_type.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-bold text-foreground truncate flex-1">{incident.zone_name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {incident.snapshots.length > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                          <Camera className="h-3 w-3" /> {incident.snapshots.length}
                        </span>
                      )}
                      {(incident.video_clips?.length ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] text-primary">
                          <Video className="h-3 w-3" /> {incident.video_clips!.length}
                        </span>
                      )}
                      {(incident.plate_detections?.length ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] text-yellow-600">
                          <Car className="h-3 w-3" /> {incident.plate_detections!.length}
                        </span>
                      )}
                      <span className="text-[9px] font-mono text-muted-foreground/70">
                        {new Date(incident.timestamp).toLocaleTimeString()}
                      </span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Expanded evidence panel */}
                  {isExpanded && (
                    <div className="border-t border-border/50 p-3 space-y-3">
                      {/* Location + timestamp */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        {incident.location && (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <MapPin className="h-3 w-3 text-primary" />
                            <span className="font-semibold">{incident.location.name}</span>
                            <span>— {incident.location.address}</span>
                            <span className="font-mono text-[9px]">({incident.location.lat}, {incident.location.lng})</span>
                          </div>
                        )}
                        <p className="text-[9px] font-mono text-muted-foreground/70 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(incident.timestamp).toLocaleString()}
                        </p>
                      </div>

                      {/* Evidence grid — side by side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* Camera Snapshots */}
                        {incident.snapshots.map((snap, i) => (
                          <button
                            key={`snap-${i}`}
                            onClick={() => setExpandedMedia({ url: getUrl(snap), type: "image" })}
                            className="relative group rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
                          >
                            <img
                              src={getUrl(snap)}
                              alt={`Snapshot ${i + 1}`}
                              className="w-full h-36 object-cover"
                            />
                            <div className="absolute inset-0 bg-background/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="h-6 w-6 text-foreground" />
                            </div>
                            <div className="absolute bottom-1 left-1 bg-background/80 backdrop-blur-sm text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Camera className="h-2.5 w-2.5" /> Snapshot {i + 1}
                            </div>
                          </button>
                        ))}

                        {/* Video Clips */}
                        {incident.video_clips?.map((clip, i) => (
                          <div
                            key={`vid-${i}`}
                            className="relative rounded-lg overflow-hidden border border-primary/50 bg-black"
                          >
                            <video
                              src={getUrl(clip)}
                              className="w-full h-36 object-cover"
                              controls
                              muted
                              preload="metadata"
                              playsInline
                            />
                            <div className="absolute top-1 right-1 bg-primary/90 text-[9px] font-bold text-primary-foreground px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Video className="h-2.5 w-2.5" /> 5s clip
                            </div>
                            <div className="absolute bottom-1 left-1 bg-background/80 backdrop-blur-sm text-[9px] font-mono px-1.5 py-0.5 rounded">
                              Camera {i + 1}
                            </div>
                          </div>
                        ))}

                        {/* License Plate Detections */}
                        {incident.plate_detections?.map((plate, i) => (
                          <button
                            key={`plate-${i}`}
                            onClick={() => setExpandedMedia({ url: getUrl(plate.plate_image), type: "image" })}
                            className="relative group rounded-lg overflow-hidden border-2 border-yellow-500/50 hover:border-yellow-500 transition-colors bg-black"
                          >
                            <img
                              src={getUrl(plate.plate_image)}
                              alt="License plate"
                              className="w-full h-36 object-contain bg-gray-900"
                            />
                            <div className="absolute inset-0 bg-background/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Car className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div className="absolute top-1 right-1 bg-yellow-500/90 text-[9px] font-bold text-black px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Car className="h-2.5 w-2.5" /> Plate
                            </div>
                            {plate.plate_text && (
                              <div className="absolute bottom-0 left-0 right-0 bg-yellow-500 text-black text-xs font-bold text-center py-1 tracking-wider">
                                {plate.plate_text}
                              </div>
                            )}
                            {!plate.plate_text && (
                              <div className="absolute bottom-1 left-1 bg-yellow-500/80 text-[9px] font-mono text-black px-1.5 py-0.5 rounded">
                                OCR pending
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Evidence summary bar */}
                      <div className="flex items-center gap-3 pt-1 border-t border-border/30">
                        <p className="text-[10px] text-muted-foreground flex-1">
                          <span className="font-semibold">Status:</span> {incident.status}
                          {" — "}
                          <span className="font-semibold">{totalEvidence}</span> evidence item{totalEvidence !== 1 ? "s" : ""} collected
                        </p>
                        {(incident.plate_detections?.length ?? 0) > 0 && (
                          <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                            <Car className="h-3 w-3 text-yellow-600" />
                            <span className="text-[10px] font-bold text-yellow-600">
                              {incident.plate_detections!.map(p => p.plate_text || "Unknown").join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <EventLogTable events={events} />

      {/* Fullscreen media viewer */}
      {expandedMedia && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedMedia(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            {expandedMedia.type === "image" ? (
              <img src={expandedMedia.url} alt="Evidence" className="w-full rounded-lg border border-destructive/50 max-h-[80vh] object-contain bg-black" />
            ) : (
              <video src={expandedMedia.url} controls autoPlay className="w-full rounded-lg border border-primary/50 max-h-[80vh] bg-black" />
            )}
            <button onClick={() => setExpandedMedia(null)} className="absolute -top-3 -right-3 bg-destructive rounded-full p-1">
              <X className="h-4 w-4 text-destructive-foreground" />
            </button>
            <div className="absolute bottom-3 left-3 bg-destructive/90 px-3 py-1 rounded text-xs font-bold text-destructive-foreground">
              {expandedMedia.type === "image" ? "ALERT EVIDENCE" : "VIDEO EVIDENCE — 5s CLIP"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incidents;
