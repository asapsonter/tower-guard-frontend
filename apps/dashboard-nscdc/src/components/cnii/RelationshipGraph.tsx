import { useMemo, useState } from "react";
import type { GraphEdge, GraphNode, GraphNodeKind } from "@/lib/cnii";
import { GRAPH_KIND_COLOR } from "@/lib/cnii";

interface RelationshipGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  height?: number;
  selectedId?: string | null;
  onSelect?: (node: GraphNode | null) => void;
  /** Hide edges below this confidence */
  minConfidence?: number;
}

const W = 900;

/**
 * Force-directed relationship graph (SVG). Layout is computed once per input
 * with a small deterministic simulation — fine for the ≤150 nodes we show.
 * Edge opacity encodes confidence; dashed edges are below 0.7.
 */
export function RelationshipGraph({ nodes, edges, height = 520, selectedId, onSelect, minConfidence = 0 }: RelationshipGraphProps) {
  const [hover, setHover] = useState<string | null>(null);
  const shown = useMemo(() => edges.filter((e) => e.confidence >= minConfidence && nodes.some((n) => n.id === e.from) && nodes.some((n) => n.id === e.to)), [edges, nodes, minConfidence]);
  const pos = useMemo(() => layout(nodes, shown, W, height), [nodes, shown, height]);
  const focus = hover ?? selectedId ?? null;
  const neighbours = useMemo(() => {
    if (!focus) return null;
    const s = new Set<string>([focus]);
    shown.forEach((e) => { if (e.from === focus) s.add(e.to); if (e.to === focus) s.add(e.from); });
    return s;
  }, [focus, shown]);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full h-auto select-none" onClick={() => onSelect?.(null)}>
        {shown.map((e, i) => {
          const a = pos.get(e.from)!; const b = pos.get(e.to)!;
          const active = !neighbours || (neighbours.has(e.from) && neighbours.has(e.to));
          return (
            <g key={i} opacity={active ? 1 : 0.12}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="hsl(var(--primary))" strokeOpacity={0.25 + e.confidence * 0.6} strokeWidth={1 + e.confidence * 1.5} strokeDasharray={e.confidence < 0.7 ? "5 4" : undefined} />
              {focus && active && (
                <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 3} textAnchor="middle" fontSize={9} fill="hsl(var(--muted-foreground))">
                  {e.relation} · {Math.round(e.confidence * 100)}%
                </text>
              )}
            </g>
          );
        })}
        {nodes.map((n) => {
          const p = pos.get(n.id)!;
          const c = GRAPH_KIND_COLOR[n.kind];
          const active = !neighbours || neighbours.has(n.id);
          const sel = n.id === selectedId;
          return (
            <g key={n.id} transform={`translate(${p.x},${p.y})`} opacity={active ? 1 : 0.2} className="cursor-pointer"
              onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)}
              onClick={(ev) => { ev.stopPropagation(); onSelect?.(n); }}>
              <circle r={sel ? 13 : 9} fill={`${c}33`} stroke={c} strokeWidth={sel ? 3 : 2} style={{ filter: `drop-shadow(0 0 6px ${c})` }} />
              <text x={13} y={4} fontSize={10.5} fill="hsl(var(--foreground))" style={{ paintOrder: "stroke", stroke: "hsl(var(--background))", strokeWidth: 3 }}>
                {n.label.length > 34 ? `${n.label.slice(0, 33)}…` : n.label}
              </text>
            </g>
          );
        })}
      </svg>
      <GraphLegend kinds={[...new Set(nodes.map((n) => n.kind))]} />
    </div>
  );
}

export function GraphLegend({ kinds }: { kinds: GraphNodeKind[] }) {
  return (
    <div className="flex flex-wrap gap-3 px-1 pt-2">
      {kinds.map((k) => (
        <span key={k} className="flex items-center gap-1.5 text-[10px] text-muted-foreground capitalize">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: GRAPH_KIND_COLOR[k] }} /> {k}
        </span>
      ))}
      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-5 border-t border-dashed border-primary" /> confidence &lt; 70%</span>
    </div>
  );
}

function layout(nodes: GraphNode[], edges: GraphEdge[], w: number, h: number) {
  // Deterministic seed positions on a circle, then spring/repulsion iterations
  const p = new Map(nodes.map((n, i) => {
    const a = (i / Math.max(1, nodes.length)) * Math.PI * 2;
    return [n.id, { x: w / 2 + Math.cos(a) * w * 0.3, y: h / 2 + Math.sin(a) * h * 0.32, vx: 0, vy: 0 }];
  }));
  const ideal = Math.min(150, Math.sqrt((w * h) / Math.max(1, nodes.length)) * 0.9);
  const ITER = 400;
  for (let it = 0; it < ITER; it++) {
    const t = 1 - it / ITER;
    for (const a of nodes) for (const b of nodes) {
      if (a.id >= b.id) continue;
      const pa = p.get(a.id)!; const pb = p.get(b.id)!;
      let dx = pa.x - pb.x; let dy = pa.y - pb.y;
      const d2 = Math.max(80, dx * dx + dy * dy);
      const f = (ideal * ideal) / d2 * 1.8;
      const d = Math.sqrt(d2); dx /= d; dy /= d;
      pa.vx += dx * f; pa.vy += dy * f; pb.vx -= dx * f; pb.vy -= dy * f;
    }
    for (const e of edges) {
      const pa = p.get(e.from); const pb = p.get(e.to);
      if (!pa || !pb) continue;
      const dx = pb.x - pa.x; const dy = pb.y - pa.y;
      const d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const f = (d - ideal) / d * 0.05;
      pa.vx += dx * f; pa.vy += dy * f; pb.vx -= dx * f; pb.vy -= dy * f;
    }
    for (const v of p.values()) {
      v.vx += (w / 2 - 70 - v.x) * 0.0008; v.vy += (h / 2 - v.y) * 0.0008;
      v.x = Math.max(30, Math.min(w - 170, v.x + Math.max(-20, Math.min(20, v.vx)) * t));
      v.y = Math.max(20, Math.min(h - 20, v.y + Math.max(-20, Math.min(20, v.vy)) * t));
      v.vx *= 0.5; v.vy *= 0.5;
    }
  }
  return p;
}
