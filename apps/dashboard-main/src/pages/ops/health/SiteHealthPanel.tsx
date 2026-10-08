import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Battery, Box, Camera, Cpu, Database, HardDrive, HeartPulse, Lock, Network, Radio, Router, ShieldCheck, Signal, Sun, Timer, Wifi,
} from "lucide-react";
import { Panel } from "@/components/ops/Panel";
import { Meter, Pill } from "@/components/ops/Pill";
import type { HealthComponent, SiteDetail } from "@/lib/ops";
import { PROTECTION_COLOR, scoreColor } from "./protection";

type Tone = "ok" | "warn" | "bad";
const TONE_COLOR: Record<Tone, string> = { ok: "#22c55e", warn: "#eab308", bad: "#ef4444" };
const COMP_COLOR: Record<HealthComponent["status"], string> = { ok: "#22c55e", degraded: "#eab308", down: "#ef4444" };

function Check({ icon: Icon, label, value, tone, hint }: { icon: typeof Cpu; label: string; value: ReactNode; tone: Tone; hint?: string }) {
  const c = TONE_COLOR[tone];
  return (
    <div className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 bg-background/30" style={{ borderColor: `${c}40` }}>
      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: c }} />
      <div className="min-w-0 flex-1">
        <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground truncate">{label}</p>
        <p className="font-mono text-[12px] tabular-nums truncate" style={{ color: tone === "ok" ? undefined : c }}>{value}</p>
        {hint && <p className="text-[9px] text-muted-foreground truncate">{hint}</p>}
      </div>
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
    </div>
  );
}

const signalTone = (dbm: number, up: boolean): Tone => (!up ? "bad" : dbm >= -85 ? "ok" : "warn");

/** Compact protection-health formula, e.g. "CCTV: 100% · Sensors: 92% · Backhaul: … → Protection State: …". */
function formula(site: SiteDetail): string[] {
  const c = (k: HealthComponent["key"]) => site.health.components.find((x) => x.key === k);
  const parts: string[] = [];
  const cctv = c("cctv"); if (cctv) parts.push(`CCTV: ${cctv.score}%`);
  const sen = c("sensors"); if (sen) parts.push(`Sensors: ${sen.score}%`);
  const bh = c("backhaul"); if (bh) parts.push(`Backhaul: ${bh.detail}`);
  const ai = c("edge_ai"); if (ai) parts.push(`Edge AI: ${ai.status === "ok" ? "Healthy" : ai.detail}`);
  parts.push(`Battery: ${site.health.batterySocPct}%`);
  parts.push(`Storage: ${site.health.storageFreePct}% available`);
  return parts;
}

/** Per-site self-protection panel: is ITIPS itself able to protect this site right now? */
export function SiteHealthPanel({ site }: { site: SiteDetail }) {
  const h = site.health;
  const pc = PROTECTION_COLOR[h.protectionState];
  const camsOnline = h.cameras.filter((c) => c.online).length;
  const fwOk = h.firmware === h.firmwareLatest;

  return (
    <Panel title={<span className="flex items-center gap-2"><span className="font-mono text-primary">{site.id}</span><span className="truncate text-muted-foreground font-normal">{site.name}</span></span>}
      icon={HeartPulse}
      actions={<Link to={`/sites/${site.id}`} className="hud-chip hover:text-primary"><Box className="h-3 w-3" />Twin</Link>}
      bodyClassName="p-4 space-y-4">
      {/* Headline: score + state, and why it beats "site online" */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
            <circle cx={18} cy={18} r={15.5} fill="none" stroke="hsl(var(--secondary))" strokeWidth={3} />
            <circle cx={18} cy={18} r={15.5} fill="none" stroke={pc} strokeWidth={3} strokeLinecap="round"
              strokeDasharray={`${(h.protectionScore / 100) * 97.4} 97.4`} style={{ filter: `drop-shadow(0 0 3px ${pc})` }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-xl font-bold tabular-nums" style={{ color: pc }}>{h.protectionScore}</span>
            <span className="text-[8px] uppercase tracking-[0.14em] text-muted-foreground">score</span>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Site protection state</p>
          <Pill color={pc} solid className="!text-[11px] !px-2.5 !py-1">{h.protectionState}</Pill>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="rounded border border-primary/10 px-2 py-1">
              <p className="text-muted-foreground">Ordinary NMS</p>
              <p className="font-mono font-bold" style={{ color: site.status === "offline" ? "#ef4444" : "#22c55e" }}>{site.status === "offline" ? "SITE OFFLINE" : "SITE ONLINE ✓"}</p>
            </div>
            <div className="rounded border px-2 py-1" style={{ borderColor: `${pc}66`, background: `${pc}10` }}>
              <p className="text-muted-foreground">ITIPS self-protection</p>
              <p className="font-mono font-bold truncate" style={{ color: pc }}>{h.protectionScore}% protected</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
        <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Site protection health score</p>
        <p className="text-[12px] leading-relaxed text-foreground">
          {formula(site).join(" · ")} <span className="text-primary">→</span>{" "}
          <span className="font-bold" style={{ color: pc }}>Protection State: {h.protectionState}</span>
        </p>
      </div>

      {/* Component breakdown */}
      <div className="space-y-1.5">
        {h.components.map((c) => (
          <div key={c.key} className="grid grid-cols-[96px_1fr_40px] items-center gap-2">
            <span className="text-[11px] text-foreground truncate">{c.label}</span>
            <div>
              <Meter value={c.score} color={COMP_COLOR[c.status]} />
              <p className="text-[9px] text-muted-foreground truncate">{c.detail}</p>
            </div>
            <span className="text-right font-mono text-[11px] tabular-nums" style={{ color: scoreColor(c.score) }}>{c.score}%</span>
          </div>
        ))}
      </div>

      {/* Device checks */}
      <div>
        <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1.5">Device telemetry</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <Check icon={Camera} label="Cameras" value={`${camsOnline}/${h.cameras.length} online`} tone={camsOnline === h.cameras.length ? "ok" : camsOnline ? "warn" : "bad"}
            hint={h.cameras.filter((c) => !c.online).map((c) => `${c.id.split("-").pop()} offline`).join(", ") || "all streaming"} />
          <Check icon={Cpu} label="Jetson edge heartbeat" value={h.jetsonHeartbeatSec < 60 ? `${h.jetsonHeartbeatSec}s ago` : `${Math.round(h.jetsonHeartbeatSec / 60)} min ago`}
            tone={h.jetsonHeartbeatSec < 60 ? "ok" : h.jetsonHeartbeatSec < 600 ? "warn" : "bad"} />
          <Check icon={Router} label="Router" value={h.router.toUpperCase()} tone={h.router === "ok" ? "ok" : h.router === "degraded" ? "warn" : "bad"} />
          <Check icon={Timer} label="Latency" value={h.latencyMs ? `${h.latencyMs} ms` : "—"} tone={!h.latencyMs ? "bad" : h.latencyMs < 150 ? "ok" : "warn"} />
          <Check icon={Signal} label={`SIM 1 · ${h.sim1.carrier}`} value={h.sim1.up ? `UP · ${h.sim1.signalDbm} dBm` : "DOWN"} tone={signalTone(h.sim1.signalDbm, h.sim1.up)} hint="Primary backhaul" />
          <Check icon={Wifi} label={`SIM 2 · ${h.sim2.carrier}`} value={h.sim2.up ? `UP · ${h.sim2.signalDbm} dBm` : "DOWN"} tone={signalTone(h.sim2.signalDbm, h.sim2.up)} hint="Secondary backhaul" />
          <Check icon={HardDrive} label="Storage remaining" value={`${h.storageFreePct}%`} tone={h.storageFreePct >= 30 ? "ok" : h.storageFreePct >= 15 ? "warn" : "bad"} />
          <Check icon={Battery} label="Battery SOC" value={`${h.batterySocPct}%`} tone={h.batterySocPct >= 50 ? "ok" : h.batterySocPct >= 25 ? "warn" : "bad"} />
          <Check icon={Sun} label="Solar charging" value={`${h.solarChargingW.toLocaleString("en-GB")} W`} tone={h.solarChargingW > 0 ? "ok" : "warn"} />
          <Check icon={Radio} label="Sensor health" value={`${h.sensorsHealthyPct}% healthy`} tone={h.sensorsHealthyPct >= 90 ? "ok" : h.sensorsHealthyPct >= 60 ? "warn" : "bad"} />
          <Check icon={Lock} label="Cabinet tamper" value={h.cabinetTamper ? "TRIPPED" : "Sealed"} tone={h.cabinetTamper ? "bad" : "ok"} />
          <Check icon={ShieldCheck} label="Firmware" value={h.firmware} tone={fwOk ? "ok" : "warn"} hint={fwOk ? "latest" : `latest ${h.firmwareLatest} — update pending`} />
          <Check icon={Network} label="VMS connectivity" value={h.vmsConnected ? "Connected" : "Disconnected"} tone={h.vmsConnected ? "ok" : "bad"} />
          <Check icon={Database} label="Backhaul" value={site.backhaul === "primary" ? "Primary" : site.backhaul === "secondary" ? "Secondary (failover)" : "Down"}
            tone={site.backhaul === "primary" ? "ok" : site.backhaul === "secondary" ? "warn" : "bad"} />
        </div>
      </div>
    </Panel>
  );
}
