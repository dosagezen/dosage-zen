import { useParams } from "react-router-dom";
import { usePublicReportData } from "@/hooks/usePublicReportData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const categoryMapping: Record<string, string> = {
  'medicacao': 'Medicações',
  'consulta': 'Consultas',
  'exame': 'Exames',
  'atividade': 'Atividades'
};

const PublicReportView = () => {
  const { id } = useParams<{ id: string }>();
  const { reportData, isLoading, error } = usePublicReportData(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-purple-100 dark:from-primary/5 dark:to-purple-950 p-4 sm:p-6">
        <div className="container max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-100 dark:from-primary/5 dark:to-purple-950 p-4">
        <div className="text-center space-y-4 max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground px-2">Relatório não encontrado</h1>
          <p className="text-sm sm:text-base text-muted-foreground px-2">
            Este relatório pode ter expirado ou não existe mais.
          </p>
        </div>
      </div>
    );
  }

  const { summary, insights, historical, profile, metadata } = reportData;

  // Transform data for charts - using exact colors
  const statusData = [
    { name: 'Concluídos', value: summary.totals.concluidos, percentage: summary.totals.concluidos_pct, color: 'hsl(134 66% 30%)' },
    { name: 'Pendentes', value: summary.totals.faltando, percentage: summary.totals.faltando_pct, color: 'hsl(142 76% 50%)' },
    { name: 'Atrasados', value: summary.totals.atrasados, percentage: summary.totals.atrasados_pct, color: 'hsl(25 95% 53%)' },
    { name: 'Cancelados', value: summary.totals.excluidos, percentage: summary.totals.excluidos_pct, color: 'hsl(350 89% 60%)' },
    { name: 'Retardatários', value: summary.totals.retardatarios, percentage: summary.totals.retardatarios_pct, color: 'hsl(38 92% 50%)' }
  ].filter(item => item.value > 0);

  const planejamentoData = [
    { name: 'Planejados', value: summary.totals.planejados, percentage: 100, color: 'hsl(217 91% 60%)' },
    { name: 'Concluídos', value: summary.totals.concluidos, percentage: summary.totals.concluidos_pct, color: 'hsl(134 66% 30%)' },
    { name: 'Cancelados', value: summary.totals.excluidos, percentage: summary.totals.excluidos_pct, color: 'hsl(350 89% 60%)' }
  ].filter(item => item.value > 0);

  const categoryOrder = ['medicacao', 'consulta', 'exame', 'atividade'];
  const categoryData = categoryOrder
    .filter(category => summary.by_category[category])
    .map(category => ({
      name: categoryMapping[category] || category,
      planejados: summary.by_category[category].planejados,
      concluidos: summary.by_category[category].concluidos
    }));

  const concluidosNoPrazo = summary.totals.concluidos - summary.totals.retardatarios;
  const statusBarData = [
    { name: 'Planejados', value: summary.totals.planejados, color: 'hsl(217 91% 60%)', isSubcategory: false },
    { name: 'Concluídos', value: summary.totals.concluidos, color: 'hsl(134 66% 30%)', isSubcategory: false },
    { name: '↳ Retardatários', value: summary.totals.retardatarios, color: 'hsl(38 92% 50%)', isSubcategory: true },
    { name: 'Pendentes', value: summary.totals.faltando, color: 'hsl(142 76% 50%)', isSubcategory: false },
    { name: 'Atrasados', value: summary.totals.atrasados, color: 'hsl(25 95% 53%)', isSubcategory: false },
    { name: 'Cancelados', value: summary.totals.excluidos, color: 'hsl(350 89% 60%)', isSubcategory: false }
  ];

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      'medicacao': 'Medicações',
      'consulta': 'Consultas',
      'exame': 'Exames',
      'atividade': 'Atividades',
      'N/A': 'Sem dados'
    };
    return labels[category] || category;
  };

  const getTrendIcon = () => {
    if (insights.trend.direction === 'subindo') return <TrendingUp className="h-4 w-4" />;
    if (insights.trend.direction === 'descendo') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendLabel = (): string => {
    if (insights.trend.direction === 'subindo') return `↑ ${insights.trend.value.toFixed(1)}%`;
    if (insights.trend.direction === 'descendo') return `↓ ${insights.trend.value.toFixed(1)}%`;
    return '→ Estável';
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs sm:text-sm font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-purple-100 dark:from-primary/5 dark:to-purple-950">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm sm:text-base">DZ</span>
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-foreground">Relatório de Saúde</h1>
                <p className="text-xs text-muted-foreground">{metadata.periodText} • {metadata.categoryText}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 pb-12">
        
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">👤 Informações do Paciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Nome:</span>
                <p className="text-foreground font-semibold">{profile.nome} {profile.sobrenome}</p>
              </div>
              {profile.email && (
                <div>
                  <span className="font-medium text-muted-foreground">E-mail:</span>
                  <p className="text-foreground">{profile.email}</p>
                </div>
              )}
              {profile.celular && (
                <div>
                  <span className="font-medium text-muted-foreground">Celular:</span>
                  <p className="text-foreground">{profile.celular}</p>
                </div>
              )}
              <div>
                <span className="font-medium text-muted-foreground">Data do Relatório:</span>
                <p className="text-foreground">{format(new Date(reportData.generatedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Metrics */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            📊 Resumo Geral
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="text-center space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Planejados</p>
                  <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(217 91% 60%)' }}>{summary.totals.planejados}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="text-center space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Concluídos</p>
                  <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(134 66% 30%)' }}>{summary.totals.concluidos}</p>
                  <p className="text-xs text-muted-foreground">{summary.totals.concluidos_pct}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="text-center space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Retardatários</p>
                  <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(38 92% 50%)' }}>{summary.totals.retardatarios}</p>
                  <p className="text-xs text-muted-foreground">{summary.totals.retardatarios_pct}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="text-center space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(142 76% 50%)' }}>{summary.totals.faltando}</p>
                  <p className="text-xs text-muted-foreground">{summary.totals.faltando_pct}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="text-center space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Atrasados</p>
                  <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(25 95% 53%)' }}>{summary.totals.atrasados}</p>
                  <p className="text-xs text-muted-foreground">{summary.totals.atrasados_pct}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="text-center space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Cancelados</p>
                  <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(350 89% 60%)' }}>{summary.totals.excluidos}</p>
                  <p className="text-xs text-muted-foreground">{summary.totals.excluidos_pct}%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Insights */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            💡 Insights e Análises
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">🏆 Melhor Período</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {insights.best_week.start_date 
                      ? format(new Date(insights.best_week.start_date), "dd 'de' MMM", { locale: ptBR })
                      : '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">{insights.best_week.adherence_pct}% de adesão</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">⚠️ Mais Esquecido</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">{getCategoryLabel(insights.most_forgotten.item)}</p>
                  <p className="text-sm text-muted-foreground">{insights.most_forgotten.missed_pct}% de faltas</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">🔥 Dias Consecutivos</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">{insights.consecutive_days}</p>
                  <p className="text-sm text-muted-foreground">100% de adesão</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">📈 Tendência</p>
                  <div className="flex items-center gap-2">
                    {getTrendIcon()}
                    <p className="text-lg sm:text-xl font-bold text-foreground">{getTrendLabel()}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Últimos 14 dias</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Charts Section */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            📈 Visualizações
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Status dos Compromissos - Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Status dos Compromissos</CardTitle>
              </CardHeader>
              <CardContent>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280} className="sm:h-80">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={window.innerWidth < 640 ? 80 : 100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string) => [value, name]}
                        contentStyle={{ fontSize: window.innerWidth < 640 ? '12px' : '14px' }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: window.innerWidth < 640 ? '11px' : '13px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                    Sem dados para exibir
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visão Geral de Planejamento - Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Visão Geral de Planejamento</CardTitle>
              </CardHeader>
              <CardContent>
                {planejamentoData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280} className="sm:h-80">
                    <PieChart>
                      <Pie
                        data={planejamentoData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={window.innerWidth < 640 ? 80 : 100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {planejamentoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string) => [value, name]}
                        contentStyle={{ fontSize: window.innerWidth < 640 ? '12px' : '14px' }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: window.innerWidth < 640 ? '11px' : '13px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                    Sem dados para exibir
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Distribuição de Status - Horizontal Bar Chart */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Distribuição de Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280} className="sm:h-80">
                  <BarChart 
                    data={statusBarData} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: window.innerWidth < 640 ? 10 : 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" style={{ fontSize: window.innerWidth < 640 ? '11px' : '12px' }} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={window.innerWidth < 640 ? 90 : 120}
                      style={{ fontSize: window.innerWidth < 640 ? '10px' : '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ fontSize: window.innerWidth < 640 ? '11px' : '13px' }}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                      {statusBarData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Planejados vs Concluídos - Bar Chart */}
            {categoryData.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Planejados vs Concluídos por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280} className="sm:h-80">
                    <BarChart 
                      data={categoryData}
                      margin={{ top: 5, right: 30, left: window.innerWidth < 640 ? 10 : 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={window.innerWidth < 640 ? -25 : 0}
                        textAnchor={window.innerWidth < 640 ? "end" : "middle"}
                        height={window.innerWidth < 640 ? 60 : 30}
                        style={{ fontSize: window.innerWidth < 640 ? '10px' : '12px' }}
                      />
                      <YAxis style={{ fontSize: window.innerWidth < 640 ? '11px' : '12px' }} />
                      <Tooltip 
                        contentStyle={{ fontSize: window.innerWidth < 640 ? '11px' : '13px' }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: window.innerWidth < 640 ? '11px' : '13px' }}
                      />
                      <Bar dataKey="planejados" fill="hsl(217 91% 60%)" name="Planejados" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="concluidos" fill="hsl(134 66% 30%)" name="Concluídos" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Evolução da Adesão - Line Chart */}
            {historical.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Evolução da Adesão</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280} className="sm:h-80">
                    <LineChart 
                      data={historical}
                      margin={{ top: 5, right: 30, left: window.innerWidth < 640 ? 0 : 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="mes" 
                        style={{ fontSize: window.innerWidth < 640 ? '10px' : '12px' }}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        style={{ fontSize: window.innerWidth < 640 ? '11px' : '12px' }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, 'Adesão']}
                        contentStyle={{ fontSize: window.innerWidth < 640 ? '11px' : '13px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="aderencia" 
                        stroke="hsl(217 91% 60%)" 
                        strokeWidth={2}
                        dot={{ r: window.innerWidth < 640 ? 3 : 4 }}
                        activeDot={{ r: window.innerWidth < 640 ? 6 : 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-6 border-t border-border mt-8">
          <p className="text-sm text-muted-foreground">
            Gerado em {format(new Date(reportData.generatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            DosageZen - Gestão Inteligente de Saúde
          </p>
        </footer>
      </div>
    </div>
  );
};

export default PublicReportView;
