import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { sessionTimeData } from "@/data/adminMockData";

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-2 shadow-soft">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">
          {formatTime(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function SessionTimeWidget() {
  const avgTime = Math.floor(sessionTimeData.reduce((acc, curr) => acc + curr.time, 0) / sessionTimeData.length);

  return (
    <Card className="hover:shadow-soft transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="w-8 h-8 bg-vibrant-blue/10 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-vibrant-blue" />
          </div>
          Tempo Médio de Sessão
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="text-3xl font-bold text-foreground mb-1">
            {formatTime(avgTime)}
          </div>
          <p className="text-sm text-muted-foreground">
            Evolução últimos 30 dias
          </p>
        </div>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sessionTimeData}>
              <XAxis 
                dataKey="day" 
                hide 
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="time" 
                stroke="hsl(var(--vibrant-blue))" 
                strokeWidth={2}
                dot={false}
                fill="hsl(var(--vibrant-blue))"
                fillOpacity={0.1}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}