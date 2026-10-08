/**
 * Demo dataset for the NSCDC Station Dashboard.
 *
 * Used only when Supabase returns no dispatches (empty project, offline, or
 * a fresh preview deployment). As soon as real rows exist the dashboard
 * switches back to live data. All timestamps are relative to `base` so SLA
 * timers always look current.
 */
import type { DispatchAssignment, ResponderMessage } from "@tower-guard/hooks";

export interface MockIncident {
  id: string;
  location: string | null;
  event_type: string;
  severity: string;
  details: string;
  mast_id: string | null;
  status: string;
  source?: string;
  created_at: string;
}

export interface MockTeamMember {
  id: string;
  assignment_id: string;
  responder_name: string;
  role: string;
  status: string;
  joined_at: string;
}

export interface MockPerformance {
  id: string;
  responder_name: string;
  responder_id: string | null;
  total_dispatches: number;
  total_accepted: number;
  total_rejected: number;
  total_ducked: number;
  avg_response_seconds: number | null;
  council_area: string;
  last_active_at: string | null;
}

export interface NscdcMockData {
  assignments: DispatchAssignment[];
  incidents: Record<string, MockIncident>;
  teamMembers: Record<string, MockTeamMember[]>;
  performance: MockPerformance[];
  messages: ResponderMessage[];
}

// Valid UUIDs so any accidental Supabase `.in("id", …)` query stays well-formed.
// The counter leads so the UI's 8-char short ids ("INC: b0000003") stay distinct.
const uuid = (prefix: string, n: number) =>
  `${prefix}${String(n).padStart(7, "0")}-0000-4000-8000-000000000000`;

interface Scenario {
  status: "pending" | "accepted" | "en-route" | "on-site" | "resolved";
  minsAgo: number;
  site: string;
  mast: string;
  council: string;
  event: string;
  severity: "critical" | "warning" | "info";
  details: string;
  lead: string | null;
  crew: string[];
  ducked?: string;
  resolvedAfter?: number;
}

const SCENARIOS: Scenario[] = [
  {
    status: "on-site", minsAgo: 34, site: "MTN Maitama Tower — Aguiyi Ironsi St", mast: "tm_021", council: "AMAC",
    event: "Perimeter Breach", severity: "critical",
    details: "AI camera CAM-01 confirmed intruder crouched at west fence (Zone 3). Fence wire cut ~40cm. Alarm panel armed.",
    lead: "Insp. Musa Abdullahi", crew: ["Cpl. Ngozi Eze", "Sgt. Chinedu Okafor"],
  },
  {
    status: "on-site", minsAgo: 22, site: "9mobile Jabi Lake Site — Obafemi Awolowo Way", mast: "tm_044", council: "AMAC",
    event: "Equipment Theft Attempt", severity: "critical",
    details: "Battery cabinet door forced open. 2 of 8 lithium modules missing. Shelter door contact triggered at 02:14.",
    lead: "Sgt. Halima Yusuf", crew: ["Cpl. Tunde Bakare"], ducked: "Pvt. Emeka Nwosu",
  },
  {
    status: "en-route", minsAgo: 12, site: "Glo Garki Area 11 — Ahmadu Bello Way", mast: "tm_017", council: "AMAC",
    event: "Fence Climbing", severity: "warning",
    details: "Vibration sensor on north fence segment exceeded threshold 3x in 90s. Thermal shows 1 subject inside perimeter.",
    lead: "Sgt. Chinedu Okafor", crew: ["Cpl. Blessing Ade"],
  },
  {
    status: "accepted", minsAgo: 6, site: "Airtel Wuse II — Aminu Kano Crescent", mast: "tm_009", council: "AMAC",
    event: "Gate Tampering", severity: "warning",
    details: "Padlock sensor reports repeated force on main gate. No visual yet — camera obstructed by parked vehicle.",
    lead: "Cpl. Ngozi Eze", crew: [],
  },
  {
    status: "pending", minsAgo: 2, site: "MTN Gwarinpa 3rd Avenue", mast: "tm_052", council: "AMAC",
    event: "Intruder Detected", severity: "critical",
    details: "YOLO detection: 2 persons, confidence 0.94, approaching generator enclosure. Awaiting responder acceptance.",
    lead: null, crew: [],
  },
  {
    status: "pending", minsAgo: 1, site: "Airtel Lugbe — Airport Road", mast: "tm_061", council: "AMAC",
    event: "Power Tamper", severity: "warning",
    details: "Generator stopped unexpectedly; fuel level dropped 38L in 4 minutes. Possible siphoning.",
    lead: null, crew: [],
  },
  {
    status: "resolved", minsAgo: 140, resolvedAfter: 38, site: "MTN Kubwa — Gado Nasko Road", mast: "tm_073", council: "Bwari",
    event: "Vandalised Equipment", severity: "warning",
    details: "Feeder cable cut at ladder base. Suspect apprehended on site, handed to Kubwa divisional office.",
    lead: "Insp. Musa Abdullahi", crew: ["Cpl. Tunde Bakare", "Pvt. Aisha Bello"],
  },
  {
    status: "resolved", minsAgo: 260, resolvedAfter: 25, site: "Glo Asokoro — Yakubu Gowon Crescent", mast: "tm_030", council: "AMAC",
    event: "Perimeter Breach", severity: "info",
    details: "False alarm — stray goats triggered PIR. Fence intact. Recommended raising PIR mount by 40cm.",
    lead: "Cpl. Blessing Ade", crew: [],
  },
  {
    status: "resolved", minsAgo: 410, resolvedAfter: 52, site: "9mobile Kuje Market Mast", mast: "tm_088", council: "Kuje",
    event: "Equipment Theft Attempt", severity: "critical",
    details: "Two suspects fled on motorcycle. Rectifier recovered 300m from site. Evidence photos uploaded.",
    lead: "Sgt. Halima Yusuf", crew: ["Pvt. Emeka Nwosu", "Cpl. Ngozi Eze"],
  },
];

const ORDER = ["pending", "accepted", "en-route", "on-site", "resolved"] as const;

const PERFORMANCE: Omit<MockPerformance, "id" | "last_active_at">[] = [
  { responder_name: "Insp. Musa Abdullahi", responder_id: null, total_dispatches: 46, total_accepted: 44, total_rejected: 2, total_ducked: 0, avg_response_seconds: 74, council_area: "AMAC" },
  { responder_name: "Sgt. Halima Yusuf", responder_id: null, total_dispatches: 41, total_accepted: 38, total_rejected: 3, total_ducked: 0, avg_response_seconds: 92, council_area: "AMAC" },
  { responder_name: "Sgt. Chinedu Okafor", responder_id: null, total_dispatches: 39, total_accepted: 35, total_rejected: 3, total_ducked: 1, avg_response_seconds: 105, council_area: "AMAC" },
  { responder_name: "Cpl. Ngozi Eze", responder_id: null, total_dispatches: 33, total_accepted: 31, total_rejected: 2, total_ducked: 0, avg_response_seconds: 81, council_area: "AMAC" },
  { responder_name: "Cpl. Blessing Ade", responder_id: null, total_dispatches: 28, total_accepted: 24, total_rejected: 4, total_ducked: 0, avg_response_seconds: 133, council_area: "AMAC" },
  { responder_name: "Cpl. Tunde Bakare", responder_id: null, total_dispatches: 25, total_accepted: 19, total_rejected: 4, total_ducked: 2, avg_response_seconds: 168, council_area: "AMAC" },
  { responder_name: "Pvt. Emeka Nwosu", responder_id: null, total_dispatches: 22, total_accepted: 11, total_rejected: 6, total_ducked: 5, avg_response_seconds: 241, council_area: "AMAC" },
  { responder_name: "Pvt. Aisha Bello", responder_id: null, total_dispatches: 18, total_accepted: 17, total_rejected: 1, total_ducked: 0, avg_response_seconds: 96, council_area: "AMAC" },
  { responder_name: "Sgt. Ibrahim Danjuma", responder_id: null, total_dispatches: 31, total_accepted: 29, total_rejected: 2, total_ducked: 0, avg_response_seconds: 88, council_area: "Bwari" },
  { responder_name: "Cpl. Grace Okon", responder_id: null, total_dispatches: 20, total_accepted: 16, total_rejected: 3, total_ducked: 1, avg_response_seconds: 152, council_area: "Kuje" },
  { responder_name: "Insp. Yakubu Garba", responder_id: null, total_dispatches: 27, total_accepted: 26, total_rejected: 1, total_ducked: 0, avg_response_seconds: 79, council_area: "Gwagwalada" },
];

export function buildNscdcMockData(base: number): NscdcMockData {
  const at = (minsAgo: number) => new Date(base - minsAgo * 60_000).toISOString();

  const assignments: DispatchAssignment[] = [];
  const incidents: Record<string, MockIncident> = {};
  const teamMembers: Record<string, MockTeamMember[]> = {};
  const messages: ResponderMessage[] = [];
  let msgN = 0;

  const msg = (
    assignment_id: string, minsAgo: number, sender_name: string, sender_role: string,
    message_type: "text" | "voice" | "photo", content: string | null, voice_duration_seconds: number | null = null,
  ) => {
    messages.push({
      id: uuid("c", ++msgN), assignment_id, created_at: at(minsAgo), sender_id: null,
      sender_name, sender_role, message_type, content, voice_duration_seconds, voice_url: null,
    });
  };

  SCENARIOS.forEach((s, i) => {
    const id = uuid("a", i + 1);
    const incidentId = uuid("b", i + 1);
    const stage = ORDER.indexOf(s.status);
    const resolvedMins = s.resolvedAfter ? s.minsAgo - s.resolvedAfter : null;

    incidents[incidentId] = {
      id: incidentId, location: s.site, event_type: s.event, severity: s.severity, details: s.details,
      mast_id: s.mast, status: s.status === "resolved" ? "resolved" : "active", source: "mock", created_at: at(s.minsAgo),
    };

    assignments.push({
      id, incident_id: incidentId, agency: "NSCDC", council_area: s.council, status: s.status,
      dispatched_at: at(s.minsAgo),
      accepted_at: stage >= 1 ? at(s.minsAgo - 1.5) : null,
      en_route_at: stage >= 2 ? at(s.minsAgo - 3) : null,
      on_site_at: stage >= 3 ? at(s.minsAgo - (s.resolvedAfter ? 14 : 11)) : null,
      resolved_at: resolvedMins !== null ? at(resolvedMins) : null,
      responder_id: null, responder_name: s.lead, sla_seconds: 900,
    });

    if (s.lead) {
      const team: MockTeamMember[] = [
        { id: uuid("d", i * 10 + 1), assignment_id: id, responder_name: s.lead, role: "team_lead", status: "active", joined_at: at(s.minsAgo - 1.5) },
        ...s.crew.map((name, j) => ({
          id: uuid("d", i * 10 + 2 + j), assignment_id: id, responder_name: name, role: "member", status: "active", joined_at: at(s.minsAgo - 2) ,
        })),
      ];
      if (s.ducked) {
        team.push({ id: uuid("d", i * 10 + 9), assignment_id: id, responder_name: s.ducked, role: "member", status: "ducked", joined_at: at(s.minsAgo - 2) });
      }
      teamMembers[id] = team;
    }
  });

  const [maitama, jabi, garki, wuse, , , kubwa, , kuje] = assignments.map((a) => a.id);

  // Live comms — newest first, matching how Supabase returns them
  msg(maitama, 33, "NSCDC Command", "command", "text", "Breach confirmed on CAM-01. Insp. Abdullahi, take lead. Approach from the east gate.");
  msg(maitama, 31, "Insp. Musa Abdullahi", "responder", "text", "Copy. 3 officers moving. ETA 8 mins.");
  msg(maitama, 22, "Insp. Musa Abdullahi", "responder", "voice", null, 14);
  msg(maitama, 20, "Cpl. Ngozi Eze", "responder", "photo", "/evidence/intruder-snapshot.jpg");
  msg(maitama, 19, "Insp. Musa Abdullahi", "responder", "text", "On site. Fence cut at west side, suspect fled toward drainage channel. Securing perimeter.");
  msg(jabi, 21, "NSCDC Command", "command", "text", "Battery theft in progress at Jabi Lake. Sgt. Yusuf respond. Pvt. Nwosu report your position.");
  msg(jabi, 14, "Sgt. Halima Yusuf", "responder", "photo", "/evidence/evidence1.jpeg");
  msg(jabi, 12, "Sgt. Halima Yusuf", "responder", "text", "Cabinet forced, 2 modules gone. Pvt. Nwosu did not join — marking as ducked.");
  msg(garki, 11, "NSCDC Command", "command", "text", "Fence climbing at Garki Area 11. Thermal shows 1 subject inside.");
  msg(garki, 9, "Sgt. Chinedu Okafor", "responder", "voice", null, 9);
  msg(garki, 7, "Sgt. Chinedu Okafor", "responder", "text", "En route via Ahmadu Bello Way, heavy traffic. ETA 6 mins.");
  msg(wuse, 4, "Cpl. Ngozi Eze", "responder", "text", "Accepted. Leaving Maitama now, will check Wuse gate.");
  msg(kubwa, 118, "Insp. Musa Abdullahi", "responder", "photo", "/evidence/cctv-feed-nigerian-mast.jpg");
  msg(kubwa, 104, "Insp. Musa Abdullahi", "responder", "text", "Suspect in custody. Cable damage logged for MTN maintenance.");
  msg(kuje, 380, "Sgt. Halima Yusuf", "responder", "photo", "/evidence/thermal-detection-feed.jpg");
  msg(kuje, 372, "Pvt. Emeka Nwosu", "responder", "photo", "/evidence/camera-feed.jpg");
  messages.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const performance: MockPerformance[] = PERFORMANCE.map((p, i) => ({
    ...p, id: uuid("e", i + 1), last_active_at: at(3 + i * 17),
  }));

  return { assignments, incidents, teamMembers, performance, messages };
}
