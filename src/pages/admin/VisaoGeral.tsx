import { Users, UserPlus, TrendingUp, AlertTriangle, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { KPICard } from "@/components/admin/KPICard";
import { OnlineUsersWidget } from "@/components/admin/OnlineUsersWidget";
import { SessionTimeWidget } from "@/components/admin/SessionTimeWidget";
import { kpiData, notificationData, moduleUsageData } from "@/data/adminMockData";

const notificationChartData = [
  { name: 'Entregues', value: notificationData.entregues, color: 'hsl(var(--success))' },
  { name: 'Falhas', value: notificationData.falhas, color: 'hsl(var(--destructive))' },
  { name: 'Silenciadas', value: notificationData.silenciadas, color: 'hsl(var(--muted))' }
];

export function VisaoGeral() {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <AdminFilters />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Usuários Totais"
          value={kpiData.usuariosTotais}
          icon={Users}
          trend={{ value: 8.2, isPositive: true }}
        />
        <KPICard
          title="Novos Usuários"
          value={kpiData.novosUsuarios}
          icon={UserPlus}
          trend={{ value: 12.5, isPositive: true }}
        />
        <KPICard
          title="Engajamento"
          value={kpiData.engajamento}
          suffix="%"
          icon={TrendingUp}
          trend={{ value: 3.1, isPositive: true }}
        />
        <KPICard
          title="Taxa de Erro"
          value={kpiData.taxaErro}
          suffix="%"
          icon={AlertTriangle}
          trend={{ value: 0.3, isPositive: false }}
        />
      </div>

      {/* Main Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OnlineUsersWidget />
        <SessionTimeWidget />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Delivery */}
        <Card className="hover:shadow-soft transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 bg-vibrant-purple/10 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-vibrant-purple" />
              </div>
              Entrega de Notificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={notificationChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {notificationChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              {notificationChartData.map((item) => (
                <div key={item.name} className="text-center">
                  <div className="text-lg font-semibold text-foreground">
                    {item.value}%
                  </div>
                  <div className="text-xs text-muted-foreground">{item.name}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Module Usage */}
        <Card className="hover:shadow-soft transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">Uso por Módulo</CardTitle>
            <p className="text-sm text-muted-foreground">Sessões por usuário ativo</p>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleUsageData} layout="horizontal">
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} sessões`, 'Uso médio']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card className="hover:shadow-soft transition-shadow">
        <CardHeader>
          <CardTitle className="text-base">Insights & Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-accent/5 rounded-lg">
              <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm text-foreground">
                <strong>Picos de acesso às 8h e 20h</strong> - Coincidem com as janelas típicas de medicação dos usuários
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-success/5 rounded-lg">
              <div className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm text-foreground">
                <strong>Conquistas elevam permanência média em +18%</strong> - Sistema de gamificação está funcionando bem
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-vibrant-blue/5 rounded-lg">
              <div className="w-2 h-2 bg-vibrant-blue rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm text-foreground">
                <strong>Mobile representa 78% do tráfego</strong> - Experiência mobile-first está justificada
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}