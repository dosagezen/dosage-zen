import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { generateOnlineUsers } from "@/data/adminMockData";

export function OnlineUsersWidget() {
  const [onlineData, setOnlineData] = useState(generateOnlineUsers());

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineData(generateOnlineUsers());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="hover:shadow-soft transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="w-8 h-8 bg-vibrant-green/10 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-vibrant-green" />
          </div>
          Usuários Online Agora
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-bold text-foreground">
                {onlineData.current}
              </span>
              <div className="w-2 h-2 bg-vibrant-green rounded-full animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">
              Últimos 15 minutos
            </p>
          </div>
          <div className="w-20 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={onlineData.sparklineData}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--vibrant-green))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}