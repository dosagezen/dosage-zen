import { useState, useMemo } from "react";
import { BarChart3, Share2, Download, FileText, MessageCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";

// Mock data
const statusData = [
  { name: 'Concluídos', value: 28, percentage: 70, color: 'hsl(var(--success))' },
  { name: 'Faltando', value: 6, percentage: 15, color: 'hsl(var(--primary))' },
  { name: 'Atrasados', value: 4, percentage: 10, color: 'hsl(var(--warning))' },
  { name: 'Excluídos', value: 2, percentage: 5, color: 'hsl(var(--destructive))' }
];

const categoryData = [
  { name: 'Medicações', planejados: 20, concluidos: 15, icon: '💊' },
  { name: 'Consultas', planejados: 5, concluidos: 4, icon: '🩺' },
  { name: 'Exames', planejados: 7, concluidos: 6, icon: '🔬' },
  { name: 'Atividades', planejados: 8, concluidos: 3, icon: '🏋️' }
];

const trendData = [
  { mes: 'Jul', adesao: 68 },
  { mes: 'Ago', adesao: 75 },
  { mes: 'Set', adesao: 78 },
  { mes: 'Out', adesao: 82 }
];

const insightsData = {
  melhorSemana: { periodo: '1ª semana de setembro', adesao: 90 },
  maisEsquecido: 'Medicações noturnas',
  diasSeguidos: 3,
  tendencia: 'melhorando'
};

export default function Relatorios() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('todas');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState('paciente');
  const { toast } = useToast();

  const dadosFiltrados = useMemo(() => {
    // Em uma implementação real, aqui filtraríamos os dados baseado nos filtros
    return {
      status: statusData,
      categorias: categoryData,
      tendencia: trendData
    };
  }, [periodoSelecionado, categoriaSelecionada, usuarioSelecionado]);

  const handleExportPDF = () => {
    toast({
      title: "Exportação iniciada",
      description: "Seu relatório em PDF será baixado em instantes.",
    });
  };

  const handleExportExcel = () => {
    toast({
      title: "Exportação iniciada", 
      description: "Seu relatório em Excel será baixado em instantes.",
    });
  };

  const handleShareWhatsApp = () => {
    toast({
      title: "Link copiado",
      description: "Link do relatório copiado para compartilhar no WhatsApp.",
    });
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copiado",
      description: "Link do relatório copiado para a área de transferência.",
    });
  };

  const renderCustomizedLabel = (entry: any) => {
    return `${entry.value} (${entry.percentage}%)`;
  };

  const TrendIcon = () => {
    if (insightsData.tendencia === 'melhorando') return <TrendingUp className="w-4 h-4 text-success" />;
    if (insightsData.tendencia === 'piorando') return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-primary">Relatórios</h1>
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
                onClick={handleExportExcel}
                className="hidden sm:flex"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Select onValueChange={(value) => {
                if (value === 'whatsapp') handleShareWhatsApp();
                if (value === 'link') handleShareLink();
              }}>
                <SelectTrigger className="w-auto">
                  <Share2 className="w-4 h-4" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </div>
                  </SelectItem>
                  <SelectItem value="link">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4" />
                      Copiar Link
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Período
              </label>
              <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Semana</SelectItem>
                  <SelectItem value="mes">Mês</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Categoria
              </label>
              <Select value={categoriaSelecionada} onValueChange={setCategoriaSelecionada}>
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
                  <SelectItem value="colaboradores">Colaboradores</SelectItem>
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
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Melhor semana</div>
              <div className="text-lg font-semibold text-success">{insightsData.melhorSemana.adesao}%</div>
              <div className="text-xs text-muted-foreground">{insightsData.melhorSemana.periodo}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Mais esquecido</div>
              <div className="text-sm font-semibold text-foreground">{insightsData.maisEsquecido}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Dias seguidos 100%</div>
              <div className="text-lg font-semibold text-primary">{insightsData.diasSeguidos}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Tendência atual</div>
              <div className="flex items-center gap-2">
                <TrendIcon />
                <span className="text-sm font-semibold text-foreground capitalize">
                  {insightsData.tendencia}
                </span>
              </div>
            </CardContent>
          </Card>
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
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosFiltrados.status}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosFiltrados.status.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any, name: string) => [`${value} (${dadosFiltrados.status.find(d => d.name === name)?.percentage}%)`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
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
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosFiltrados.categorias}>
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
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosFiltrados.tendencia}>
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
                      dataKey="adesao" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
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
    </div>
  );
}