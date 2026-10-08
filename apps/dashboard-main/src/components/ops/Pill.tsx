import type { ReactNode } from "react";

/** Small coloured badge. `color` is a hex string (works with data-driven colours). */
export function Pill({ color, children, solid = false, className = "" }: { color: string; children: ReactNode; solid?: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${className}`}
      style={solid
        ? { backgroundColor: color, borderColor: color, color: "#04070d" }
        : { backgroundColor: `${color}1f`, borderColor: `${color}66`, color }}
    >
      {children}
    </span>
  );
}

/** Horizontal 0–100 meter. */
export function Meter({ value, color = "hsl(var(--primary))", className = "" }: { value: number; color?: string; className?: string }) {
  return (
    <div className={`h-1.5 rounded-full bg-secondary overflow-hidden ${className}`}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }} />
    </div>
  );
}
