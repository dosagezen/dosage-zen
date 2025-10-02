import { useState } from "react";
import { BarChart3, Download, FileText, MessageCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useReportsData, ReportPeriod, ReportCategory } from "@/hooks/useReportsData";
import { useReportsInsights } from "@/hooks/useReportsInsights";
import { useReportsHistorical } from "@/hooks/useReportsHistorical";
import { useCollaboratorsList } from "@/hooks/useCollaboratorsList";
import { DateRangePickerDialog } from "@/components/DateRangePickerDialog";

const categoryMapping: Record<string, string> = {
  'medicacao': 'Medicações',
  'consulta': 'Consultas',
  'exame': 'Exames',
  'atividade': 'Atividades'
};

export default function Relatorios() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<ReportPeriod>('mes');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<ReportCategory>('todas');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState('paciente');
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  // Fetch real data
  const { summary, isLoading: loadingSummary } = useReportsData({
    period: periodoSelecionado,
    category: categoriaSelecionada,
    contextId: usuarioSelecionado === 'paciente' ? undefined : usuarioSelecionado,
    customRange
  });

  const { insights, isLoading: loadingInsights } = useReportsInsights(
    usuarioSelecionado === 'paciente' ? undefined : usuarioSelecionado
  );

  const { historical, isLoading: loadingHistorical } = useReportsHistorical(
    usuarioSelecionado === 'paciente' ? undefined : usuarioSelecionado
  );

  const { collaborators } = useCollaboratorsList();

  // Transform data for charts
  const statusData = [
    { name: 'Concluídos', value: summary.totals.concluidos, percentage: summary.totals.concluidos_pct, color: 'hsl(var(--success))' },
    { name: 'Retardatários', value: summary.totals.retardatarios, percentage: summary.totals.retardatarios_pct, color: 'hsl(var(--warning))' },
    { name: 'Faltando', value: summary.totals.faltando, percentage: summary.totals.faltando_pct, color: 'hsl(var(--primary))' },
    { name: 'Atrasados', value: summary.totals.atrasados, percentage: summary.totals.atrasados_pct, color: 'hsl(var(--destructive))' },
    { name: 'Excluídos', value: summary.totals.excluidos, percentage: summary.totals.excluidos_pct, color: 'hsl(var(--muted))' }
  ].filter(item => item.value > 0);

  const categoryData = Object.entries(summary.by_category).map(([category, data]) => ({
    name: categoryMapping[category] || category,
    planejados: data.planejados,
    concluidos: data.concluidos
  }));

  const handlePeriodoChange = (value: string) => {
    if (value === 'personalizado') {
      setShowDatePicker(true);
    } else {
      setPeriodoSelecionado(value as ReportPeriod);
      setCustomRange(undefined);
    }
  };

  const handleCustomRangeSelect = (range: { start: Date; end: Date }) => {
    setCustomRange(range);
    setPeriodoSelecionado('personalizado');
  };

  const handleExportPDF = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('export-reports-pdf', {
        body: {
          contextId: usuarioSelecionado === 'paciente' ? undefined : usuarioSelecionado,
          period: periodoSelecionado,
          category: categoriaSelecionada,
          rangeStart: customRange?.start.toISOString() || new Date().toISOString(),
          rangeEnd: customRange?.end.toISOString() || new Date().toISOString()
        }
      });

      if (response.error) throw response.error;

      // Create downloadable file from HTML
      const { htmlContent, filename } = response.data;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();

      toast({
        title: "PDF exportado com sucesso",
        description: "Seu relatório foi baixado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao exportar PDF",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('export-reports-excel', {
        body: {
          contextId: usuarioSelecionado === 'paciente' ? undefined : usuarioSelecionado,
          period: periodoSelecionado,
          category: categoriaSelecionada,
          rangeStart: customRange?.start.toISOString() || new Date().toISOString(),
          rangeEnd: customRange?.end.toISOString() || new Date().toISOString()
        }
      });

      if (response.error) throw response.error;

      // Download CSV
      const { csvContent, filename } = response.data;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();

      toast({
        title: "Excel exportado com sucesso",
        description: "Seu relatório foi baixado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao exportar Excel",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      toast({
        title: "Gerando relatório...",
        description: "Por favor, aguarde.",
      });

      const response = await supabase.functions.invoke('export-reports-pdf', {
        body: {
          contextId: usuarioSelecionado === 'paciente' ? undefined : usuarioSelecionado,
          period: periodoSelecionado,
          category: categoriaSelecionada,
          rangeStart: customRange?.start.toISOString() || new Date().toISOString(),
          rangeEnd: customRange?.end.toISOString() || new Date().toISOString()
        }
      });

      if (response.error) throw response.error;

      const { htmlContent, filename } = response.data;
      
      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();

      // Prepare WhatsApp message
      const userName = profile?.nome || 'Usuário';
      const periodText = periodoSelecionado === 'hoje' ? 'Hoje' : 
                        periodoSelecionado === 'semana' ? 'Semana' :
                        periodoSelecionado === 'mes' ? 'Mês' : 'Período Personalizado';
      
      const message = `🏥 *Relatório DosageZen*\n\nOlá! Compartilho com você meu relatório de saúde.\n\n📊 *Período:* ${periodText}\n📁 *Arquivo:* ${filename}\n\nO arquivo foi baixado e está pronto para ser anexado.\n\n_Gerado por DosageZen_`;
      
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      toast({
        title: "PDF baixado",
        description: "Agora anexe o arquivo no WhatsApp.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao compartilhar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const renderCustomizedLabel = (entry: any) => {
    return `${entry.value} (${entry.percentage}%)`;
  };

  const TrendIcon = ({ trend }: { trend?: 'up' | 'down' | 'neutral' }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-success" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const isLoading = loadingSummary || loadingInsights || loadingHistorical;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
              <p className="text-muted-foreground">Visualize métricas e análises de sua saúde</p>
            </div>
            
            {/* Export/Share Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="hidden sm:flex"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareWhatsApp}
                className="gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Período
              </label>
              <Select value={periodoSelecionado} onValueChange={handlePeriodoChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Semana</SelectItem>
                  <SelectItem value="mes">Mês</SelectItem>
                  <SelectItem value="personalizado">
                    {customRange ? `${customRange.start.toLocaleDateString()} - ${customRange.end.toLocaleDateString()}` : 'Personalizado'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Categoria
              </label>
              <Select value={categoriaSelecionada} onValueChange={(value) => setCategoriaSelecionada(value as ReportCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="medicacoes">Medicações</SelectItem>
                  <SelectItem value="consultas">Consultas</SelectItem>
                  <SelectItem value="exames">Exames</SelectItem>
                  <SelectItem value="atividades">Atividades</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Usuário
              </label>
              <Select value={usuarioSelecionado} onValueChange={setUsuarioSelecionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paciente">Paciente</SelectItem>
                  {collaborators.map(collab => (
                    <SelectItem key={collab.id} value={collab.id}>
                      {collab.nome} {collab.sobrenome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loadingInsights ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-16 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))
          ) : insights ? (
            <>
              <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">{insights.bestWeek.label}</div>
                  <div className="text-lg font-semibold text-success">{insights.bestWeek.value}</div>
                  <div className="text-xs text-muted-foreground">Melhor período</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Mais esquecido</div>
                  <div className="text-sm font-semibold text-foreground">{insights.mostForgotten.label}</div>
                  <div className="text-xs text-muted-foreground">{insights.mostForgotten.value}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Dias seguidos 100%</div>
                  <div className="text-lg font-semibold text-primary">{insights.consecutiveDays.value}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Tendência atual</div>
                  <div className="flex items-center gap-2">
                    <TrendIcon trend={insights.currentTrend.trend} />
                    <span className="text-sm font-semibold text-foreground">
                      {insights.currentTrend.value}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-primary rounded-md flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">📊</span>
                </div>
                Status dos Compromissos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="w-40 h-40 rounded-full" />
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any, name: string) => [`${value} (${statusData.find(d => d.name === name)?.percentage}%)`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-primary rounded-md flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">📈</span>
                </div>
                Planejados vs Concluídos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="planejados" 
                        fill="hsl(var(--primary))" 
                        name="Planejados"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar 
                        dataKey="concluidos" 
                        fill="hsl(var(--success))" 
                        name="Concluídos"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-primary rounded-md flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">📉</span>
                </div>
                Evolução da Adesão
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historical}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="mes" 
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                        formatter={(value: any) => [`${value}%`, 'Adesão']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="aderencia" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mobile Export Actions */}
        <div className="flex sm:hidden gap-2 mt-6">
          <Button onClick={handleExportPDF} className="flex-1">
            <FileText className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <DateRangePickerDialog
        open={showDatePicker}
        onOpenChange={setShowDatePicker}
        onSelect={handleCustomRangeSelect}
      />
    </div>
  );
}