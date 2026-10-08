import type { LucideIcon } from "lucide-react";

interface KpiTileProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  /** Tailwind text colour class for the value, e.g. "text-destructive" */
  tone?: string;
  hint?: string;
  onClick?: () => void;
}

export function KpiTile({ label, value, icon: Icon, tone = "text-foreground", hint, onClick }: KpiTileProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className={`glass-panel px-3 py-2.5 text-left min-w-0 ${onClick ? "hover:border-primary/40 transition-colors" : ""}`}>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-primary/80 shrink-0" />}
        <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground truncate">{label}</p>
      </div>
      <p className={`mt-1 text-xl font-bold font-mono tabular-nums ${tone}`}>{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground truncate">{hint}</p>}
    </Tag>
  );
}
