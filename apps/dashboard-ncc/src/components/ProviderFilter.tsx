import { useMemo } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { TELECOM_PROVIDERS, mockTelecomMasts } from "@tower-guard/data";
import type { ProviderShort } from "../App";

const PROVIDER_OPTIONS: { label: string; value: ProviderShort | null; color: string }[] = [
  { label: "All Providers", value: null, color: "hsl(var(--primary))" },
  ...TELECOM_PROVIDERS.map(p => ({
    label: p.name,
    value: p.shortName as ProviderShort,
    color: p.color,
  })),
];

const STATES_WITH_MASTS = [...new Set(mockTelecomMasts.map(m => m.state))].sort();

interface ProviderFilterProps {
  selected: ProviderShort | null;
  onSelect: (provider: ProviderShort | null) => void;
  selectedState: string | null;
  onStateSelect: (state: string | null) => void;
}

const ProviderFilter = ({ selected, onSelect, selectedState, onStateSelect }: ProviderFilterProps) => {
  // When a provider is selected, only show states that have masts for that provider
  const availableStates = useMemo(() => {
    if (!selected) return STATES_WITH_MASTS;
    return [...new Set(mockTelecomMasts.filter(m => m.providerShort === selected).map(m => m.state))].sort();
  }, [selected]);

  return (
    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
      {/* Provider pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {PROVIDER_OPTIONS.map(opt => {
          const isActive = selected === opt.value;
          return (
            <button
              key={opt.label}
              onClick={() => onSelect(opt.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border ${
                isActive
                  ? "border-transparent text-white shadow-md"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border bg-secondary/40"
              }`}
              style={isActive ? { backgroundColor: opt.color, borderColor: opt.color } : undefined}
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: opt.color, opacity: isActive ? 1 : 0.6 }}
              />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* State dropdown */}
      <div className="flex items-center gap-2">
        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="relative">
          <select
            value={selectedState ?? ""}
            onChange={e => onStateSelect(e.target.value || null)}
            className="appearance-none pl-3 pr-7 py-1.5 text-[11px] font-mono text-foreground bg-secondary/60 rounded-md border border-border/50 cursor-pointer hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All States</option>
            {availableStates.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>
        {selectedState && (
          <button
            onClick={() => onStateSelect(null)}
            className="text-[10px] text-destructive hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default ProviderFilter;
