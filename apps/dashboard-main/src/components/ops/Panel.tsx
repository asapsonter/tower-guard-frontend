import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface PanelProps {
  title?: ReactNode;
  icon?: LucideIcon;
  /** Right side of the header (filters, counts, buttons) */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** Standard HUD panel: glass card with an optional header row. */
export function Panel({ title, icon: Icon, actions, children, className = "", bodyClassName = "p-4" }: PanelProps) {
  return (
    <section className={`glass-panel flex flex-col min-w-0 ${className}`}>
      {(title || actions) && (
        <header className="flex items-center gap-2 px-4 py-2.5 border-b border-primary/15 min-h-[44px]">
          {Icon && <Icon className="h-4 w-4 text-primary shrink-0" />}
          {title && <h2 className="text-[13px] font-semibold text-foreground truncate">{title}</h2>}
          {actions && <div className="ml-auto flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={`flex-1 min-h-0 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

/** Page heading used at the top of every workspace. */
export function PageHeader({ title, subtitle, icon: Icon, actions }: { title: string; subtitle?: string; icon?: LucideIcon; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {Icon && (
        <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      )}
      <div className="min-w-0">
        <h1 className="font-display text-[15px] font-bold text-foreground text-glow uppercase">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
