import { useState } from "react";
import { BarChart3, Download, FileText, MessageCircle, TrendingUp, TrendingDown, Minus, PieChart as PieChartIcon, Activity, Info } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

  // Transform data for charts - using exact colors from Conquistas page
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

  // Define order for categories in chart
  const categoryOrder = ['medicacao', 'consulta', 'exame', 'atividade'];
  
  const categoryData = categoryOrder
    .filter(category => summary.by_category[category]) // Only include categories with data
    .map(category => ({
      name: categoryMapping[category] || category,
      planejados: summary.by_category[category].planejados,
      concluidos: summary.by_category[category].concluidos
    }));

  // Hierarchical status data: Retardatários is a subset of Concluídos
  const concluidosNoPrazo = summary.totals.concluidos - summary.totals.retardatarios;
  
  const statusBarData = [
    { name: 'Planejados', value: summary.totals.planejados, color: 'hsl(217 91% 60%)', isSubcategory: false },
    { name: 'Concluídos', value: summary.totals.concluidos, color: 'hsl(134 66% 30%)', isSubcategory: false, tooltip: `${summary.totals.concluidos} itens (${concluidosNoPrazo} no prazo + ${summary.totals.retardatarios} retardatários)` },
    { name: '↳ Retardatários', value: summary.totals.retardatarios, color: 'hsl(38 92% 50%)', isSubcategory: true, tooltip: 'Subconjunto de concluídos com atraso > 30min' },
    { name: 'Pendentes', value: summary.totals.faltando, color: 'hsl(142 76% 50%)', isSubcategory: false },
    { name: 'Atrasados', value: summary.totals.atrasados, color: 'hsl(25 95% 53%)', isSubcategory: false },
    { name: 'Cancelados', value: summary.totals.excluidos, color: 'hsl(350 89% 60%)', isSubcategory: false }
  ];

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

      toast({
        title: "Gerando PDF...",
        description: "Por favor, aguarde.",
      });

      const response = await supabase.functions.invoke('export-reports-pdf', {
        body: {
          contextId: usuarioSelecionado === 'paciente' ? profile?.id : usuarioSelecionado,
          period: periodoSelecionado,
          category: categoriaSelecionada,
          rangeStart: customRange?.start.toISOString() || new Date().toISOString(),
          rangeEnd: customRange?.end.toISOString() || new Date().toISOString()
        }
      });

      if (response.error) throw response.error;

      const { htmlContent, filename } = response.data;
      
      // Dynamically import html2pdf.js
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Create temporary container and render HTML
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '210mm';
      document.body.appendChild(container);

      // Wait a moment for rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      // Convert to PDF with proper configuration
      const opt: any = {
        margin: [10, 10, 10, 10],
        filename: filename.replace('.pdf', '') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          letterRendering: true,
          logging: false
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(container).save();

      // Cleanup
      document.body.removeChild(container);

      toast({
        title: "PDF exportado com sucesso",
        description: "Seu relatório foi baixado.",
      });
    } catch (error: any) {
      console.error('PDF export error:', error);
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
          contextId: usuarioSelecionado === 'paciente' ? profile?.id : usuarioSelecionado,
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
        title: "Gerando PDF...",
        description: "Por favor, aguarde.",
      });

      const response = await supabase.functions.invoke('export-reports-pdf', {
        body: {
          contextId: usuarioSelecionado === 'paciente' ? profile?.id : usuarioSelecionado,
          period: periodoSelecionado,
          category: categoriaSelecionada,
          rangeStart: customRange?.start.toISOString() || new Date().toISOString(),
          rangeEnd: customRange?.end.toISOString() || new Date().toISOString()
        }
      });

      if (response.error) throw response.error;

      const { htmlContent, filename } = response.data;
      
      // Dynamically import html2pdf.js
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Create temporary container and render HTML
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '210mm';
      document.body.appendChild(container);

      // Wait a moment for rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      // Convert to PDF with proper configuration
      const opt: any = {
        margin: [10, 10, 10, 10],
        filename: filename.replace('.pdf', '') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          letterRendering: true,
          logging: false
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(container).save();

      // Cleanup
      document.body.removeChild(container);

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
      console.error('WhatsApp share error:', error);
      toast({
        title: "Erro ao compartilhar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, value, percentage, name } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 35;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Determinar alinhamento do texto baseado na posição
    const textAnchor = x > cx ? 'start' : 'end';
    
    // Cor baseada na percentagem: azul escuro >= 65%, laranja < 65%
    const percentageColor = percentage >= 65 ? 'hsl(217 91% 40%)' : 'hsl(25 95% 53%)';

    return (
      <g>
        {/* Números absolutos e percentuais na primeira linha */}
        <text
          x={x}
          y={y - 8}
          fill={percentageColor}
          textAnchor={textAnchor}
          dominantBaseline="central"
          fontSize="13"
          fontWeight="700"
        >
          {value} ({percentage}%)
        </text>
        {/* Nome/legenda na segunda linha, alinhada à direita dos números */}
        <text
          x={x}
          y={y + 8}
          fill="hsl(var(--muted-foreground))"
          textAnchor={textAnchor}
          dominantBaseline="central"
          fontSize="11"
          fontWeight="500"
        >
          {name}
        </text>
      </g>
    );
  };

  const TrendIcon = ({ trend }: { trend?: 'up' | 'down' | 'neutral' }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-success" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getPeriodoLabel = () => {
    if (customRange) {
      const start = customRange.start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      const end = customRange.end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
      return `${start} - ${end}`;
    }
    
    const labels: Record<ReportPeriod, string> = {
      'hoje': 'Hoje',
      'semana': 'Última Semana',
      'mes': 'Mês Vigente (Outubro 2025)',
      'personalizado': 'Período Personalizado'
    };
    
    return labels[periodoSelecionado] || periodoSelecionado;
  };

  const getCategoriaLabel = () => {
    if (categoriaSelecionada === 'todas') return 'Todas as Categorias';
    return categoryMapping[categoriaSelecionada] || categoriaSelecionada;
  };

  const getPerfilLabel = () => {
    if (usuarioSelecionado === 'paciente') {
      return profile?.nome || 'Meu Perfil';
    }
    
    const colaborador = collaborators.find(c => c.id === usuarioSelecionado);
    return colaborador ? `${colaborador.nome} ${colaborador.sobrenome}` : 'Colaborador';
  };

  const isLoading = loadingSummary || loadingInsights || loadingHistorical;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between mb-6">
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
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
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
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Perfil
              </label>
              <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                Paciente
              </div>
            </div>

            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Categoria
              </label>
              <Select value={categoriaSelecionada} onValueChange={(value) => setCategoriaSelecionada(value as ReportCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="medicacao">Medicações</SelectItem>
                  <SelectItem value="consulta">Consultas</SelectItem>
                  <SelectItem value="exame">Exames</SelectItem>
                  <SelectItem value="atividade">Atividades</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[180px]">
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
                  <SelectItem value="mes">Mês Vigente</SelectItem>
                  <SelectItem value="personalizado">
                    {customRange ? `${customRange.start.toLocaleDateString()} - ${customRange.end.toLocaleDateString()}` : 'Personalizado'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPeriodoSelecionado('mes');
                setCategoriaSelecionada('todas');
                setUsuarioSelecionado('paciente');
                setCustomRange(undefined);
              }}
            >
              Limpar
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Contexto do Relatório */}
        <div className="mt-[30px] mb-6">
          <Card className="bg-[#f77f00] dark:bg-[#f77f00] border-2 border-[#f77f00]">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2 underline decoration-1 underline-offset-[4px]">
                    Contexto do Relatório
                  </h3>
                  <p className="text-sm text-white/90 leading-relaxed">
                    Exibindo dados de <span className="font-semibold text-white">{getCategoriaLabel()}</span> no período de <span className="font-semibold text-white">{getPeriodoLabel()}</span> para o perfil de <span className="font-semibold text-white">{getPerfilLabel()}</span>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
          {/* Status Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-md flex items-center justify-center">
                  <PieChartIcon className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Status dos Compromissos
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Distribuição por status de conclusão
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="w-40 h-40 rounded-full" />
                </div>
              ) : (
                <>
                  <div className="h-96 sm:h-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={70}
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
                </>
              )}
            </CardContent>
          </Card>

          {/* Planejamento Pie Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-md flex items-center justify-center">
                  <PieChartIcon className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Visão Geral de Planejamento
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Total planejado, concluído e cancelado
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="w-40 h-40 rounded-full" />
                </div>
              ) : (
                <div className="h-96 sm:h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                      <Pie
                        data={planejamentoData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {planejamentoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any, name: string) => [`${value} (${planejamentoData.find(d => d.name === name)?.percentage}%)`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Horizontal Bar Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-md flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Distribuição de Status
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Visão consolidada de todos os status
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : (
                <>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusBarData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          stroke="hsl(var(--muted-foreground))"
                          width={100}
                          fontSize={11}
                          tick={(props) => {
                            const { x, y, payload } = props;
                            const entry = statusBarData.find(d => d.name === payload.value);
                            const isIndented = entry?.isSubcategory;
                            
                            // Truncate long labels on mobile
                            const label = payload.value.length > 12 
                              ? payload.value.substring(0, 10) + '...'
                              : payload.value;
                            
                            return (
                              <g transform={`translate(${x},${y})`}>
                                <text
                                  x={0}
                                  y={0}
                                  dy={4}
                                  textAnchor="end"
                                  fill="hsl(var(--muted-foreground))"
                                  fontSize={isIndented ? 10 : 11}
                                  fontStyle={isIndented ? 'italic' : 'normal'}
                                >
                                  {label}
                                </text>
                              </g>
                            );
                          }}
                        />
                        <Tooltip 
                          content={(props) => {
                            const { active, payload } = props;
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-popover border border-border rounded-md p-3 shadow-lg">
                                  <p className="font-semibold text-sm mb-1">{data.name.replace('↳ ', '')}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {data.tooltip || `${data.value} itens`}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {statusBarData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color}
                              opacity={entry.isSubcategory ? 0.85 : 1}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <TooltipProvider>
                    <div className="flex items-start gap-2 mt-4 p-3 bg-muted/50 rounded-md">
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-muted-foreground mt-0.5 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">
                            Retardatários são itens concluídos com mais de 30 minutos de atraso em relação ao horário planejado.
                          </p>
                        </TooltipContent>
                      </UITooltip>
                      <p className="text-xs text-muted-foreground italic">
                        <strong>Retardatários</strong> são uma subcategoria de <strong>Concluídos</strong> (itens concluídos com atraso {'>'} 30min)
                      </p>
                    </div>
                  </TooltipProvider>
                </>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-md flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Planejados vs Concluídos
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Comparativo por categoria
                  </p>
                </div>
              </div>
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
                        fontSize={11}
                        angle={-15}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      />
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
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-md flex items-center justify-center">
                  <Activity className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Evolução da Adesão
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tendência de adesão ao longo do tempo
                  </p>
                </div>
              </div>
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
                        fontSize={11}
                        angle={-15}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        fontSize={11}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          fontSize: '12px',
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