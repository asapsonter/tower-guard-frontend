import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@tower-guard/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@tower-guard/ui";
import { TrendingUp, Zap, Sun, Fuel } from "lucide-react";
import { Badge } from "@tower-guard/ui";

interface EnergyStatsProps {
  solarOutput: number;
  generatorOutput: number;
  pduLoad: number;
  generatorActive: boolean;
}

const COLORS = ["hsl(142, 71%, 45%)", "hsl(48, 96%, 53%)", "hsl(221, 83%, 53%)", "hsl(0, 84%, 60%)"];

const EnergyStatistics = ({ solarOutput, generatorOutput, pduLoad, generatorActive }: EnergyStatsProps) => {
  const [history, setHistory] = useState<{ time: string; solar: number; generator: number; consumed: number }[]>([]);

  useEffect(() => {
    const now = new Date();
    const label = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setHistory(prev => [
      ...prev.slice(-19),
      { time: label, solar: solarOutput, generator: generatorActive ? generatorOutput : 0, consumed: pduLoad },
    ]);
  }, [solarOutput, generatorOutput, pduLoad, generatorActive]);

  const dailyStats = useMemo(() => {
    const solarDaily = +(solarOutput * 10 + Math.random() * 5).toFixed(1);
    const genDaily = +(generatorActive ? generatorOutput * 4 : 0.5 + Math.random() * 2).toFixed(1);
    const consumedDaily = +(pduLoad * 22 + Math.random() * 3).toFixed(1);
    return {
      solarDaily,
      genDaily,
      totalGenerated: +(solarDaily + genDaily).toFixed(1),
      consumedDaily,
      monthly: {
        solar: +(solarDaily * 30).toFixed(0),
        generator: +(genDaily * 30).toFixed(0),
        consumed: +(consumedDaily * 30).toFixed(0),
        total: +((solarDaily + genDaily) * 30).toFixed(0),
      },
      yearly: {
        solar: +(solarDaily * 365).toFixed(0),
        generator: +(genDaily * 365).toFixed(0),
        consumed: +(consumedDaily * 365).toFixed(0),
        total: +((solarDaily + genDaily) * 365).toFixed(0),
      },
    };
  }, [solarOutput, generatorOutput, pduLoad, generatorActive]);

  const sourceBreakdown = [
    { name: "Solar", value: dailyStats.solarDaily },
    { name: "Generator", value: dailyStats.genDaily },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 text-center">
            <Sun className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Solar / Day</p>
            <p className="text-lg font-bold text-foreground">{dailyStats.solarDaily} kWh</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 text-center">
            <Fuel className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Generator / Day</p>
            <p className="text-lg font-bold text-foreground">{dailyStats.genDaily} kWh</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Total Generated</p>
            <p className="text-lg font-bold text-foreground">{dailyStats.totalGenerated} kWh</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 text-center">
            <Zap className="h-5 w-5 text-destructive mx-auto mb-1" />
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Consumed / Day</p>
            <p className="text-lg font-bold text-foreground">{dailyStats.consumedDaily} kWh</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Period views */}
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-2">
                  Real-Time Energy Production
                  <Badge variant="secondary" className="text-[8px]">Live</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={history} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} unit="kW" />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="solar" fill="hsl(48, 96%, 53%)" name="Solar" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="generator" fill="hsl(25, 95%, 53%)" name="Generator" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="consumed" fill="hsl(221, 83%, 53%)" name="Consumed" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Energy Source Breakdown (Today)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={sourceBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {sourceBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">Monthly Energy Summary (Estimated)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-secondary/50 text-center">
                  <Sun className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-[10px] text-muted-foreground">Solar Generated</p>
                  <p className="text-xl font-bold text-foreground">{dailyStats.monthly.solar} kWh</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 text-center">
                  <Fuel className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                  <p className="text-[10px] text-muted-foreground">Generator Output</p>
                  <p className="text-xl font-bold text-foreground">{dailyStats.monthly.generator} kWh</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 text-center">
                  <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-[10px] text-muted-foreground">Total Consumed</p>
                  <p className="text-xl font-bold text-foreground">{dailyStats.monthly.consumed} kWh</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yearly">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">Yearly Energy Summary (Projected)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-secondary/50 text-center">
                  <Sun className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-[10px] text-muted-foreground">Solar Generated</p>
                  <p className="text-xl font-bold text-foreground">{dailyStats.yearly.solar} kWh</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 text-center">
                  <Fuel className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                  <p className="text-[10px] text-muted-foreground">Generator Output</p>
                  <p className="text-xl font-bold text-foreground">{dailyStats.yearly.generator} kWh</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 text-center">
                  <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-[10px] text-muted-foreground">Total Consumed</p>
                  <p className="text-xl font-bold text-foreground">{dailyStats.yearly.consumed} kWh</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnergyStatistics;
