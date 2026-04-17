import { motion } from "framer-motion";
import { Battery, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@tower-guard/ui";
import { Progress } from "@tower-guard/ui";

interface BatteryCardProps {
  batteryCharge: number;
  batteryFlow: number;
}

const BatteryCard = ({ batteryCharge, batteryFlow }: BatteryCardProps) => {
  const getBatteryColor = (charge: number) => {
    if (charge > 60) return "text-emerald-500";
    if (charge > 30) return "text-yellow-500";
    return "text-destructive";
  };

  const getFlowLabel = (flow: number) => {
    if (flow > 0.1) return { text: "Charging", color: "text-emerald-500" };
    if (flow < -0.1) return { text: "Discharging", color: "text-yellow-500" };
    return { text: "Idle", color: "text-muted-foreground" };
  };

  const flowInfo = getFlowLabel(batteryFlow);

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Battery className={`h-4 w-4 ${getBatteryColor(batteryCharge)}`} />
          Battery Bank
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-foreground">{batteryCharge}%</span>
          <span className={`text-xs font-semibold ${flowInfo.color}`}>{flowInfo.text}</span>
        </div>
        <Progress value={batteryCharge} className="h-3" />
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-secondary/50">
            <p className="text-[9px] text-muted-foreground">Flow Rate</p>
            <p className="text-xs font-bold text-foreground">{Math.abs(batteryFlow).toFixed(2)} kW</p>
          </div>
          <div className="p-2 rounded-lg bg-secondary/50">
            <p className="text-[9px] text-muted-foreground">Status</p>
            <p className={`text-xs font-bold ${flowInfo.color}`}>{flowInfo.text}</p>
          </div>
          <div className="p-2 rounded-lg bg-secondary/50">
            <p className="text-[9px] text-muted-foreground">Health</p>
            <p className="text-xs font-bold text-emerald-500">Good</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 py-1">
          {batteryFlow > 0.1 ? (
            <>
              <span className="text-[9px] text-muted-foreground">Inverter</span>
              <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                <ArrowRight className="h-3.5 w-3.5 text-emerald-500" />
              </motion.div>
              <span className="text-[9px] text-emerald-500 font-semibold">Battery</span>
            </>
          ) : batteryFlow < -0.1 ? (
            <>
              <span className="text-[9px] text-yellow-500 font-semibold">Battery</span>
              <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                <ArrowRight className="h-3.5 w-3.5 text-yellow-500" />
              </motion.div>
              <span className="text-[9px] text-muted-foreground">Inverter</span>
            </>
          ) : (
            <span className="text-[9px] text-muted-foreground">No energy flow</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BatteryCard;
