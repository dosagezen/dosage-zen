import { Download, FileText, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { useToast } from "@/hooks/use-toast";
import { retentionData, funnelData, aderenciaData, statusDistribution } from "@/data/adminMockData";

const RetentionHeatmap = () => {
  return (
    <Card className="hover:shadow-soft transition-shadow">
      <CardHeader>
        <CardTitle className="text-base">Retenção de Coorte</CardTitle>
        <p className="text-sm text-muted-foreground">Percentual de usuários que retornam</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left text-xs font-medium text-muted-foreground p-2">Período</th>
                <th className="text-center text-xs font-medium text-muted-foreground p-2">D1</th>
                <th className="text-center text-xs font-medium text-muted-foreground p-2">D7</th>
                <th className="text-center text-xs font-medium text-muted-foreground p-2">D30</th>
              </tr>
            </thead>
            <tbody>
              {retentionData.map((row, index) => (
                <tr key={index} className="border-b border-border/25">
                  <td className="p-2 text-sm font-medium text-foreground">{row.period}</td>
                  <td className="p-2 text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-6 rounded text-xs font-medium ${
                      row.d1 > 80 ? 'bg-success/20 text-success' : 
                      row.d1 > 70 ? 'bg-accent/20 text-accent-foreground' : 
                      'bg-destructive/20 text-destructive'
                    }`}>
                      {row.d1}%
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-6 rounded text-xs font-medium ${
                      row.d7 > 40 ? 'bg-success/20 text-success' : 
                      row.d7 > 30 ? 'bg-accent/20 text-accent-foreground' : 
                      'bg-destructive/20 text-destructive'
                    }`}>
                      {row.d7}%
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-6 rounded text-xs font-medium ${
                      row.d30 > 25 ? 'bg-success/20 text-success' : 
                      row.d30 > 20 ? 'bg-accent/20 text-accent-foreground' : 
                      'bg-destructive/20 text-destructive'
                    }`}>
                      {row.d30}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export function RelatoriosProduto() {
  const { toast } = useToast();

  const handleExport = (type: 'pdf' | 'csv') => {
    toast({
      title: "Exportação iniciada",
      description: `Relatório ${type.toUpperCase()} será baixado em instantes`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <AdminFilters showCohort />

      {/* Export Actions */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleExport('pdf')}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Exportar PDF
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleExport('csv')}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Retention Heatmap */}
      <RetentionHeatmap />

      {/* Funnel & Adherence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card className="hover:shadow-soft transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">Funil de Conversão</CardTitle>
            <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelData.map((stage, index) => (
                <div key={stage.stage} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{stage.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {stage.users.toLocaleString()}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {stage.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                  {index < funnelData.length - 1 && (
                    <div className="flex items-center justify-end mt-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {((funnelData[index + 1].percentage / stage.percentage) * 100).toFixed(1)}% conversão
                        {((funnelData[index + 1].percentage / stage.percentage) * 100) > 50 ? (
                          <TrendingUp className="w-3 h-3 text-success" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-destructive" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Adherence Trend */}
        <Card className="hover:shadow-soft transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">Aderência Média</CardTitle>
            <p className="text-sm text-muted-foreground">% concluídos/planejados por semana</p>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aderenciaData}>
                  <XAxis 
                    dataKey="week" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Aderência']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card className="hover:shadow-soft transition-shadow">
        <CardHeader>
          <CardTitle className="text-base">Distribuição de Status</CardTitle>
          <p className="text-sm text-muted-foreground">Medicações no período selecionado</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {statusDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                  </div>
                  <span className="text-lg font-semibold text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}