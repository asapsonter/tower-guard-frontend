"""
Generate Tower_Guard_Flowchart.pdf — a multi-page architecture flowchart
for the Tower Guard Sentinel monorepo.

Run from repo root:
    source venv/bin/activate
    python docs/generate_flowchart_pdf.py

Output:
    docs/Tower_Guard_Flowchart.pdf
"""

from pathlib import Path
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white, black

# ── Colors (Tower Guard palette) ─────────────────────────────────────────────
COLORS = {
    "hardware":   HexColor("#1F2937"),   # slate-800 — physical devices
    "backend":    HexColor("#0EA5E9"),   # sky-500 — backend services
    "infra":      HexColor("#6366F1"),   # indigo-500 — Redis / Supabase
    "app_main":   HexColor("#22C55E"),   # green-500 — Tower Guard main
    "app_nscdc":  HexColor("#F59E0B"),   # amber-500 — NSCDC
    "app_ncc":    HexColor("#8B5CF6"),   # violet-500 — NCC
    "app_field":  HexColor("#EF4444"),   # red-500 — Field PWA
    "external":   HexColor("#64748B"),   # slate-500 — external integrations
    "arrow":      HexColor("#334155"),   # slate-700
    "arrow_ws":   HexColor("#0EA5E9"),   # sky-500 — WebSocket
    "arrow_rest": HexColor("#22C55E"),   # green-500 — REST
    "header":     HexColor("#0F172A"),   # slate-900 — titles
    "subtle":     HexColor("#94A3B8"),   # slate-400 — captions
    "panel":      HexColor("#F1F5F9"),   # slate-100 — page backgrounds
    "panel_dark": HexColor("#E2E8F0"),   # slate-200 — subtle panels
}

PAGE = landscape(A4)
PAGE_W, PAGE_H = PAGE


# ── Helpers ──────────────────────────────────────────────────────────────────
def draw_box(c, x, y, w, h, title, subtitle=None, fill=COLORS["backend"],
             text_color=white, font_size=10, subtitle_font_size=8, radius=6):
    """Draw a rounded rectangle with a title (and optional subtitle)."""
    c.setFillColor(fill)
    c.setStrokeColor(fill)
    c.roundRect(x, y, w, h, radius, stroke=0, fill=1)

    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", font_size)
    # Wrap title manually for long names
    lines = _wrap_text(title, w - 8 * mm, font_size, "Helvetica-Bold")
    line_height = font_size + 2
    total_height = len(lines) * line_height
    if subtitle:
        total_height += subtitle_font_size + 4

    start_y = y + h / 2 + total_height / 2 - line_height
    for i, line in enumerate(lines):
        text_w = c.stringWidth(line, "Helvetica-Bold", font_size)
        c.drawString(x + (w - text_w) / 2, start_y - i * line_height, line)

    if subtitle:
        c.setFont("Helvetica", subtitle_font_size)
        c.setFillColor(text_color)
        text_w = c.stringWidth(subtitle, "Helvetica", subtitle_font_size)
        c.drawString(
            x + (w - text_w) / 2,
            start_y - len(lines) * line_height - 2,
            subtitle,
        )


def _wrap_text(text, max_width, font_size, font_name):
    """Wrap text into multiple lines by width."""
    from reportlab.pdfbase.pdfmetrics import stringWidth
    words = text.split(" ")
    lines = []
    current = []
    for word in words:
        test = " ".join(current + [word])
        if stringWidth(test, font_name, font_size) <= max_width:
            current.append(word)
        else:
            if current:
                lines.append(" ".join(current))
            current = [word]
    if current:
        lines.append(" ".join(current))
    return lines or [text]


def draw_arrow(c, x1, y1, x2, y2, color=None, dashed=False, label=None,
               label_color=None):
    """Draw an arrow from (x1,y1) to (x2,y2) with an arrowhead."""
    if color is None:
        color = COLORS["arrow"]
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(1.2)
    if dashed:
        c.setDash(4, 3)
    else:
        c.setDash()

    c.line(x1, y1, x2, y2)

    # arrowhead
    import math
    angle = math.atan2(y2 - y1, x2 - x1)
    arrow_size = 3 * mm
    ax1 = x2 - arrow_size * math.cos(angle - math.pi / 6)
    ay1 = y2 - arrow_size * math.sin(angle - math.pi / 6)
    ax2 = x2 - arrow_size * math.cos(angle + math.pi / 6)
    ay2 = y2 - arrow_size * math.sin(angle + math.pi / 6)
    p = c.beginPath()
    p.moveTo(x2, y2)
    p.lineTo(ax1, ay1)
    p.lineTo(ax2, ay2)
    p.close()
    c.drawPath(p, fill=1, stroke=0)

    c.setDash()

    if label:
        mid_x = (x1 + x2) / 2
        mid_y = (y1 + y2) / 2
        c.setFillColor(label_color or color)
        c.setFont("Helvetica-Oblique", 7)
        tw = c.stringWidth(label, "Helvetica-Oblique", 7)
        # white background chip for readability
        padding = 2
        c.setFillColor(white)
        c.rect(mid_x - tw / 2 - padding, mid_y - 3,
               tw + padding * 2, 9, stroke=0, fill=1)
        c.setFillColor(label_color or color)
        c.drawString(mid_x - tw / 2, mid_y - 1, label)


def draw_header(c, title, subtitle=None, page_num=None, total_pages=None):
    """Draw page header."""
    c.setFillColor(COLORS["header"])
    c.setFont("Helvetica-Bold", 20)
    c.drawString(15 * mm, PAGE_H - 15 * mm, title)

    if subtitle:
        c.setFillColor(COLORS["subtle"])
        c.setFont("Helvetica", 10)
        c.drawString(15 * mm, PAGE_H - 21 * mm, subtitle)

    # Brand on right
    c.setFillColor(COLORS["subtle"])
    c.setFont("Helvetica", 8)
    brand = "Tower Guard Sentinel — Architecture Flowchart"
    tw = c.stringWidth(brand, "Helvetica", 8)
    c.drawString(PAGE_W - 15 * mm - tw, PAGE_H - 10 * mm, brand)

    if page_num and total_pages:
        page_text = f"Page {page_num} of {total_pages}"
        tw = c.stringWidth(page_text, "Helvetica", 8)
        c.drawString(PAGE_W - 15 * mm - tw, PAGE_H - 15 * mm, page_text)


def draw_footer(c, note=None):
    c.setFillColor(COLORS["subtle"])
    c.setFont("Helvetica", 7)
    c.drawString(15 * mm, 8 * mm,
                 "Generated from backend/axpro.py, backend/routes.py, "
                 "backend/websocket.py, packages/hooks/src/useSimulation.ts")
    if note:
        c.setFont("Helvetica-Oblique", 7)
        tw = c.stringWidth(note, "Helvetica-Oblique", 7)
        c.drawString(PAGE_W - 15 * mm - tw, 8 * mm, note)


def draw_legend(c, items, x, y):
    """Draw a color legend.

    items: list of (color, label).
    """
    c.setFont("Helvetica", 8)
    swatch = 4 * mm
    for color, label in items:
        c.setFillColor(color)
        c.roundRect(x, y - swatch / 2, swatch, swatch, 1, stroke=0, fill=1)
        c.setFillColor(COLORS["header"])
        c.drawString(x + swatch + 2 * mm, y - 1.5, label)
        y -= 6 * mm


# ── Page 1 — Title ───────────────────────────────────────────────────────────
def page_title(c):
    c.setFillColor(COLORS["panel"])
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)

    # Big title
    c.setFillColor(COLORS["header"])
    c.setFont("Helvetica-Bold", 36)
    title = "Tower Guard Sentinel"
    tw = c.stringWidth(title, "Helvetica-Bold", 36)
    c.drawString((PAGE_W - tw) / 2, PAGE_H / 2 + 25 * mm, title)

    c.setFillColor(COLORS["backend"])
    c.setFont("Helvetica-Bold", 18)
    subtitle = "Architecture Flowchart"
    tw = c.stringWidth(subtitle, "Helvetica-Bold", 18)
    c.drawString((PAGE_W - tw) / 2, PAGE_H / 2 + 13 * mm, subtitle)

    c.setFillColor(COLORS["subtle"])
    c.setFont("Helvetica", 11)
    tagline = (
        "Telecom mast security platform for Nigeria — Bun + Turborepo monorepo"
    )
    tw = c.stringWidth(tagline, "Helvetica", 11)
    c.drawString((PAGE_W - tw) / 2, PAGE_H / 2 + 5 * mm, tagline)

    # 4-app strip
    strip_y = PAGE_H / 2 - 25 * mm
    strip_w = 50 * mm
    strip_h = 22 * mm
    gap = 5 * mm
    total_w = strip_w * 4 + gap * 3
    start_x = (PAGE_W - total_w) / 2

    apps = [
        ("Tower Guard",    ":5173 · telecom_admin",   COLORS["app_main"]),
        ("NSCDC Station",  ":5174 · nscdc_command",   COLORS["app_nscdc"]),
        ("NCC Monitoring", ":5175 · ncc_regulator",   COLORS["app_ncc"]),
        ("Field App PWA",  ":5176 · nscdc_responder", COLORS["app_field"]),
    ]
    for i, (name, meta, color) in enumerate(apps):
        x = start_x + i * (strip_w + gap)
        draw_box(c, x, strip_y, strip_w, strip_h, name, meta,
                 fill=color, font_size=11, subtitle_font_size=8)

    # TOC
    toc_y = PAGE_H / 2 - 50 * mm
    c.setFillColor(COLORS["header"])
    c.setFont("Helvetica-Bold", 12)
    c.drawString(PAGE_W / 2 - 60 * mm, toc_y, "Contents")

    items = [
        "1. System Architecture — hardware, backend, frontend",
        "2. AX Pro Sensor Data Flow — panel to UI",
        "3. Dispatch Flow — Tower Guard to NSCDC to Field",
        "4. Authentication & Authorization — 3 layers of defense",
        "5. Deployment Topology — dev and production",
    ]
    c.setFont("Helvetica", 10)
    c.setFillColor(COLORS["header"])
    for i, item in enumerate(items):
        c.drawString(PAGE_W / 2 - 60 * mm, toc_y - 8 * mm - i * 6 * mm, item)

    c.setFillColor(COLORS["subtle"])
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(15 * mm, 15 * mm,
                 "Pair this document with README.md and NAMING_CONVENTIONS.md "
                 "for a complete handover.")
    c.setFont("Helvetica", 8)
    c.drawString(15 * mm, 10 * mm, "© Seismic Consulting Group — Internal")


# ── Page 2 — System Architecture ─────────────────────────────────────────────
def page_system_architecture(c, page_num, total_pages):
    draw_header(c, "1. System Architecture",
                "Four React apps share one FastAPI backend, one Supabase database, "
                "and hardware integrations.",
                page_num, total_pages)

    # Hardware row (top)
    hw_y = PAGE_H - 55 * mm
    hw_w = 38 * mm
    hw_h = 18 * mm
    hw_gap = 6 * mm
    hw_items = [
        ("HikVision AX Pro",   "alarm panel (LAN)"),
        ("IP Cameras",         "RTSP · HTTP snapshot"),
        ("NVIDIA DeepStream",  "AI inference (optional)"),
        ("Twilio",             "SMS outbound"),
    ]
    total_hw_w = hw_w * len(hw_items) + hw_gap * (len(hw_items) - 1)
    start_x = (PAGE_W - total_hw_w) / 2
    hw_boxes = []
    for i, (name, meta) in enumerate(hw_items):
        x = start_x + i * (hw_w + hw_gap)
        draw_box(c, x, hw_y, hw_w, hw_h, name, meta,
                 fill=COLORS["hardware"], font_size=9)
        hw_boxes.append((x + hw_w / 2, hw_y))

    # Backend (middle, single wide box)
    be_w = 170 * mm
    be_h = 32 * mm
    be_x = (PAGE_W - be_w) / 2
    be_y = hw_y - 45 * mm
    draw_box(c, be_x, be_y, be_w, be_h,
             "FastAPI Backend  —  main.py  (port 5050)",
             "Routes · WebSocket · JWT auth · Redis pub/sub · Supabase client · "
             "AX Pro polling loop",
             fill=COLORS["backend"], font_size=12, subtitle_font_size=8)

    # Arrows from hardware → backend
    for (hx, hy) in hw_boxes:
        draw_arrow(c, hx, hy, hx, be_y + be_h, color=COLORS["hardware"])

    # Infra row (below backend): Redis + Supabase
    infra_w = 65 * mm
    infra_h = 20 * mm
    infra_y = be_y - 30 * mm
    redis_x = PAGE_W / 2 - infra_w - 10 * mm
    supa_x = PAGE_W / 2 + 10 * mm
    draw_box(c, redis_x, infra_y, infra_w, infra_h,
             "Redis", "pub/sub · rate limit · frame cache",
             fill=COLORS["infra"], font_size=11, subtitle_font_size=8)
    draw_box(c, supa_x, infra_y, infra_w, infra_h,
             "Supabase",
             "Postgres · Storage · Realtime · RLS",
             fill=COLORS["infra"], font_size=11, subtitle_font_size=8)

    # Backend ↔ infra arrows (bidirectional)
    draw_arrow(c, redis_x + infra_w / 2, infra_y + infra_h,
               redis_x + infra_w / 2, be_y, color=COLORS["infra"], dashed=True)
    draw_arrow(c, redis_x + infra_w / 2, be_y,
               redis_x + infra_w / 2, infra_y + infra_h,
               color=COLORS["infra"], dashed=True)
    draw_arrow(c, supa_x + infra_w / 2, infra_y + infra_h,
               supa_x + infra_w / 2, be_y, color=COLORS["infra"], dashed=True)
    draw_arrow(c, supa_x + infra_w / 2, be_y,
               supa_x + infra_w / 2, infra_y + infra_h,
               color=COLORS["infra"], dashed=True)

    # Apps row (bottom)
    apps = [
        ("Tower Guard Site",   ":5173 · telecom_admin",     COLORS["app_main"]),
        ("NSCDC Station",      ":5174 · nscdc_command",     COLORS["app_nscdc"]),
        ("NCC Monitoring",     ":5175 · ncc_regulator",     COLORS["app_ncc"]),
        ("Field App (PWA)",    ":5176 · nscdc_responder",   COLORS["app_field"]),
    ]
    app_w = 42 * mm
    app_h = 22 * mm
    app_gap = 6 * mm
    total_app_w = app_w * len(apps) + app_gap * (len(apps) - 1)
    app_start_x = (PAGE_W - total_app_w) / 2
    app_y = infra_y - 40 * mm
    app_centers = []
    for i, (name, meta, color) in enumerate(apps):
        x = app_start_x + i * (app_w + app_gap)
        draw_box(c, x, app_y, app_w, app_h, name, meta,
                 fill=color, font_size=10, subtitle_font_size=7.5)
        app_centers.append(x + app_w / 2)

    # Backend → apps arrows (REST + WS)
    for cx in app_centers:
        draw_arrow(c, cx, app_y + app_h, cx, be_y, color=COLORS["arrow_rest"])

    # Labels for arrow channels
    c.setFillColor(COLORS["subtle"])
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(15 * mm, be_y + be_h / 2 - 2,
                 "REST  /api/*   ·   WebSocket  /ws/alerts")

    # Legend
    draw_legend(c, [
        (COLORS["hardware"], "Hardware / external"),
        (COLORS["backend"],  "FastAPI backend"),
        (COLORS["infra"],    "Infrastructure"),
        (COLORS["app_main"], "Frontend apps"),
    ], x=15 * mm, y=35 * mm)

    draw_footer(c, "See README §3 for detailed component list.")


# ── Page 3 — AX Pro sensor data flow ─────────────────────────────────────────
def page_sensor_flow(c, page_num, total_pages):
    draw_header(c, "2. AX Pro Sensor Data Flow",
                "How a zone trigger on the alarm panel reaches a user's screen.",
                page_num, total_pages)

    # Vertical stack of stages
    stages = [
        ("HikVision AX Pro panel",
         "Physical zones: Vibration · PIR · Camera 1 · Camera 2",
         COLORS["hardware"]),
        ("hikaxpro library",
         "Synchronous HTTP client — zone_status() · host_status() · siren_status()",
         COLORS["hardware"]),
        ("asyncio.to_thread()",
         "Offload blocking hardware calls to thread pool",
         COLORS["backend"]),
        ("backend/axpro.py — axpro_polling_loop",
         "2s poll · diffs state · emits zone_alarm · tamper_alarm · siren_alarm · system_status",
         COLORS["backend"]),
        ("broadcast_alert() → Redis channel 'alerts'",
         "Async publish with JSON payload",
         COLORS["infra"]),
        ("redis_subscriber() task",
         "Subscribes to channel and forwards to active_websockets list",
         COLORS["infra"]),
        ("WebSocket /ws/alerts",
         "Fan-out to all connected clients (NO AUTH — see README §16 BUG-2)",
         COLORS["backend"]),
        ("packages/api-client · connectWebSocket()",
         "ws://<host>/ws/alerts · exponential reconnect backoff 3s → 30s",
         COLORS["app_main"]),
        ("packages/hooks · useSimulation",
         "Discriminated union on payload.type · updates Alerts, Sensors, Events state",
         COLORS["app_main"]),
        ("React UI",
         "SensorStatusPanel · RealTimeAlerts · EventLogTable · playAlertSound()",
         COLORS["app_main"]),
    ]

    # Layout: stages stacked vertically, callout to the LEFT (uses dead space)
    box_w = 150 * mm
    box_h = 11 * mm
    gap = 3 * mm
    start_x = PAGE_W - box_w - 25 * mm     # stages on the right
    start_y = PAGE_H - 40 * mm - box_h

    for i, (title, subtitle, color) in enumerate(stages):
        y = start_y - i * (box_h + gap)
        draw_box(c, start_x, y, box_w, box_h, title, subtitle,
                 fill=color, font_size=9.5, subtitle_font_size=7, radius=4)
        if i < len(stages) - 1:
            draw_arrow(c,
                       start_x + box_w / 2, y,
                       start_x + box_w / 2, y - gap,
                       color=COLORS["arrow"])

    # Side callout (bugs) on the LEFT — fills the dead space, no overlap
    callout_w = 95 * mm
    callout_h = 90 * mm
    callout_x = 18 * mm
    callout_y = (PAGE_H - 40 * mm) - callout_h - 30 * mm
    c.setFillColor(HexColor("#FEF3C7"))  # yellow-100
    c.roundRect(callout_x, callout_y, callout_w, callout_h, 4,
                stroke=0, fill=1)

    c.setFillColor(HexColor("#92400E"))
    c.setFont("Helvetica-Bold", 11)
    c.drawString(callout_x + 5 * mm, callout_y + callout_h - 8 * mm,
                 "Known bugs in this flow")
    c.setFillColor(HexColor("#92400E"))
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(callout_x + 5 * mm, callout_y + callout_h - 13 * mm,
                 "see README §16 for fixes")

    bugs = [
        ("BUG-1", "stale axpro_client reference in routes.py"),
        ("BUG-4", "redis_subscriber never restarts after Redis drop"),
        ("BUG-5", "polling loop calls have no timeout"),
        ("BUG-6", "siren_alarm produced but unhandled in useSimulation"),
        ("BUG-7", "non-connection errors log-spam forever"),
        ("BUG-9", "active_websockets list has no lock"),
    ]
    by = callout_y + callout_h - 22 * mm
    c.setFillColor(HexColor("#78350F"))
    for code, text in bugs:
        c.setFont("Helvetica-Bold", 8)
        c.drawString(callout_x + 5 * mm, by, code)
        c.setFont("Helvetica", 8)
        # wrap if needed
        for j, line in enumerate(_wrap_text(text, callout_w - 25 * mm,
                                             8, "Helvetica")):
            c.drawString(callout_x + 18 * mm, by - j * 4 * mm, line)
        by -= 11 * mm

    draw_footer(c, "Producer: backend/axpro.py   Consumer: packages/hooks/src/useSimulation.ts")


# ── Page 4 — Dispatch flow ───────────────────────────────────────────────────
def page_dispatch_flow(c, page_num, total_pages):
    draw_header(c, "3. Dispatch Flow — Uber-style",
                "Tower Guard requests · NSCDC Command coordinates · Field App responds · NCC observes.",
                page_num, total_pages)

    y_mid = PAGE_H / 2 + 5 * mm

    # Four lanes (one per app) — swim-lane style
    lane_w = 48 * mm
    lane_h = 110 * mm
    lane_gap = 4 * mm
    total_lanes_w = lane_w * 4 + lane_gap * 3
    start_x = (PAGE_W - total_lanes_w) / 2
    lane_top = PAGE_H - 35 * mm

    lanes = [
        ("Tower Guard\n(telecom_admin)",   COLORS["app_main"]),
        ("NSCDC Command\n(nscdc_command)", COLORS["app_nscdc"]),
        ("Field App\n(nscdc_responder)",   COLORS["app_field"]),
        ("NCC Dashboard\n(ncc_regulator)", COLORS["app_ncc"]),
    ]

    # Lane headers
    lane_xs = []
    for i, (name, color) in enumerate(lanes):
        x = start_x + i * (lane_w + lane_gap)
        lane_xs.append(x)
        # lane background
        c.setFillColor(HexColor("#F8FAFC"))
        c.roundRect(x, lane_top - lane_h, lane_w, lane_h, 4,
                    stroke=0, fill=1)
        # lane header
        draw_box(c, x, lane_top - 12 * mm, lane_w, 12 * mm,
                 name.replace("\n", " "), None, fill=color,
                 font_size=10)

    # Event rows (each event sits in a specific lane at a given y)
    # Each event: (lane_index, title, subtitle)
    events = [
        (0, "1. Intruder detected",
         "AI / manual trigger · POST /api/dispatch"),
        (1, "2. Assignment created",
         "INSERT dispatch_assignments · status=PENDING"),
        (1, "3. Officers notified",
         "Supabase Realtime · Twilio SMS"),
        (2, "4. Alert received",
         "PWA push notification · SLA clock starts"),
        (2, "5. Accept / Reject",
         "One-tap response · escalates if no answer"),
        (2, "6. EN_ROUTE + GPS",
         "Background location stream to command"),
        (1, "7. Live tracking",
         "Map view · responder status board"),
        (2, "8. ON_SITE",
         "Evidence: photos, voice, short clips uploaded"),
        (1, "9. Evidence review",
         "Gallery · comms monitor · SLA timer"),
        (2, "10. RESOLVED",
         "INSERT response_sla_logs · tier = Optimal|Warning|Critical"),
        (3, "11. Compliance metrics",
         "Read-only analytics · export PDF/CSV"),
    ]

    step_h = 8.5 * mm
    step_gap = 0.5 * mm
    step_start_y = lane_top - 14 * mm - step_h

    prev_center = None
    for step_idx, (lane_idx, title, subtitle) in enumerate(events):
        lx = lane_xs[lane_idx]
        by = step_start_y - step_idx * (step_h + step_gap)
        # Slight horizontal stagger when two consecutive events sit in the
        # same lane so the second box does not visually merge with the first.
        if (step_idx > 0 and events[step_idx - 1][0] == lane_idx):
            # already vertical — fine
            pass
        # Light inner box
        c.setFillColor(white)
        c.setStrokeColor(lanes[lane_idx][1])
        c.setLineWidth(0.8)
        c.roundRect(lx + 2 * mm, by, lane_w - 4 * mm, step_h, 2,
                    stroke=1, fill=1)
        c.setFillColor(COLORS["header"])
        c.setFont("Helvetica-Bold", 8)
        c.drawString(lx + 4 * mm, by + step_h - 4 * mm, title)
        c.setFillColor(COLORS["subtle"])
        c.setFont("Helvetica", 6.5)
        c.drawString(lx + 4 * mm, by + 1.5 * mm, subtitle)

        center = (lx + lane_w / 2, by + step_h / 2)
        if prev_center is not None:
            draw_arrow(c, prev_center[0], prev_center[1] - step_h / 2 - 1,
                       center[0], center[1] + step_h / 2 + 1,
                       color=COLORS["arrow"])
        prev_center = center

    # Uber analogy box at bottom
    box_y = 15 * mm
    box_w = 260 * mm
    box_h = 22 * mm
    box_x = (PAGE_W - box_w) / 2
    c.setFillColor(COLORS["panel_dark"])
    c.roundRect(box_x, box_y, box_w, box_h, 4, stroke=0, fill=1)
    c.setFillColor(COLORS["header"])
    c.setFont("Helvetica-Bold", 10)
    c.drawString(box_x + 4 * mm, box_y + box_h - 6 * mm,
                 "Uber analogy")
    c.setFont("Helvetica", 8)
    c.drawString(
        box_x + 4 * mm, box_y + box_h - 12 * mm,
        "Tower Guard = rider   ·   Field App = driver   ·   NSCDC Station = Uber HQ   ·   "
        "NCC = transport regulator"
    )
    c.drawString(
        box_x + 4 * mm, box_y + box_h - 17 * mm,
        "SLA tiers: Optimal (<10m)   ·   Warning (10–20m)   ·   Critical (>20m)"
    )

    draw_footer(c, "See Tower_Guard_Architecture.md §6 for full sequence diagrams.")


# ── Page 5 — Auth flow ───────────────────────────────────────────────────────
def page_auth_flow(c, page_num, total_pages):
    draw_header(c, "4. Authentication & Authorization",
                "Three layers of defense · all three must pass.",
                page_num, total_pages)

    # Auth login flow (top half)
    top_y = PAGE_H - 45 * mm
    stage_w = 40 * mm
    stage_h = 18 * mm
    stage_gap = 12 * mm

    stages = [
        ("User",                 "browser / PWA",              COLORS["external"]),
        ("Login form",           "apps/*/pages/Login.tsx",     COLORS["app_main"]),
        ("POST /api/auth/login", "backend/auth.py",            COLORS["backend"]),
        ("DEMO_USERS lookup",    "backend/config.py",          COLORS["backend"]),
        ("JWT issued (HS256)",   "SECRET_KEY · app_role claim", COLORS["infra"]),
        ("localStorage",         "stored by useAuth hook",     COLORS["app_main"]),
    ]
    total_w = stage_w * len(stages) + stage_gap * (len(stages) - 1)
    start_x = (PAGE_W - total_w) / 2
    centers = []
    for i, (name, meta, color) in enumerate(stages):
        x = start_x + i * (stage_w + stage_gap)
        draw_box(c, x, top_y, stage_w, stage_h, name, meta,
                 fill=color, font_size=9, subtitle_font_size=7)
        centers.append((x, x + stage_w, top_y + stage_h / 2))

    for i in range(len(centers) - 1):
        draw_arrow(c, centers[i][1], centers[i][2],
                   centers[i + 1][0], centers[i + 1][2],
                   color=COLORS["arrow"])

    # Section divider
    c.setStrokeColor(COLORS["panel_dark"])
    c.setLineWidth(0.5)
    c.line(15 * mm, top_y - 10 * mm, PAGE_W - 15 * mm, top_y - 10 * mm)

    # Defense in depth — three layers
    c.setFillColor(COLORS["header"])
    c.setFont("Helvetica-Bold", 13)
    c.drawString(15 * mm, top_y - 18 * mm,
                 "Defense in depth — every request passes through three gates")

    layers = [
        ("Layer 1 — Frontend",
         "useRoleGuard (packages/hooks)",
         "Redirects users with the wrong role away from the wrong app. Client-side only — "
         "a bypass here still hits Layer 2.",
         COLORS["app_main"]),
        ("Layer 2 — Backend",
         "Depends(get_current_user) · require_role([...])",
         "Validates JWT signature and expiry. Checks app_role claim against endpoint's "
         "allowed roles. Rejects with 401/403 before the handler runs.",
         COLORS["backend"]),
        ("Layer 3 — Database",
         "Supabase Row Level Security (RLS)",
         "Policies in supabase/migrations/ reject reads/writes at the row level. Even if "
         "Layers 1 and 2 are bypassed, the DB refuses the query.",
         COLORS["infra"]),
    ]

    layer_w = 85 * mm
    layer_h = 70 * mm
    layer_gap = 6 * mm
    total_lw = layer_w * 3 + layer_gap * 2
    lstart_x = (PAGE_W - total_lw) / 2
    ly = top_y - 22 * mm - layer_h     # right under the divider

    for i, (title, sub, body, color) in enumerate(layers):
        x = lstart_x + i * (layer_w + layer_gap)
        # Header strip
        c.setFillColor(color)
        c.roundRect(x, ly + layer_h - 16 * mm, layer_w, 16 * mm, 4,
                    stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(x + 4 * mm, ly + layer_h - 8 * mm, title)
        c.setFont("Helvetica", 8)
        c.drawString(x + 4 * mm, ly + layer_h - 13 * mm, sub)

        # Body panel
        c.setFillColor(COLORS["panel"])
        c.roundRect(x, ly, layer_w, layer_h - 16 * mm, 4, stroke=0, fill=1)
        c.setFillColor(COLORS["header"])
        c.setFont("Helvetica", 8.5)
        # wrap body
        body_lines = _wrap_text(body, layer_w - 8 * mm, 8.5, "Helvetica")
        for j, line in enumerate(body_lines):
            c.drawString(x + 4 * mm,
                         ly + layer_h - 22 * mm - j * 10, line)

    # Roles table — anchored to the bottom with proper spacing from layer cards
    roles_y = 38 * mm
    c.setFillColor(COLORS["header"])
    c.setFont("Helvetica-Bold", 11)
    c.drawString(15 * mm, roles_y,
                 "Roles  (packages/data/src/types/app-role.ts)")

    role_rows = [
        ("telecom_admin",    "Tower Guard Site Dashboard",  "Full CRUD on masts, alerts, dispatch"),
        ("nscdc_command",    "NSCDC Station Dashboard",     "Manage assignments · view comms"),
        ("nscdc_responder",  "Field App PWA",               "Accept/reject · upload evidence"),
        ("ncc_regulator",    "NCC Monitoring Dashboard",    "Read-only analytics · export reports"),
    ]
    # column header
    c.setFillColor(COLORS["subtle"])
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(15 * mm,  roles_y - 5 * mm, "ROLE")
    c.drawString(70 * mm,  roles_y - 5 * mm, "DASHBOARD")
    c.drawString(155 * mm, roles_y - 5 * mm, "SCOPE")
    for i, (role, dashboard, scope) in enumerate(role_rows):
        y = roles_y - 11 * mm - i * 5 * mm
        c.setFillColor(COLORS["header"])
        c.setFont("Helvetica-Bold", 9)
        c.drawString(15 * mm, y, role)
        c.setFont("Helvetica", 9)
        c.drawString(70 * mm, y, dashboard)
        c.drawString(155 * mm, y, scope)

    draw_footer(c, "See README §10 for demo logins and JWT lifecycle.")


# ── Page 6 — Deployment topology ─────────────────────────────────────────────
def page_deployment(c, page_num, total_pages):
    draw_header(c, "5. Deployment Topology",
                "Dev and production layouts. Each frontend app ships as its own artifact.",
                page_num, total_pages)

    # Dev side (left) / Prod side (right)
    divider_x = PAGE_W / 2
    c.setStrokeColor(COLORS["panel_dark"])
    c.setLineWidth(0.5)
    c.setDash(3, 3)
    c.line(divider_x, 20 * mm, divider_x, PAGE_H - 40 * mm)
    c.setDash()

    # Dev header
    c.setFillColor(COLORS["header"])
    c.setFont("Helvetica-Bold", 14)
    c.drawString(25 * mm, PAGE_H - 35 * mm, "Development (localhost)")
    c.setFillColor(COLORS["subtle"])
    c.setFont("Helvetica", 9)
    c.drawString(25 * mm, PAGE_H - 41 * mm,
                 "Single machine · Redis via Homebrew · Supabase cloud")

    # Dev layout
    dev_apps = [
        (":5173 · dashboard-main",  COLORS["app_main"]),
        (":5174 · dashboard-nscdc", COLORS["app_nscdc"]),
        (":5175 · dashboard-ncc",   COLORS["app_ncc"]),
        (":5176 · app-field (PWA)", COLORS["app_field"]),
    ]
    y0 = PAGE_H - 55 * mm
    for i, (name, color) in enumerate(dev_apps):
        draw_box(c, 25 * mm, y0 - i * 14 * mm, 95 * mm, 10 * mm,
                 name, None, fill=color, font_size=9, radius=3)

    # Dev backend + infra
    dev_be_y = y0 - 4 * 14 * mm - 10 * mm
    draw_box(c, 25 * mm, dev_be_y, 95 * mm, 14 * mm,
             ":5050 · uvicorn main:app --reload",
             "Single process · no replicas",
             fill=COLORS["backend"], font_size=9, subtitle_font_size=7.5)
    draw_box(c, 25 * mm, dev_be_y - 18 * mm, 45 * mm, 12 * mm,
             "Redis (brew)", "localhost:6379",
             fill=COLORS["infra"], font_size=9, subtitle_font_size=7)
    draw_box(c, 75 * mm, dev_be_y - 18 * mm, 45 * mm, 12 * mm,
             "Supabase cloud", "free tier OK",
             fill=COLORS["infra"], font_size=9, subtitle_font_size=7)

    # Arrows
    for i in range(4):
        draw_arrow(c, 120 * mm, y0 - i * 14 * mm + 5 * mm,
                   25 * mm + 95 * mm, dev_be_y + 14 * mm,
                   color=COLORS["arrow"], dashed=True)

    # Prod header
    c.setFillColor(COLORS["header"])
    c.setFont("Helvetica-Bold", 14)
    c.drawString(divider_x + 10 * mm, PAGE_H - 35 * mm, "Production")
    c.setFillColor(COLORS["subtle"])
    c.setFont("Helvetica", 9)
    c.drawString(divider_x + 10 * mm, PAGE_H - 41 * mm,
                 "Each app on its own subdomain · backend + Redis on VPS · Supabase cloud")

    prod_apps = [
        ("app.towerguard.ng",    "Vercel / Netlify — dashboard-main",  COLORS["app_main"]),
        ("nscdc.towerguard.ng",  "Vercel / Netlify — dashboard-nscdc", COLORS["app_nscdc"]),
        ("ncc.towerguard.ng",    "Vercel / Netlify — dashboard-ncc",   COLORS["app_ncc"]),
        ("field.towerguard.ng",  "Vercel (PWA) — app-field",           COLORS["app_field"]),
    ]
    for i, (host, meta, color) in enumerate(prod_apps):
        draw_box(c, divider_x + 10 * mm, y0 - i * 14 * mm, 130 * mm, 10 * mm,
                 host, meta, fill=color, font_size=9,
                 subtitle_font_size=7, radius=3)

    # Prod backend
    draw_box(c, divider_x + 10 * mm, dev_be_y, 130 * mm, 14 * mm,
             "api.towerguard.ng  ·  uvicorn  (VPS / Railway / Render)",
             "workers=1 — polling loop is not multi-process safe (see README §15.2)",
             fill=COLORS["backend"], font_size=9, subtitle_font_size=7.5)
    draw_box(c, divider_x + 10 * mm, dev_be_y - 18 * mm, 62 * mm, 12 * mm,
             "Redis (managed)", "Upstash / ElastiCache",
             fill=COLORS["infra"], font_size=9, subtitle_font_size=7)
    draw_box(c, divider_x + 77 * mm, dev_be_y - 18 * mm, 63 * mm, 12 * mm,
             "Supabase cloud", "Postgres · Storage · Realtime",
             fill=COLORS["infra"], font_size=9, subtitle_font_size=7)

    # Edge / on-site equipment callout
    edge_y = 18 * mm
    edge_w = 260 * mm
    edge_h = 26 * mm
    edge_x = (PAGE_W - edge_w) / 2
    c.setFillColor(HexColor("#F0FDF4"))  # green-50
    c.roundRect(edge_x, edge_y, edge_w, edge_h, 4, stroke=0, fill=1)
    c.setFillColor(COLORS["header"])
    c.setFont("Helvetica-Bold", 11)
    c.drawString(edge_x + 4 * mm, edge_y + edge_h - 6 * mm,
                 "Edge / on-site equipment  (per mast)")
    c.setFont("Helvetica", 8.5)
    c.drawString(
        edge_x + 4 * mm, edge_y + edge_h - 12 * mm,
        "HikVision AX Pro alarm panel   ·   IP cameras (RTSP)   ·   "
        "Vibration / PIR / door sensors   ·   Optional NVIDIA Jetson for DeepStream AI"
    )
    c.drawString(
        edge_x + 4 * mm, edge_y + edge_h - 17 * mm,
        "LAN → VPN → backend.  Polling loop runs server-side; edge devices do not "
        "need public internet."
    )
    c.drawString(
        edge_x + 4 * mm, edge_y + edge_h - 22 * mm,
        "Generator fuel · battery charge · solar output are surfaced as energy "
        "telemetry when wired."
    )

    draw_footer(c, "See README §15 for deployment steps and cut-over procedures.")


# ── Entry point ──────────────────────────────────────────────────────────────
def main():
    out_dir = Path(__file__).parent
    out_path = out_dir / "Tower_Guard_Flowchart.pdf"

    c = canvas.Canvas(str(out_path), pagesize=PAGE)
    c.setTitle("Tower Guard Sentinel — Architecture Flowchart")
    c.setAuthor("Seismic Consulting Group")
    c.setSubject("Handover documentation · architecture flowchart")
    c.setCreator("docs/generate_flowchart_pdf.py")

    total_pages = 6

    page_title(c)
    c.showPage()

    page_system_architecture(c, 2, total_pages)
    c.showPage()

    page_sensor_flow(c, 3, total_pages)
    c.showPage()

    page_dispatch_flow(c, 4, total_pages)
    c.showPage()

    page_auth_flow(c, 5, total_pages)
    c.showPage()

    page_deployment(c, 6, total_pages)
    c.showPage()

    c.save()
    print(f"wrote {out_path}  ({out_path.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
