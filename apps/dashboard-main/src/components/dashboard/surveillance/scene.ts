/**
 * Procedural CCTV scene of a telecom mast compound at night.
 *
 * Everything is drawn on a 2D canvas each frame — no video assets. All moving
 * actors are driven by a shared wall-clock timeline (`scenarioAt`), so every
 * camera tile shows the same intruder at the same moment and the React HUD can
 * read the same timeline to raise alerts.
 */

export type FeedMode = "night" | "thermal" | "mono";

export interface CameraView {
  mode: FeedMode;
  /** Horizontal framing offset in world px (world is 1600 wide). */
  panX: number;
  /** Zoom factor; 1 shows the full 960px-wide frame. */
  zoom: number;
  /** Amplitude of the slow PTZ drift, world px. */
  drift: number;
}

export const WORLD_W = 1600;
export const FRAME_W = 960;
export const FRAME_H = 540;
const HORIZON = 300;

// ── Timeline ──────────────────────────────────────────────────────────────

/** One full scripted loop, seconds. */
export const CYCLE = 48;

export type ThreatPhase = "clear" | "approach" | "breach" | "retreat";

export interface Actor {
  x: number;
  y: number; // feet position
  scale: number;
  walkPhase: number;
  crouch: number; // 0 standing → 1 crouched
  facing: 1 | -1;
}

export interface Scenario {
  phase: ThreatPhase;
  /** Seconds into the current cycle. */
  t: number;
  guard: Actor;
  intruder: Actor | null;
  vehicle: { x: number; dir: 1 | -1 } | null;
  confidence: number;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (k: number) => k * k * (3 - 2 * k);

export function scenarioAt(nowSec: number): Scenario {
  const t = ((nowSec % CYCLE) + CYCLE) % CYCLE;

  // Guard patrols inside the compound, back and forth on a 20s loop
  const gp = (nowSec % 20) / 20;
  const gk = gp < 0.5 ? gp * 2 : 2 - gp * 2;
  const guard: Actor = {
    x: lerp(820, 1240, ease(gk)),
    y: 452,
    scale: 0.95,
    walkPhase: nowSec * 6.5,
    crouch: 0,
    facing: gp < 0.5 ? 1 : -1,
  };

  // Intruder: approaches the fence from the left, crouches at it, then flees
  let phase: ThreatPhase = "clear";
  let intruder: Actor | null = null;
  let confidence = 0;
  if (t >= 18 && t < 40) {
    if (t < 27) {
      phase = "approach";
      const k = ease(clamp01((t - 18) / 9));
      intruder = { x: lerp(-60, 560, k), y: lerp(520, 498, k), scale: 1.12, walkPhase: t * 7, crouch: 0, facing: 1 };
      confidence = lerp(0.62, 0.9, k);
    } else if (t < 35) {
      phase = "breach";
      const k = clamp01((t - 27) / 1.2);
      intruder = { x: 560 + Math.sin(t * 3) * 4, y: 498, scale: 1.12, walkPhase: 0, crouch: ease(k), facing: 1 };
      confidence = 0.97;
    } else {
      phase = "retreat";
      const k = ease(clamp01((t - 35) / 5));
      intruder = { x: lerp(560, -80, k), y: lerp(498, 525, k), scale: 1.12, walkPhase: t * 10, crouch: 0, facing: -1 };
      confidence = lerp(0.95, 0.7, k);
    }
  }

  // A distant vehicle crosses on the road twice per cycle
  let vehicle: Scenario["vehicle"] = null;
  const v1 = (t - 4) / 7;
  const v2 = (t - 41) / 6;
  if (v1 >= 0 && v1 <= 1) vehicle = { x: lerp(-100, WORLD_W + 100, v1), dir: 1 };
  else if (v2 >= 0 && v2 <= 1) vehicle = { x: lerp(WORLD_W + 100, -100, v2), dir: -1 };

  return { phase, t, guard, intruder, vehicle, confidence };
}

// ── Palette: every object has a visible luminance and a heat value ────────

function ironbow(h: number): [number, number, number] {
  const k = clamp01(h);
  const stops: [number, number, number, number][] = [
    [0.0, 8, 6, 30],
    [0.25, 60, 12, 110],
    [0.45, 170, 30, 120],
    [0.65, 235, 90, 30],
    [0.85, 255, 190, 40],
    [1.0, 255, 255, 220],
  ];
  for (let i = 1; i < stops.length; i++) {
    if (k <= stops[i][0]) {
      const [p0, r0, g0, b0] = stops[i - 1];
      const [p1, r1, g1, b1] = stops[i];
      const f = (k - p0) / (p1 - p0);
      return [lerp(r0, r1, f), lerp(g0, g1, f), lerp(b0, b1, f)];
    }
  }
  return [255, 255, 220];
}

function makeShade(mode: FeedMode) {
  return (vis: number, heat: number, alpha = 1) => {
    let r: number, g: number, b: number;
    if (mode === "thermal") {
      [r, g, b] = ironbow(heat);
    } else if (mode === "night") {
      const l = clamp01(vis);
      r = l * 120; g = 40 + l * 215; b = l * 120;
    } else {
      const l = clamp01(vis) * 235 + 10;
      r = l; g = l; b = l * 1.04;
    }
    return `rgba(${r | 0},${g | 0},${b | 0},${alpha})`;
  };
}

// ── Static geometry, generated once ───────────────────────────────────────

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seeded(42);
const STARS = Array.from({ length: 140 }, () => ({ x: rand() * WORLD_W, y: rand() * (HORIZON - 40), r: rand() * 1.3 + 0.3, tw: rand() * 6 }));
const TREES = Array.from({ length: 90 }, (_, i) => ({ x: (i / 90) * WORLD_W + rand() * 20, h: 30 + rand() * 55, w: 24 + rand() * 30 }));
const CITY = Array.from({ length: 40 }, () => ({ x: rand() * WORLD_W, y: HORIZON - 6 - rand() * 10, b: rand() }));
const GRAVEL = Array.from({ length: 500 }, () => ({ x: rand() * WORLD_W, y: HORIZON + 40 + rand() * (FRAME_H - HORIZON), s: rand() }));
const CLOUDS = Array.from({ length: 6 }, (_, i) => ({ x: i * 300 + rand() * 120, y: 40 + rand() * 120, w: 180 + rand() * 220, speed: 4 + rand() * 6 }));

// Pre-rendered sensor noise frames (cheap to blit, expensive to generate)
let noiseFrames: HTMLCanvasElement[] | null = null;
function getNoise(): HTMLCanvasElement[] {
  if (noiseFrames) return noiseFrames;
  noiseFrames = Array.from({ length: 6 }, () => {
    const c = document.createElement("canvas");
    c.width = 320;
    c.height = 180;
    const ctx = c.getContext("2d")!;
    const img = ctx.createImageData(c.width, c.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  });
  return noiseFrames;
}

// ── Drawing ───────────────────────────────────────────────────────────────

type Shade = ReturnType<typeof makeShade>;

function drawSky(ctx: CanvasRenderingContext2D, s: Shade, mode: FeedMode, now: number) {
  const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
  g.addColorStop(0, s(0.06, 0.05));
  g.addColorStop(1, s(0.22, 0.12));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WORLD_W, HORIZON + 2);

  if (mode !== "thermal") {
    for (const st of STARS) {
      const tw = 0.5 + 0.5 * Math.sin(now * 2 + st.tw);
      ctx.fillStyle = s(0.55 + tw * 0.4, 0, 0.5 + tw * 0.5);
      ctx.fillRect(st.x, st.y, st.r, st.r);
    }
  }

  for (const c of CLOUDS) {
    const x = ((c.x + now * c.speed) % (WORLD_W + 600)) - 300;
    const grad = ctx.createRadialGradient(x, c.y, 0, x, c.y, c.w / 2);
    grad.addColorStop(0, s(0.3, 0.16, 0.35));
    grad.addColorStop(1, s(0.3, 0.16, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, c.y, c.w / 2, c.w / 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHorizon(ctx: CanvasRenderingContext2D, s: Shade, sc: Scenario) {
  // Tree line silhouette
  ctx.fillStyle = s(0.1, 0.2);
  ctx.beginPath();
  ctx.moveTo(0, HORIZON);
  for (const t of TREES) {
    ctx.quadraticCurveTo(t.x + t.w / 2, HORIZON - t.h, t.x + t.w, HORIZON);
  }
  ctx.lineTo(WORLD_W, HORIZON + 20);
  ctx.lineTo(0, HORIZON + 20);
  ctx.fill();

  // Distant settlement lights
  for (const c of CITY) {
    ctx.fillStyle = s(0.7 + c.b * 0.3, 0.45 + c.b * 0.2);
    ctx.fillRect(c.x, c.y, 2, 2);
  }

  // Ground
  const g = ctx.createLinearGradient(0, HORIZON, 0, FRAME_H);
  g.addColorStop(0, s(0.14, 0.22));
  g.addColorStop(1, s(0.28, 0.3));
  ctx.fillStyle = g;
  ctx.fillRect(0, HORIZON + 10, WORLD_W, FRAME_H);

  // Road with vehicle
  ctx.fillStyle = s(0.2, 0.28);
  ctx.fillRect(0, HORIZON + 14, WORLD_W, 8);
  if (sc.vehicle) {
    const { x, dir } = sc.vehicle;
    ctx.fillStyle = s(0.25, 0.75);
    ctx.fillRect(x - 18, HORIZON + 8, 36, 10);
    const head = x + dir * 18;
    const beam = ctx.createRadialGradient(head, HORIZON + 14, 0, head, HORIZON + 14, 90);
    beam.addColorStop(0, s(1, 0.9, 0.9));
    beam.addColorStop(1, s(1, 0.4, 0));
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(head, HORIZON + 12);
    ctx.lineTo(head + dir * 110, HORIZON + 2);
    ctx.lineTo(head + dir * 110, HORIZON + 26);
    ctx.fill();
  }

  // Gravel compound texture
  for (const p of GRAVEL) {
    ctx.fillStyle = s(0.3 + p.s * 0.25, 0.3, 0.6);
    ctx.fillRect(p.x, p.y, 1.5, 1.5);
  }
}

function drawTower(ctx: CanvasRenderingContext2D, s: Shade, now: number) {
  const cx = 1020;
  const baseY = 430;
  const topY = 48;
  const baseHalf = 70;
  const topHalf = 12;
  const halfAt = (y: number) => lerp(baseHalf, topHalf, (baseY - y) / (baseY - topY));

  ctx.strokeStyle = s(0.62, 0.28);
  ctx.lineWidth = 2.4;
  // Legs
  ctx.beginPath();
  ctx.moveTo(cx - baseHalf, baseY);
  ctx.lineTo(cx - topHalf, topY);
  ctx.moveTo(cx + baseHalf, baseY);
  ctx.lineTo(cx + topHalf, topY);
  ctx.moveTo(cx, baseY + 6);
  ctx.lineTo(cx, topY);
  ctx.stroke();

  // Lattice bracing
  ctx.lineWidth = 1;
  ctx.strokeStyle = s(0.5, 0.24);
  const sections = 11;
  for (let i = 0; i < sections; i++) {
    const y0 = lerp(baseY, topY, i / sections);
    const y1 = lerp(baseY, topY, (i + 1) / sections);
    const h0 = halfAt(y0);
    const h1 = halfAt(y1);
    ctx.beginPath();
    ctx.moveTo(cx - h0, y0); ctx.lineTo(cx + h0, y0);
    ctx.moveTo(cx - h0, y0); ctx.lineTo(cx + h1, y1);
    ctx.moveTo(cx + h0, y0); ctx.lineTo(cx - h1, y1);
    ctx.stroke();
  }

  // Antenna platform + sector panels + microwave dishes
  ctx.fillStyle = s(0.7, 0.32);
  ctx.fillRect(cx - 34, 92, 68, 4);
  for (const dx of [-34, -12, 12, 30]) ctx.fillRect(cx + dx - 3, 62, 7, 30);
  ctx.fillRect(cx - 26, 150, 52, 3);
  for (const [dx, dy, r] of [[-26, 172, 11], [24, 196, 9]] as const) {
    ctx.beginPath();
    ctx.arc(cx + dx, dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Cable ladder
  ctx.strokeStyle = s(0.4, 0.3);
  ctx.beginPath();
  ctx.moveTo(cx + 4, baseY);
  ctx.lineTo(cx + 4, 96);
  ctx.stroke();

  // Aviation obstruction light
  const on = Math.sin(now * Math.PI) > 0;
  ctx.fillStyle = s(on ? 1 : 0.35, on ? 0.95 : 0.4);
  ctx.beginPath();
  ctx.arc(cx, topY - 4, 3.5, 0, Math.PI * 2);
  ctx.fill();
  if (on) {
    const glow = ctx.createRadialGradient(cx, topY - 4, 0, cx, topY - 4, 26);
    glow.addColorStop(0, s(1, 0.9, 0.7));
    glow.addColorStop(1, s(1, 0.9, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 26, topY - 30, 52, 52);
  }
}

function drawCompound(ctx: CanvasRenderingContext2D, s: Shade, mode: FeedMode, now: number) {
  // Floodlight pole + cone (visible modes only)
  ctx.fillStyle = s(0.45, 0.25);
  ctx.fillRect(1338, 250, 4, 210);
  ctx.fillRect(1326, 246, 22, 7);
  if (mode !== "thermal") {
    const cone = ctx.createRadialGradient(1337, 253, 0, 1337, 253, 240);
    cone.addColorStop(0, s(0.95, 0, 0.16));
    cone.addColorStop(1, s(0.7, 0, 0));
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(1328, 253);
    ctx.lineTo(1346, 253);
    ctx.lineTo(1500, 470);
    ctx.lineTo(1090, 470);
    ctx.fill();
  }

  // Equipment shelter
  ctx.fillStyle = s(0.42, 0.42);
  ctx.fillRect(1120, 360, 150, 88);
  ctx.fillStyle = s(0.55, 0.38);
  ctx.fillRect(1112, 352, 166, 10);
  ctx.fillStyle = s(0.28, 0.45);
  ctx.fillRect(1146, 384, 34, 64); // door
  ctx.fillStyle = s(0.5, 0.62);
  ctx.fillRect(1206, 380, 42, 30); // AC unit
  ctx.strokeStyle = s(0.3, 0.55);
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(1210, 384 + i * 5);
    ctx.lineTo(1244, 384 + i * 5);
    ctx.stroke();
  }

  // Diesel generator — hot
  ctx.fillStyle = s(0.38, 0.86);
  ctx.fillRect(860, 400, 96, 50);
  ctx.fillStyle = s(0.26, 0.95);
  ctx.fillRect(870, 410, 30, 26);
  ctx.fillStyle = s(0.5, 0.7);
  ctx.fillRect(938, 382, 6, 20); // exhaust
  // Exhaust plume (heat shimmer in thermal, faint smoke otherwise)
  for (let i = 0; i < 6; i++) {
    const k = ((now * 0.6 + i / 6) % 1);
    ctx.fillStyle = s(0.5, 0.8 - k * 0.5, (1 - k) * (mode === "thermal" ? 0.5 : 0.12));
    ctx.beginPath();
    ctx.arc(941 + Math.sin(now * 2 + i) * 6 * k, 380 - k * 70, 4 + k * 14, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fuel tank
  ctx.fillStyle = s(0.46, 0.3);
  ctx.beginPath();
  ctx.ellipse(780, 436, 34, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(746, 420, 68, 16);
}

function drawPerson(ctx: CanvasRenderingContext2D, s: Shade, a: Actor, vis: number) {
  const h = 92 * a.scale * (1 - a.crouch * 0.38);
  const x = a.x;
  const y = a.y;
  const swing = Math.sin(a.walkPhase) * (a.crouch > 0 ? 0 : 1);
  const col = s(vis, 0.98);
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineCap = "round";

  const hip = y - h * 0.46;
  const shoulder = y - h * 0.8;
  // Legs
  ctx.lineWidth = 7 * a.scale;
  ctx.beginPath();
  ctx.moveTo(x, hip);
  ctx.lineTo(x + swing * 12 * a.scale + a.crouch * 14 * a.facing, y);
  ctx.moveTo(x, hip);
  ctx.lineTo(x - swing * 12 * a.scale - a.crouch * 6 * a.facing, y);
  ctx.stroke();
  // Torso (leans forward when crouched)
  ctx.lineWidth = 13 * a.scale;
  ctx.beginPath();
  ctx.moveTo(x, hip);
  ctx.lineTo(x + a.crouch * 16 * a.facing, shoulder);
  ctx.stroke();
  // Arms — reaching to the fence while crouched
  ctx.lineWidth = 5 * a.scale;
  const sx = x + a.crouch * 16 * a.facing;
  ctx.beginPath();
  ctx.moveTo(sx, shoulder + 4);
  ctx.lineTo(sx - swing * 10 * a.scale + a.crouch * 26 * a.facing, shoulder + h * 0.32 - a.crouch * 10);
  ctx.stroke();
  // Head
  ctx.beginPath();
  ctx.arc(sx + a.crouch * 4 * a.facing, shoulder - 9 * a.scale, 8 * a.scale, 0, Math.PI * 2);
  ctx.fill();

  return { x: x - 22 * a.scale, y: shoulder - 20 * a.scale, w: 44 * a.scale + a.crouch * 30, h: y - shoulder + 22 * a.scale };
}

function drawFence(ctx: CanvasRenderingContext2D, s: Shade, now: number, breach: boolean) {
  const top = 410;
  const bottom = 510;
  const x0 = 620;

  // Posts
  ctx.fillStyle = s(0.55, 0.26);
  for (let x = x0; x < WORLD_W; x += 110) ctx.fillRect(x, top - 14, 5, bottom - top + 14);
  // Rails
  ctx.fillRect(x0, top, WORLD_W - x0, 3);
  ctx.fillRect(x0, bottom - 3, WORLD_W - x0, 3);

  // Chain-link mesh
  ctx.strokeStyle = s(0.5, 0.24, 0.35);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = x0 - (bottom - top); x < WORLD_W; x += 12) {
    ctx.moveTo(Math.max(x, x0), top + Math.max(0, x0 - x));
    ctx.lineTo(x + (bottom - top), bottom);
    ctx.moveTo(x + (bottom - top), top);
    ctx.lineTo(Math.max(x, x0), bottom - Math.max(0, x0 - x));
  }
  ctx.stroke();

  // Razor wire coils
  ctx.strokeStyle = s(0.62, 0.26, 0.8);
  ctx.beginPath();
  for (let x = x0; x < WORLD_W; x += 14) {
    ctx.moveTo(x + 11, top - 9);
    ctx.ellipse(x + 4, top - 9, 7, 7, 0, 0, Math.PI * 2);
  }
  ctx.stroke();

  // Breach sparks on the fence near the intruder
  if (breach) {
    for (let i = 0; i < 5; i++) {
      const k = (now * 3 + i * 0.2) % 1;
      ctx.fillStyle = s(1, 1, 1 - k);
      ctx.fillRect(632 + Math.sin(i * 9 + now * 20) * 10, 450 + k * 30, 2, 2);
    }
  }
}

export interface DetectionBox {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  hostile: boolean;
}

/** Renders one frame into ctx (sized FRAME_W × FRAME_H). Returns detections in frame space. */
export function renderFrame(ctx: CanvasRenderingContext2D, view: CameraView, nowSec: number): DetectionBox[] {
  const s = makeShade(view.mode);
  const sc = scenarioAt(nowSec);
  const breach = sc.phase === "breach";

  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, FRAME_W, FRAME_H);

  // PTZ framing with slow drift; camera shake during breach (operator zoom-in)
  const drift = Math.sin(nowSec * 0.12) * view.drift;
  const zoom = view.zoom * (breach ? 1.05 : 1);
  const shakeX = breach ? Math.sin(nowSec * 37) * 0.8 : 0;
  ctx.translate(FRAME_W / 2 + shakeX, FRAME_H / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-(view.panX + drift) - FRAME_W / 2, -FRAME_H / 2);

  drawSky(ctx, s, view.mode, nowSec);
  drawHorizon(ctx, s, sc);
  drawTower(ctx, s, nowSec);
  drawCompound(ctx, s, view.mode, nowSec);

  const boxes: Array<{ b: { x: number; y: number; w: number; h: number }; label: string; hostile: boolean }> = [];
  boxes.push({ b: drawPerson(ctx, s, sc.guard, 0.72), label: `PERSON · AUTH ${(0.9 + Math.sin(nowSec) * 0.04).toFixed(2)}`, hostile: false });
  drawFence(ctx, s, nowSec, breach);
  if (sc.intruder) {
    boxes.push({ b: drawPerson(ctx, s, sc.intruder, 0.62), label: `INTRUDER ${sc.confidence.toFixed(2)}`, hostile: true });
  }

  // Map world-space boxes to frame space using the current transform
  const m = ctx.getTransform();
  ctx.restore();

  return boxes.map(({ b, label, hostile }) => ({
    x: m.a * b.x + m.e,
    y: m.d * b.y + m.f,
    w: b.w * m.a,
    h: b.h * m.d,
    label,
    hostile,
  }));
}

/** Sensor artefacts: grain, scanlines, vignette, occasional tearing. */
export function postProcess(ctx: CanvasRenderingContext2D, mode: FeedMode, nowSec: number, frame: number) {
  const noise = getNoise();
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = mode === "night" ? 0.32 : 0.2;
  ctx.drawImage(noise[frame % noise.length], 0, 0, FRAME_W, FRAME_H);
  ctx.restore();

  // Rolling bright band (cheap analog look)
  const bandY = ((nowSec * 60) % (FRAME_H + 120)) - 60;
  const band = ctx.createLinearGradient(0, bandY - 40, 0, bandY + 40);
  band.addColorStop(0, "rgba(255,255,255,0)");
  band.addColorStop(0.5, "rgba(255,255,255,0.04)");
  band.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY - 40, FRAME_W, 80);

  // Scanlines
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  for (let y = 0; y < FRAME_H; y += 3) ctx.fillRect(0, y, FRAME_W, 1);

  // Vignette
  const v = ctx.createRadialGradient(FRAME_W / 2, FRAME_H / 2, FRAME_H * 0.35, FRAME_W / 2, FRAME_H / 2, FRAME_W * 0.65);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, FRAME_W, FRAME_H);

  // Rare horizontal tear
  if (frame % 211 < 3) {
    const y = (frame * 37) % FRAME_H;
    ctx.drawImage(ctx.canvas, 0, y, FRAME_W, 14, 12, y, FRAME_W, 14);
  }
}

export function drawDetections(ctx: CanvasRenderingContext2D, boxes: DetectionBox[], nowSec: number) {
  ctx.save();
  ctx.font = "600 12px 'JetBrains Mono', monospace";
  ctx.textBaseline = "top";
  for (const b of boxes) {
    if (b.x + b.w < 0 || b.x > FRAME_W) continue;
    const color = b.hostile ? "255,64,64" : "0,229,255";
    const pulse = b.hostile ? 0.6 + 0.4 * Math.abs(Math.sin(nowSec * 6)) : 1;
    ctx.strokeStyle = `rgba(${color},${pulse})`;
    ctx.lineWidth = 2;
    // Corner-only box
    const c = Math.min(14, b.w / 3, b.h / 3);
    ctx.beginPath();
    ctx.moveTo(b.x, b.y + c); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x + c, b.y);
    ctx.moveTo(b.x + b.w - c, b.y); ctx.lineTo(b.x + b.w, b.y); ctx.lineTo(b.x + b.w, b.y + c);
    ctx.moveTo(b.x + b.w, b.y + b.h - c); ctx.lineTo(b.x + b.w, b.y + b.h); ctx.lineTo(b.x + b.w - c, b.y + b.h);
    ctx.moveTo(b.x + c, b.y + b.h); ctx.lineTo(b.x, b.y + b.h); ctx.lineTo(b.x, b.y + b.h - c);
    ctx.stroke();
    ctx.fillStyle = `rgba(${color},0.08)`;
    ctx.fillRect(b.x, b.y, b.w, b.h);

    const tw = ctx.measureText(b.label).width + 10;
    ctx.fillStyle = `rgba(${color},0.85)`;
    ctx.fillRect(b.x, b.y - 18, tw, 16);
    ctx.fillStyle = "#04070d";
    ctx.fillText(b.label, b.x + 5, b.y - 16);
  }
  ctx.restore();
}

/** Static intrusion zone polygon (frame space for the default framing). */
export function drawZone(ctx: CanvasRenderingContext2D, view: CameraView, nowSec: number, alert: boolean) {
  const drift = Math.sin(nowSec * 0.12) * view.drift;
  const zoom = view.zoom * (alert ? 1.05 : 1);
  ctx.save();
  ctx.translate(FRAME_W / 2, FRAME_H / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-(view.panX + drift) - FRAME_W / 2, -FRAME_H / 2);
  ctx.strokeStyle = alert ? "rgba(255,64,64,0.9)" : "rgba(255,196,0,0.55)";
  ctx.fillStyle = alert ? "rgba(255,64,64,0.12)" : "rgba(255,196,0,0.05)";
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = -nowSec * 20;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(520, 520);
  ctx.lineTo(620, 400);
  ctx.lineTo(760, 400);
  ctx.lineTo(700, 530);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = "600 11px 'JetBrains Mono', monospace";
  ctx.fillStyle = alert ? "rgba(255,90,90,1)" : "rgba(255,196,0,0.85)";
  ctx.fillText("ZONE 3 · WEST FENCE", 626, 392);
  ctx.restore();
}
