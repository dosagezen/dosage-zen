import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  suffix?: string;
}

export function KPICard({ title, value, icon: Icon, trend, suffix }: KPICardProps) {
  return (
    <Card className="hover:shadow-soft transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-foreground">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </span>
              {suffix && (
                <span className="text-sm text-muted-foreground">{suffix}</span>
              )}
            </div>
            {trend && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${
                trend.isPositive ? 'text-success' : 'text-destructive'
              }`}>
                <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
                <span className="text-muted-foreground">vs período anterior</span>
              </div>
            )}
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}