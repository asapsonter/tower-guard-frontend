import DashboardHeader from "@/components/dashboard/DashboardHeader";
import LiveVideoFeed from "@/components/dashboard/LiveVideoFeed";
import RealTimeAlerts from "@/components/dashboard/RealTimeAlerts";
import EventLogTable from "@/components/dashboard/EventLogTable";
import SensorStatusPanel from "@/components/dashboard/SensorStatusPanel";
import AlarmControls from "@/components/dashboard/AlarmControls";
import NationalCoverageMap from "@/components/dashboard/NationalCoverageMap";
import ManualModePanel from "@/components/dashboard/ManualModePanel";
import AlertDispatchPopup from "@/components/dashboard/AlertDispatchPopup";
import { useSimulation } from "@tower-guard/hooks";

interface IndexProps {
  selectedState?: string | null;
  selectedLga?: string | null;
  onStateSelect?: (state: string | null) => void;
  onLgaSelect?: (lga: string | null) => void;
}

const Index = ({ selectedState, selectedLga, onStateSelect, onLgaSelect }: IndexProps) => {
  const { alerts, events, sensors, masts, unreadCount, clearUnread, soundEnabled, toggleSound, addEvent, isArmed } = useSimulation();

  return (
    <div className="space-y-4">
      {/* Alert dispatch popup - floats on screen */}
      <AlertDispatchPopup alerts={alerts} />

      <DashboardHeader
        unreadCount={unreadCount}
        onClearUnread={clearUnread}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />

      {/* Primary: National Coverage Map with zone filters */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          <NationalCoverageMap />
        </div>
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <RealTimeAlerts alerts={alerts} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          <LiveVideoFeed />
        </div>
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <SensorStatusPanel sensors={sensors} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-4">
          <AlarmControls isArmed={isArmed} />
        </div>
        <div className="col-span-12 md:col-span-4">
          <ManualModePanel onManualAlert={() => addEvent()} />
        </div>
        <div className="col-span-12 md:col-span-4">
          <div className="glass-panel p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Quick Stats</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-lg font-bold text-destructive">{alerts.filter(a => a.severity === "critical").length}</p>
                <p className="text-[10px] text-muted-foreground">Critical</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-lg font-bold text-warning">{alerts.filter(a => a.severity === "warning").length}</p>
                <p className="text-[10px] text-muted-foreground">Warnings</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-success/10 border border-success/20">
                <p className="text-lg font-bold text-success">{sensors.filter(s => s.status === "online").length}</p>
                <p className="text-[10px] text-muted-foreground">Online</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-lg font-bold text-primary">{events.length}</p>
                <p className="text-[10px] text-muted-foreground">Events</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-12">
        <EventLogTable events={events} />
      </div>
    </div>
  );
};

export default Index;
