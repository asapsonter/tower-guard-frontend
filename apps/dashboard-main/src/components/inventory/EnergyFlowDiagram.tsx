import { motion } from "framer-motion";
import { Sun, Zap, Server, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@tower-guard/ui";
import { Badge } from "@tower-guard/ui";

interface EnergyFlowProps {
  solarOutput: number;
  inverterInput: number;
  inverterOutput: number;
  pduLoad: number;
  generatorActive: boolean;
}

const EnergyFlowDiagram = ({ solarOutput, inverterInput, inverterOutput, pduLoad, generatorActive }: EnergyFlowProps) => {
  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Live Energy Flow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-1 md:gap-3 overflow-x-auto py-2">
          {/* Solar Panel */}
          <motion.div
            animate={{ opacity: solarOutput > 0.5 ? 1 : 0.5 }}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card min-w-[100px] flex-1"
          >
            <Sun className={`h-7 w-7 ${solarOutput > 0.5 ? "text-yellow-500" : "text-muted-foreground"}`} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Solar</span>
            <span className="text-base font-bold text-foreground">{solarOutput} kW</span>
            <Badge variant={solarOutput > 2 ? "default" : "secondary"} className="text-[9px] px-1.5">
              {solarOutput > 2 ? "Active" : "Low"}
            </Badge>
          </motion.div>

          {/* Arrow */}
          <div className="flex flex-col items-center shrink-0">
            <motion.div
              animate={{ x: solarOutput > 0.5 ? [0, 6, 0] : 0 }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <ArrowRight className={`h-5 w-5 ${solarOutput > 0.5 ? "text-yellow-500" : "text-muted-foreground/30"}`} />
            </motion.div>
            <span className="text-[8px] text-muted-foreground mt-0.5">{solarOutput > 0.5 ? `${solarOutput}kW` : "—"}</span>
          </div>

          {/* Inverter */}
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-primary/30 bg-primary/5 min-w-[100px] flex-1">
            <Zap className="h-7 w-7 text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Inverter</span>
            <div className="text-center">
              <span className="text-[9px] text-muted-foreground block">In: {inverterInput}kW</span>
              <span className="text-base font-bold text-foreground">{inverterOutput} kW</span>
            </div>
            <Badge className="text-[9px] px-1.5">
              {generatorActive ? "Gen+Solar" : solarOutput > 0.5 ? "Solar" : "Battery"}
            </Badge>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center shrink-0">
            <motion.div
              animate={{ x: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            >
              <ArrowRight className="h-5 w-5 text-primary" />
            </motion.div>
            <span className="text-[8px] text-muted-foreground mt-0.5">{inverterOutput}kW</span>
          </div>

          {/* PDU */}
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card min-w-[100px] flex-1">
            <Server className="h-7 w-7 text-accent-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PDU</span>
            <span className="text-base font-bold text-foreground">{pduLoad} kW</span>
            <Badge variant="secondary" className="text-[9px] px-1.5">Site Load</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnergyFlowDiagram;
