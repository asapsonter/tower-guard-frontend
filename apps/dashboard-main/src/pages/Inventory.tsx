import { useState, useMemo } from "react";
import { Badge } from "@tower-guard/ui";
import {
  CheckCircle2, AlertTriangle, XCircle, Search, Filter,
  Radio, Battery, Zap, Camera, Wifi, Server, Shield,
  Gauge, ThermometerSun, Wrench, Clock, MapPin, Package,
  ChevronDown, ChevronUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type AssetStatus = "operational" | "warning" | "vandalized" | "offline";

interface SiteAsset {
  id: string;
  name: string;
  category: string;
  icon: string;
  model: string;
  serialNumber: string;
  installDate: string;
  lastInspection: string;
  status: AssetStatus;
  condition: number;
  location: string;
  notes: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  tower: Radio,
  power: Zap,
  battery: Battery,
  camera: Camera,
  network: Wifi,
  enclosure: Server,
  security: Shield,
  sensor: Gauge,
  cooling: ThermometerSun,
};

const STATUS_MAP: Record<AssetStatus, { label: string; color: string; bg: string; Icon: LucideIcon }> = {
  operational: { label: "Operational", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", Icon: CheckCircle2 },
  warning: { label: "Needs Attention", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", Icon: AlertTriangle },
  vandalized: { label: "Vandalized", color: "text-destructive", bg: "bg-destructive/10 border-destructive/20", Icon: XCircle },
  offline: { label: "Offline", color: "text-muted-foreground", bg: "bg-muted border-border", Icon: XCircle },
};

const ASSETS: SiteAsset[] = [
  { id: "TWR-001", name: "Main Telecom Tower", category: "Tower", icon: "tower", model: "Guyed Mast 45m", serialNumber: "GT-45M-2023-0412", installDate: "2023-04-15", lastInspection: "2026-03-15", status: "operational", condition: 92, location: "Tower Base - Center", notes: "Structural integrity verified. Anti-climb barriers intact." },
  { id: "TWR-002", name: "Tower Lighting System", category: "Tower", icon: "tower", model: "Honeywell OB-21", serialNumber: "OB21-2023-1188", installDate: "2023-04-15", lastInspection: "2026-03-20", status: "operational", condition: 88, location: "Tower Top", notes: "Aviation warning lights functional." },
  { id: "ANT-001", name: "Sector Antenna - Alpha", category: "Network", icon: "network", model: "Huawei ATR4518R6", serialNumber: "ATR-2024-00891", installDate: "2024-01-10", lastInspection: "2026-03-25", status: "operational", condition: 95, location: "Tower 40m - Sector A", notes: "Signal strength nominal." },
  { id: "ANT-002", name: "Sector Antenna - Beta", category: "Network", icon: "network", model: "Huawei ATR4518R6", serialNumber: "ATR-2024-00892", installDate: "2024-01-10", lastInspection: "2026-03-25", status: "operational", condition: 94, location: "Tower 40m - Sector B", notes: "Operating normally." },
  { id: "ANT-003", name: "Sector Antenna - Gamma", category: "Network", icon: "network", model: "Huawei ATR4518R6", serialNumber: "ATR-2024-00893", installDate: "2024-01-10", lastInspection: "2026-03-25", status: "warning", condition: 65, location: "Tower 40m - Sector C", notes: "Minor tilt deviation detected. Scheduled for realignment." },
  { id: "MW-001", name: "Microwave Dish", category: "Network", icon: "network", model: "Ericsson MINI-LINK 6352", serialNumber: "ML6352-2023-5521", installDate: "2023-06-20", lastInspection: "2026-03-18", status: "operational", condition: 90, location: "Tower 35m", notes: "Backhaul link stable." },
  { id: "BTS-001", name: "Base Transceiver Station", category: "Network", icon: "enclosure", model: "Huawei BTS3900", serialNumber: "BTS39-2024-07744", installDate: "2024-01-10", lastInspection: "2026-03-28", status: "operational", condition: 97, location: "Equipment Shelter", notes: "All carriers active. Temperature normal." },
  { id: "GEN-001", name: "Diesel Generator - Primary", category: "Power", icon: "power", model: "Perkins 20kVA", serialNumber: "PK20-2023-3301", installDate: "2023-04-15", lastInspection: "2026-03-22", status: "operational", condition: 82, location: "Generator Compound", notes: "Fuel level 70%. Next service due at 1500hrs." },
  { id: "GEN-002", name: "Diesel Generator - Backup", category: "Power", icon: "power", model: "Perkins 20kVA", serialNumber: "PK20-2023-3302", installDate: "2023-04-15", lastInspection: "2026-03-22", status: "warning", condition: 58, location: "Generator Compound", notes: "Coolant level low. Starter motor sluggish." },
  { id: "BAT-001", name: "Battery Bank - A", category: "Power", icon: "battery", model: "Narada 48V 200Ah LiFePO4", serialNumber: "NRD-48200-A001", installDate: "2024-02-01", lastInspection: "2026-03-28", status: "operational", condition: 91, location: "Battery Room", notes: "All cells balanced. Capacity 95%." },
  { id: "BAT-002", name: "Battery Bank - B", category: "Power", icon: "battery", model: "Narada 48V 200Ah LiFePO4", serialNumber: "NRD-48200-A002", installDate: "2024-02-01", lastInspection: "2026-03-28", status: "operational", condition: 89, location: "Battery Room", notes: "Minor capacity degradation (92%)." },
  { id: "SOL-001", name: "Solar Panel Array", category: "Power", icon: "power", model: "Jinko Tiger Neo 72HL4 x8", serialNumber: "JK-TNH-2024-ARRAY", installDate: "2024-03-10", lastInspection: "2026-03-20", status: "warning", condition: 70, location: "Ground Mount", notes: "2 panels reduced output. Cleaning scheduled." },
  { id: "CAM-001", name: "Surveillance Camera - PTZ", category: "Security", icon: "camera", model: "Dahua SD6AL245XA-HNR", serialNumber: "DH-PTZ-2024-1841", installDate: "2024-01-15", lastInspection: "2026-03-29", status: "operational", condition: 96, location: "Tower Base - North", notes: "Full 360 pan. IR night vision OK." },
  { id: "CAM-002", name: "Surveillance Camera - Fixed", category: "Security", icon: "camera", model: "Hikvision DS-2CD2T47G2-L", serialNumber: "HK-FX-2024-0116", installDate: "2024-01-15", lastInspection: "2026-03-29", status: "operational", condition: 93, location: "Equipment Room", notes: "ColorVu imaging verified." },
  { id: "AXP-001", name: "AX PRO Alarm Panel", category: "Security", icon: "security", model: "Hikvision AX PRO DS-PWA96", serialNumber: "AXP-2024-0118", installDate: "2024-01-15", lastInspection: "2026-03-30", status: "operational", condition: 98, location: "Equipment Shelter", notes: "All zones reporting. Battery 100%." },
  { id: "PIR-001", name: "PIR Motion Sensor", category: "Security", icon: "sensor", model: "Hikvision DS-PDPC12P", serialNumber: "PIR-2024-0221", installDate: "2024-01-15", lastInspection: "2026-03-30", status: "operational", condition: 95, location: "Perimeter - East Gate", notes: "Detection range verified." },
  { id: "VIB-001", name: "Vibration Sensor", category: "Security", icon: "sensor", model: "Hikvision DS-PDBFP", serialNumber: "VIB-2024-0222", installDate: "2024-01-15", lastInspection: "2026-03-30", status: "operational", condition: 94, location: "Perimeter Fence - South", notes: "Sensitivity calibrated." },
  { id: "FNC-001", name: "Perimeter Fence - Razor Wire", category: "Security", icon: "security", model: "BTO-22 Concertina", serialNumber: "N/A", installDate: "2023-04-15", lastInspection: "2026-03-15", status: "vandalized", condition: 35, location: "Perimeter - South-West", notes: "Section cut. Approx 4m breach. Temporary repair done. Full replacement needed." },
  { id: "AC-001", name: "Shelter AC Unit", category: "Cooling", icon: "cooling", model: "Emerson Liebert PEX 5kW", serialNumber: "EMR-PEX5-2023-8801", installDate: "2023-06-01", lastInspection: "2026-03-25", status: "operational", condition: 85, location: "Equipment Shelter", notes: "Cooling adequate. Filter cleaned." },
  { id: "ENC-001", name: "Equipment Shelter", category: "Enclosure", icon: "enclosure", model: "Eltek Outdoor Cabinet", serialNumber: "ELT-ODC-2023-4410", installDate: "2023-04-15", lastInspection: "2026-03-28", status: "operational", condition: 88, location: "Site Center", notes: "Door locks intact. No tampering." },
  { id: "CBL-001", name: "Power Cables (Armoured)", category: "Power", icon: "power", model: "4-core 16mm SWA", serialNumber: "N/A", installDate: "2023-04-15", lastInspection: "2026-03-20", status: "vandalized", condition: 20, location: "Generator to Shelter", notes: "Cable trench exposed. ~8m stolen. Temporary bypass installed." },
];

const CATEGORIES = Array.from(new Set(ASSETS.map(a => a.category)));

const Inventory = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return ASSETS.filter(a => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) ||
               a.serialNumber.toLowerCase().includes(q) || a.model.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, statusFilter, categoryFilter]);

  const counts = {
    total: ASSETS.length,
    operational: ASSETS.filter(a => a.status === "operational").length,
    warning: ASSETS.filter(a => a.status === "warning").length,
    vandalized: ASSETS.filter(a => a.status === "vandalized").length,
    offline: ASSETS.filter(a => a.status === "offline").length,
    avgCondition: Math.round(ASSETS.reduce((s, a) => s + a.condition, 0) / ASSETS.length),
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-bold text-foreground">Site Inventory</h1>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" /> Abuja Maitama - Telecom Tower Site
          </p>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {counts.total} assets tracked
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <SummaryCard label="Total Assets" value={counts.total} color="text-primary" Icon={Package} />
        <SummaryCard label="Operational" value={counts.operational} color="text-emerald-500" Icon={CheckCircle2} />
        <SummaryCard label="Needs Attention" value={counts.warning} color="text-amber-500" Icon={AlertTriangle} />
        <SummaryCard label="Vandalized" value={counts.vandalized} color="text-destructive" Icon={XCircle} />
        <SummaryCard label="Offline" value={counts.offline} color="text-muted-foreground" Icon={XCircle} />
        <SummaryCard label="Avg Condition" value={`${counts.avgCondition}%`} color={counts.avgCondition > 75 ? "text-emerald-500" : "text-amber-500"} Icon={Gauge} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name, ID, model..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {["all", "operational", "warning", "vandalized", "offline"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as AssetStatus | "all")}
              className={`px-2 py-1 rounded-full text-[9px] font-medium transition-all ${
                statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-2 py-1.5 rounded-lg border border-border bg-background text-[10px]"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Asset List */}
      <div className="glass-panel overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Equipment Register
          </span>
          <span className="text-[10px] text-muted-foreground">{filtered.length} items</span>
        </div>

        <div className="divide-y divide-border/30 max-h-[600px] overflow-y-auto">
          {filtered.map(asset => {
            const st = STATUS_MAP[asset.status];
            const AssetIcon = ICON_MAP[asset.icon] || Package;
            const isOpen = expandedId === asset.id;

            return (
              <div key={asset.id}>
                <button
                  onClick={() => setExpandedId(isOpen ? null : asset.id)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-secondary/20 transition-colors"
                >
                  <AssetIcon className={`h-4 w-4 shrink-0 ${st.color}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-foreground">{asset.name}</span>
                      <span className="text-[9px] font-mono text-muted-foreground">{asset.id}</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground">{asset.category} - {asset.model}</span>
                  </div>

                  <div className="w-20 shrink-0 hidden sm:block">
                    <div className="flex items-center justify-between text-[8px] text-muted-foreground mb-0.5">
                      <span>Condition</span>
                      <span className={asset.condition > 75 ? "text-emerald-500" : asset.condition > 40 ? "text-amber-500" : "text-destructive"}>
                        {asset.condition}%
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full ${asset.condition > 75 ? "bg-emerald-500" : asset.condition > 40 ? "bg-amber-500" : "bg-destructive"}`}
                        style={{ width: `${asset.condition}%` }}
                      />
                    </div>
                  </div>

                  <div className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-medium ${st.bg} ${st.color}`}>
                    <st.Icon className="h-3 w-3" />
                    <span className="hidden md:inline">{st.label}</span>
                  </div>

                  {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-3 ml-7 border-l-2 border-border/50 space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                      <div>
                        <span className="text-muted-foreground">Serial Number</span>
                        <p className="font-mono font-medium text-foreground">{asset.serialNumber}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Install Date</span>
                        <p className="font-medium text-foreground">{asset.installDate}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Inspection</span>
                        <p className="font-medium text-foreground">{asset.lastInspection}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Location</span>
                        <p className="font-medium text-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {asset.location}
                        </p>
                      </div>
                    </div>
                    <div className="text-[10px]">
                      <span className="text-muted-foreground">Notes</span>
                      <p className={`font-medium mt-0.5 ${asset.status === "vandalized" ? "text-destructive" : "text-foreground"}`}>
                        {asset.status === "vandalized" && "VANDALISM: "}
                        {asset.notes}
                      </p>
                    </div>
                    {asset.status === "vandalized" && (
                      <div className="flex items-center gap-2">
                        <Wrench className="h-3 w-3 text-destructive" />
                        <span className="text-[10px] font-semibold text-destructive">Requires immediate repair/replacement</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center">
              <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-[11px] text-muted-foreground">No assets match your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function SummaryCard({ label, value, color, Icon }: { label: string; value: string | number; color: string; Icon: LucideIcon }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <p className={`text-lg font-bold ${color} mt-0.5`}>{value}</p>
    </div>
  );
}

export default Inventory;
