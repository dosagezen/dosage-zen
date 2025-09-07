import { Download, Activity, AlertTriangle, Info, AlertCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { logEntries, latencyData, errorRateData } from "@/data/adminMockData";

const getLogIcon = (level: string) => {
  switch (level) {
    case 'ERROR':
      return <AlertTriangle className="w-4 h-4 text-destructive" />;
    case 'WARN':
      return <AlertCircle className="w-4 h-4 text-vibrant-yellow" />;
    case 'INFO':
    default:
      return <Info className="w-4 h-4 text-vibrant-blue" />;
  }
};

const getLogBadge = (level: string) => {
  switch (level) {
    case 'ERROR':
      return <Badge variant="destructive">ERROR</Badge>;
    case 'WARN':
      return <Badge className="bg-vibrant-yellow/10 text-vibrant-yellow border-vibrant-yellow/20">WARN</Badge>;
    case 'INFO':
    default:
      return <Badge className="bg-vibrant-blue/10 text-vibrant-blue border-vibrant-blue/20">INFO</Badge>;
  }
};

export function Observabilidade() {
  const { toast } = useToast();

  const handleDownloadLogs = () => {
    toast({
      title: "Download iniciado",
      description: "Logs serão baixados em instantes (mock)",
    });
  };

  const avgLatency = Math.round(latencyData.reduce((acc, curr) => acc + curr.latency, 0) / latencyData.length);
  const totalErrors = errorRateData.reduce((acc, curr) => acc + curr.errors, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Observabilidade</h2>
          <p className="text-muted-foreground">Monitoramento e logs do sistema</p>
        </div>
        <Button onClick={handleDownloadLogs} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Baixar Logs
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Latência Média</p>
                <p className="text-2xl font-semibold text-foreground">{avgLatency}ms</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-success" />
                  <span className="text-xs text-success">-5ms vs ontem</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-vibrant-blue/10 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-vibrant-blue" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Erros</p>
                <p className="text-2xl font-semibold text-destructive">{totalErrors}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">Últimas 24h</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-semibold text-success">99.9%</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">Últimos 30 dias</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Chart */}
        <Card className="hover:shadow-soft transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">Latência por Hora</CardTitle>
            <p className="text-sm text-muted-foreground">Últimas 24 horas (ms)</p>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyData}>
                  <XAxis 
                    dataKey="hour" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}ms`, 'Latência']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="latency" 
                    stroke="hsl(var(--vibrant-blue))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--vibrant-blue))', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Error Rate Chart */}
        <Card className="hover:shadow-soft transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">Erros por Endpoint</CardTitle>
            <p className="text-sm text-muted-foreground">Últimas 24 horas</p>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorRateData}>
                  <XAxis 
                    dataKey="endpoint" 
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}`, 'Erros']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="errors" 
                    fill="hsl(var(--destructive))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Logs */}
      <Card className="hover:shadow-soft transition-shadow">
        <CardHeader>
          <CardTitle className="text-base">Logs Recentes</CardTitle>
          <p className="text-sm text-muted-foreground">Últimas entradas do sistema</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {logEntries.map((log) => (
              <div 
                key={log.id}
                className="flex items-start gap-3 p-3 border border-border/50 rounded-lg hover:bg-accent/5 transition-colors"
              >
                <div className="mt-0.5">
                  {getLogIcon(log.level)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getLogBadge(log.level)}
                    <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                    <Badge variant="outline" className="text-xs">
                      {log.service}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground break-words">{log.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status dos Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'API Gateway', status: 'operational' },
                { name: 'Auth Service', status: 'operational' },
                { name: 'Database', status: 'operational' },
                { name: 'Notification Service', status: 'degraded' },
                { name: 'Report Service', status: 'operational' }
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between p-2 rounded border border-border/50">
                  <span className="text-sm font-medium text-foreground">{service.name}</span>
                  <Badge 
                    variant="outline"
                    className={service.status === 'operational' 
                      ? "bg-success/10 text-success border-success/20" 
                      : "bg-vibrant-yellow/10 text-vibrant-yellow border-vibrant-yellow/20"
                    }
                  >
                    {service.status === 'operational' ? 'Operacional' : 'Degradado'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alertas Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-vibrant-yellow/5 rounded-lg border border-vibrant-yellow/20">
                <AlertCircle className="w-4 h-4 text-vibrant-yellow mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Alto uso de memória</p>
                  <p className="text-xs text-muted-foreground">Detectado há 15min</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Falhas no envio de push</p>
                  <p className="text-xs text-muted-foreground">Detectado há 2h</p>
                </div>
              </div>

              <div className="text-center p-4 text-sm text-muted-foreground">
                <Info className="w-4 h-4 mx-auto mb-2" />
                Sistema monitorado 24/7
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}