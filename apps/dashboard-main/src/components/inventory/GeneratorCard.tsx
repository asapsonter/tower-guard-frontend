import { motion } from "framer-motion";
import { Fuel, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@tower-guard/ui";
import { Badge } from "@tower-guard/ui";

interface GeneratorCardProps {
  generatorActive: boolean;
  generatorOutput: number;
}

const GeneratorCard = ({ generatorActive, generatorOutput }: GeneratorCardProps) => {
  return (
    <Card className={`bg-card/50 backdrop-blur-sm ${generatorActive ? "border-yellow-500/40" : ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Fuel className={`h-4 w-4 ${generatorActive ? "text-yellow-500" : "text-muted-foreground"}`} />
          Generator
          {generatorActive && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="ml-auto text-[9px] font-bold text-yellow-500"
            >
              ● RUNNING
            </motion.span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-foreground">
            {generatorActive ? `${generatorOutput} kW` : "OFF"}
          </span>
          <Badge variant={generatorActive ? "default" : "secondary"} className="text-[9px]">
            {generatorActive ? "Auto-Started" : "Standby"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-lg bg-secondary/50">
            <p className="text-[9px] text-muted-foreground">Start Trigger</p>
            <p className="text-xs font-bold text-foreground">Battery &lt; 25%</p>
          </div>
          <div className="p-2 rounded-lg bg-secondary/50">
            <p className="text-[9px] text-muted-foreground">Stop At</p>
            <p className="text-xs font-bold text-foreground">Battery &gt; 80%</p>
          </div>
        </div>

        {generatorActive && (
          <div className="flex items-center justify-center gap-2 py-1">
            <span className="text-[9px] text-yellow-500 font-semibold">Generator</span>
            <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>
              <ArrowRight className="h-3.5 w-3.5 text-yellow-500" />
            </motion.div>
            <span className="text-[9px] text-muted-foreground">Inverter</span>
            <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }}>
              <ArrowRight className="h-3.5 w-3.5 text-yellow-500" />
            </motion.div>
            <span className="text-[9px] text-muted-foreground">Battery</span>
          </div>
        )}

        <p className="text-[9px] text-muted-foreground text-center italic">
          Auto-starts at battery &lt;25%, stops at &gt;80%.
        </p>
      </CardContent>
    </Card>
  );
};

export default GeneratorCard;
