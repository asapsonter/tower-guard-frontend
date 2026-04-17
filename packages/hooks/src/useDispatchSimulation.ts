/**
 * Simulation engine — focused on AMAC council area, Abuja
 * Dispatches team batches (3-5 responders per incident)
 * Tracks team leads, performance, and accountability
 */
import { useEffect, useRef } from "react";
import { supabase } from "@tower-guard/supabase-client";

const AMAC_LOCATIONS = [
  "Abuja - Garki Area 11, Airtel Mast #AB-018",
  "Abuja - Wuse Zone 5, MTN Mast #AB-032",
  "Abuja - Maitama, Glo Mast #AB-007",
  "Abuja - Asokoro, 9mobile Mast #AB-041",
  "Abuja - Central Business District, MTN Mast #AB-055",
  "Abuja - Jabi, Airtel Mast #AB-023",
  "Abuja - Gwarinpa, Glo Mast #AB-064",
  "Abuja - Kubwa, MTN Mast #AB-078",
];

const DETAILS = [
  "2 individuals detected breaching compound perimeter. Motion tracking active.",
  "Thermal signature detected near eastern fence. Single intruder.",
  "Unauthorized person detected climbing perimeter fence.",
  "Intruder detected via thermal sensor. Body heat signature confirmed.",
  "Perimeter breach detected. Individual spotted moving toward equipment.",
  "Multiple suspects spotted near generator house. Armed threat assessed.",
];

// Full responder roster — teams are drawn from this pool
const RESPONDER_ROSTER = [
  "Sgt. Chinedu Okafor",
  "Cpl. Blessing Adamu",
  "Insp. Yusuf Bello",
  "Sgt. Ngozi Eze",
  "Cpl. Hassan Abubakar",
  "Insp. Fatima Danjuma",
  "Sgt. Emmanuel Obi",
  "Cpl. Aisha Mohammed",
  "Sgt. Tunde Bakare",
  "Cpl. Chioma Nwosu",
  "Pvt. Abdullahi Garba",
  "Pvt. Grace Okonkwo",
];

const RESPONDER_MESSAGES = [
  "En route to mast site. ETA 8 minutes.",
  "Team assembled. Proceeding to target location.",
  "Arrived at site. Perimeter secure. Conducting sweep.",
  "Suspect apprehended near eastern fence. Requesting backup.",
  "Area secured. No further threats detected.",
  "Visual contact with suspect. Moving to intercept.",
  "Site cleared. Team returning to base.",
  "Perimeter check complete. All zones secure.",
];

const COMMAND_MESSAGES = [
  "Copy. Maintain position and report.",
  "Backup unit dispatched. ETA 5 minutes.",
  "HQ acknowledges. Proceed with caution.",
  "CCTV confirms movement on the northern fence.",
  "Good work. Continue surveillance.",
  "Hold position. Additional intel incoming.",
  "AMAC Command confirms — team lead report status.",
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickN = <T,>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

async function upsertPerformance(name: string, field: "total_dispatches" | "total_accepted" | "total_rejected" | "total_ducked") {
  if (!supabase) return;
  // Check if exists
  const { data: existing } = await supabase
    .from("responder_performance")
    .select("*")
    .eq("responder_name", name)
    .eq("council_area", "AMAC")
    .maybeSingle();

  if (existing) {
    const updates: Record<string, unknown> = {
      [field]: ((existing as Record<string, unknown>)[field] as number || 0) + 1,
      last_active_at: new Date().toISOString(),
    };
    await supabase.from("responder_performance").update(updates as never).eq("id", existing.id);
  } else {
    const insertRow: Record<string, unknown> = {
      responder_name: name,
      council_area: "AMAC",
      [field]: 1,
      last_active_at: new Date().toISOString(),
    };
    await supabase.from("responder_performance").insert(insertRow as never);
  }
}

export function useDispatchSimulation(enabled = true) {
  const seeded = useRef(false);

  useEffect(() => {
    if (!enabled || seeded.current || !supabase) return;
    seeded.current = true;
    const sb = supabase; // narrowed non-null reference for closures

    const intervals: ReturnType<typeof setInterval>[] = [];

    const seed = async () => {
      const { count } = await sb
        .from("dispatch_assignments")
        .select("*", { count: "exact", head: true });

      if ((count ?? 0) < 3) {
        const statuses = ["pending", "pending", "accepted", "en-route", "on-site", "resolved"];
        for (let i = 0; i < 6; i++) {
          const idx = i % AMAC_LOCATIONS.length;
          const status = statuses[i];
          const dispatchedAt = new Date(Date.now() - (6 - i) * 180000).toISOString();

          const { data: incident } = await sb
            .from("incidents")
            .insert({
              event_type: "INTRUDER",
              details: DETAILS[i % DETAILS.length],
              severity: "critical",
              location: AMAC_LOCATIONS[idx],
              state: "Abuja",
              mast_id: `MAST-${String(idx + 1).padStart(3, "0")}`,
              source: "CCTV Motion Detection",
              status: status === "resolved" ? "resolved" : "pending",
              created_at: dispatchedAt,
              resolved_at: status === "resolved" ? new Date().toISOString() : null,
            })
            .select()
            .single();

          if (!incident) continue;

          const teamSize = Math.floor(Math.random() * 3) + 3; // 3-5 responders
          const team = pickN(RESPONDER_ROSTER, teamSize);
          const teamLead = team[0];

          const { data: assignment } = await sb.from("dispatch_assignments").insert({
            incident_id: incident.id,
            agency: "NSCDC",
            status,
            dispatched_at: dispatchedAt,
            sla_seconds: 900,
            council_area: "AMAC",
            responder_name: status !== "pending" ? teamLead : null,
            accepted_at: ["accepted", "en-route", "on-site", "resolved"].includes(status)
              ? new Date(new Date(dispatchedAt).getTime() + 45000).toISOString() : null,
            en_route_at: ["en-route", "on-site", "resolved"].includes(status)
              ? new Date(new Date(dispatchedAt).getTime() + 120000).toISOString() : null,
            on_site_at: ["on-site", "resolved"].includes(status)
              ? new Date(new Date(dispatchedAt).getTime() + 360000).toISOString() : null,
            resolved_at: status === "resolved"
              ? new Date(new Date(dispatchedAt).getTime() + 720000).toISOString() : null,
          }).select().single();

          // Add team members for non-pending assignments
          if (assignment && status !== "pending") {
            for (let j = 0; j < team.length; j++) {
              await sb.from("dispatch_team_members").insert({
                assignment_id: assignment.id,
                responder_name: team[j],
                role: j === 0 ? "team_lead" : "member",
                status: "active",
              });
              // Track performance
              await upsertPerformance(team[j], "total_dispatches");
              await upsertPerformance(team[j], "total_accepted");
            }
          }
        }
      }

      // ── Ongoing simulation ──

      // Every 45s: new dispatch to AMAC area
      const newDispatchInterval = setInterval(async () => {
        const idx = Math.floor(Math.random() * AMAC_LOCATIONS.length);
        const { data: incident } = await sb
          .from("incidents")
          .insert({
            event_type: "INTRUDER",
            details: pick(DETAILS),
            severity: "critical",
            location: AMAC_LOCATIONS[idx],
            state: "Abuja",
            source: "CCTV Motion Detection",
            status: "pending",
          })
          .select()
          .single();

        if (incident) {
          // Dispatch goes directly to a team — never left unassigned
          const teamSize = Math.floor(Math.random() * 3) + 3;
          const team = pickN(RESPONDER_ROSTER, teamSize);
          const teamLead = team[0];

          const { data: assignment } = await sb.from("dispatch_assignments").insert({
            incident_id: incident.id,
            agency: "NSCDC",
            status: "pending",
            sla_seconds: 900,
            council_area: "AMAC",
            responder_name: teamLead,
          }).select().single();

          if (assignment) {
            for (let j = 0; j < team.length; j++) {
              await sb.from("dispatch_team_members").insert({
                assignment_id: assignment.id,
                responder_name: team[j],
                role: j === 0 ? "team_lead" : "member",
                status: "active",
              });
              await upsertPerformance(team[j], "total_dispatches");
            }
          }
        }
      }, 45000);
      intervals.push(newDispatchInterval);

      // Every 20s: progress a random assignment + assign team when accepted
      const progressInterval = setInterval(async () => {
        const { data: active } = await sb
          .from("dispatch_assignments")
          .select("*")
          .in("status", ["pending", "accepted", "en-route", "on-site"])
          .limit(20);

        if (!active || active.length === 0) return;
        const a = pick(active);

        if (a.status === "pending") {
          // Assign a team batch
          const teamSize = Math.floor(Math.random() * 3) + 3;
          const team = pickN(RESPONDER_ROSTER, teamSize);
          const teamLead = team[0];

          await sb
            .from("dispatch_assignments")
            .update({
              status: "accepted",
              accepted_at: new Date().toISOString(),
              responder_name: teamLead,
            })
            .eq("id", a.id);

          // Add team members
          for (let j = 0; j < team.length; j++) {
            await sb.from("dispatch_team_members").insert({
              assignment_id: a.id,
              responder_name: team[j],
              role: j === 0 ? "team_lead" : "member",
              status: "active",
            });
            await upsertPerformance(team[j], "total_dispatches");
            await upsertPerformance(team[j], "total_accepted");
          }

          // Occasionally simulate a "ducked" responder (10% chance)
          if (Math.random() < 0.1) {
            const ducker = pick(RESPONDER_ROSTER.filter(r => !team.includes(r)));
            await upsertPerformance(ducker, "total_dispatches");
            await upsertPerformance(ducker, "total_ducked");
          }

          await sb.from("responder_messages").insert({
            assignment_id: a.id,
            sender_name: "System",
            sender_role: "command",
            message_type: "status",
            content: `Team of ${teamSize} assigned. Lead: ${teamLead}. Proceeding to site.`,
          });
        } else {
          const progression: Record<string, { status: string; updates: Record<string, unknown> }> = {
            accepted: { status: "en-route", updates: { en_route_at: new Date().toISOString() } },
            "en-route": { status: "on-site", updates: { on_site_at: new Date().toISOString() } },
            "on-site": { status: "resolved", updates: { resolved_at: new Date().toISOString() } },
          };
          const next = progression[a.status];
          if (!next) return;

          await sb.from("dispatch_assignments")
            .update({ status: next.status, ...next.updates })
            .eq("id", a.id);

          await sb.from("responder_messages").insert({
            assignment_id: a.id,
            sender_name: a.responder_name || pick(RESPONDER_ROSTER),
            sender_role: "responder",
            message_type: "status",
            content: `Status updated: ${next.status.toUpperCase()}`,
          });
        }
      }, 20000);
      intervals.push(progressInterval);

      // Every 15s: simulate a comms message
      const messageInterval = setInterval(async () => {
        const { data: active } = await sb
          .from("dispatch_assignments")
          .select("*")
          .in("status", ["accepted", "en-route", "on-site"])
          .limit(10);

        if (!active || active.length === 0) return;
        const a = pick(active);
        const isCommand = Math.random() > 0.65;

        await sb.from("responder_messages").insert({
          assignment_id: a.id,
          sender_name: isCommand ? "Col. Ibrahim Musa (AMAC)" : (a.responder_name || pick(RESPONDER_ROSTER)),
          sender_role: isCommand ? "command" : "responder",
          message_type: Math.random() > 0.85 ? "voice" : "text",
          content: isCommand ? pick(COMMAND_MESSAGES) : pick(RESPONDER_MESSAGES),
          voice_duration_seconds: Math.random() > 0.85 ? Math.floor(Math.random() * 25 + 5) : null,
        });
      }, 15000);
      intervals.push(messageInterval);
    };

    seed();

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [enabled]);
}
