import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Award, Target, Clock, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { useConquests, ConquestPeriod, ConquestCategory } from "@/hooks/useConquests";

type Periodo = ConquestPeriod;
type Categoria = ConquestCategory;

// Labels for category selection

const CATEGORIA_LABELS = {
  todas: 'Todas as categorias',
  medicacao: 'Medicações',
  consulta: 'Consultas',
  exame: 'Exames',
  atividade: 'Atividades'
};

export default function Conquistas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [periodoSelecionado, setPeriodoSelecionado] = useState<Periodo>(() => {
    return (searchParams.get('periodo') as Periodo) || 'hoje';
  });

  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<Categoria>(() => {
    return (searchParams.get('categoria') as Categoria) || 'todas';
  });

  // Hook to fetch real data
  const { summary, isLoading, error } = useConquests({
    period: periodoSelecionado,
    category: categoriasSelecionadas
  });

  // Sincronia com URL
  useEffect(() => {
    const periodo = searchParams.get('periodo') as Periodo;
    const categoria = searchParams.get('categoria') as Categoria;
    
    if (periodo && periodo !== periodoSelecionado) {
      setPeriodoSelecionado(periodo);
    }
    if (categoria && categoria !== categoriasSelecionadas) {
      setCategoriasSelecionadas(categoria);
    }
  }, [searchParams]);

  const updateFilters = (newPeriodo?: Periodo, newCategoria?: Categoria) => {
    const params = new URLSearchParams(searchParams);
    
    if (newPeriodo) {
      params.set('periodo', newPeriodo);
      setPeriodoSelecionado(newPeriodo);
    }
    
    if (newCategoria) {
      params.set('categoria', newCategoria);
      setCategoriasSelecionadas(newCategoria);
    }
    
    setSearchParams(params);
  };

  // Use real data from useConquests hook for all periods
  const dadosFiltrados = summary;

  const scrollToGraficos = () => {
    const elemento = document.getElementById('graficos');
    elemento?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderPeriodChips = () => {
    const periodos = [
      { key: 'hoje', label: 'Hoje' },
      { key: 'semana', label: 'Semana' },
      { key: 'mes', label: 'Mês' },
      { key: 'historico', label: 'Histórico' }
    ];

    return (
      <div className="flex flex-wrap gap-2">
        {periodos.map(periodo => (
          <Badge
            key={periodo.key}
            variant={periodoSelecionado === periodo.key ? 'default' : 'secondary'}
            className="cursor-pointer px-3 py-1"
            onClick={() => updateFilters(periodo.key as Periodo, categoriasSelecionadas)}
          >
            {periodo.label}
          </Badge>
        ))}
      </div>
    );
  };

  const renderCategoriaSelect = () => {
    return (
      <Select
        value={categoriasSelecionadas}
        onValueChange={(value) => updateFilters(periodoSelecionado, value as Categoria)}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Selecionar categoria" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(CATEGORIA_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const calcularMetricas = () => {
    const dados = dadosFiltrados;
    if (!dados || Array.isArray(dados) || typeof dados !== 'object') return null;
    
    // Type guard to ensure we have the right data structure
    if (!('planejados' in dados)) return null;
    
    const total = dados.planejados;
    
    return {
      concluidos: dados.concluidos,
      faltando: dados.faltando,
      atrasados: dados.atrasados,
      cancelados: dados.cancelados,
      total,
      aderencia: dados.aderencia_pct,
      percentuais: {
        concluidos: total > 0 ? Math.round((dados.concluidos / total) * 100) : 0,
        faltando: total > 0 ? Math.round((dados.faltando / total) * 100) : 0,
        atrasados: total > 0 ? Math.round((dados.atrasados / total) * 100) : 0,
        cancelados: total > 0 ? Math.round((dados.cancelados / total) * 100) : 0,
      }
    };
  };

  const renderResumoCard = () => {
    const metricas = calcularMetricas();
    
    if (!metricas) return null;

    return (
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold mb-2">
              Resumo {periodoSelecionado === 'hoje' ? 'Hoje' : 
                      periodoSelecionado === 'semana' ? 'Semana' :
                      periodoSelecionado === 'mes' ? 'Mês' : 'Histórico'}
            </h3>
            
            {/* Circular Progress */}
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
              <div 
                className="absolute inset-0 rounded-full border-4 border-primary border-l-transparent transform rotate-90"
                style={{
                  background: `conic-gradient(from 90deg, hsl(var(--primary)) ${metricas.aderencia * 3.6}deg, transparent 0deg)`
                }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{metricas.aderencia}%</span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {metricas.concluidos} de {metricas.total}
            </p>
          </div>

          {/* Barra empilhada */}
          <div className="mb-4">
            <div className="h-3 rounded-full overflow-hidden bg-muted flex">
              <div 
                className="bg-primary h-full"
                style={{ width: `${metricas.percentuais.concluidos}%` }}
              ></div>
              <div 
                className="bg-blue-500 h-full"
                style={{ width: `${metricas.percentuais.faltando}%` }}
              ></div>
              <div 
                className="bg-destructive h-full"
                style={{ width: `${metricas.percentuais.atrasados}%` }}
              ></div>
              <div 
                className="bg-muted-foreground h-full"
                style={{ width: `${metricas.percentuais.cancelados}%` }}
              ></div>
            </div>
          </div>

          {/* Métricas em linha */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center p-2 bg-primary/10 rounded-lg relative">
              <span className="absolute top-1 right-1 text-xs text-primary bg-primary/20 px-1 rounded">
                {metricas.percentuais.concluidos}%
              </span>
              <div className="flex items-center justify-center mb-1">
                <Award className="w-4 h-4 text-primary" />
              </div>
              <div className="text-lg font-semibold text-primary">{metricas.concluidos}</div>
              <div className="text-xs text-primary/80">Concluídos</div>
            </div>
            
            <div className="text-center p-2 bg-blue-50 rounded-lg relative">
              <span className="absolute top-1 right-1 text-xs text-blue-600 bg-blue-100 px-1 rounded">
                {metricas.percentuais.faltando}%
              </span>
              <div className="flex items-center justify-center mb-1">
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-lg font-semibold text-blue-700">{metricas.faltando}</div>
              <div className="text-xs text-blue-600">Faltando</div>
            </div>
            
            <div className="text-center p-2 bg-destructive/10 rounded-lg relative">
              <span className="absolute top-1 right-1 text-xs text-destructive bg-destructive/20 px-1 rounded">
                {metricas.percentuais.atrasados}%
              </span>
              <div className="flex items-center justify-center mb-1">
                <Clock className="w-4 h-4 text-destructive" />
              </div>
              <div className="text-lg font-semibold text-destructive">{metricas.atrasados}</div>
              <div className="text-xs text-destructive/80">Atrasados</div>
            </div>
            
            <div className="text-center p-2 bg-muted rounded-lg relative">
              <span className="absolute top-1 right-1 text-xs text-muted-foreground bg-muted-foreground/20 px-1 rounded">
                {metricas.percentuais.cancelados}%
              </span>
              <div className="flex items-center justify-center mb-1">
                <XCircle className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-lg font-semibold text-muted-foreground">{metricas.cancelados}</div>
              <div className="text-xs text-muted-foreground">Cancelados</div>
            </div>
          </div>

          <Button 
            onClick={scrollToGraficos} 
            className="w-full"
            variant="outline"
          >
            Ver análise detalhada
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderMiniCards = () => {
    if (Array.isArray(dadosFiltrados) || !dadosFiltrados || typeof dadosFiltrados !== 'object') return null;
    if (!('by_category' in dadosFiltrados) || categoriasSelecionadas !== 'todas') return null;

    const categorias = Object.entries(dadosFiltrados.by_category).map(([key, data]: [string, any]) => ({
      key,
      label: CATEGORIA_LABELS[key as keyof typeof CATEGORIA_LABELS] || key,
      planejados: data.planejados,
      concluidos: data.concluidos,
      aderencia: data.aderencia_pct
    })).filter(cat => cat.planejados > 0);

    if (categorias.length === 0) return null;

    return (
      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-semibold">Progresso por Categoria</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categorias.map((categoria) => {
            return (
              <Card key={categoria.key} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{categoria.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {categoria.concluidos}/{categoria.planejados}
                  </span>
                </div>
                <Progress value={categoria.aderencia} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {categoria.aderencia}% concluído
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderGraficos = () => {
    if (!dadosFiltrados || typeof dadosFiltrados !== 'object') {
      return (
        <div className="space-y-6">
          <p className="text-muted-foreground text-center">
            Dados não disponíveis para gráficos detalhados
          </p>
        </div>
      );
    }

    // For "hoje", show current summary in a visual format
    if (periodoSelecionado === 'hoje') {
      const metricas = calcularMetricas();
      if (!metricas) return null;

      const pieData = [
        { name: 'Concluídos', value: metricas.concluidos, color: 'hsl(var(--primary))' },
        { name: 'Faltando', value: metricas.faltando, color: '#3b82f6' },
        { name: 'Atrasados', value: metricas.atrasados, color: 'hsl(var(--destructive))' },
        { name: 'Cancelados', value: metricas.cancelados, color: 'hsl(var(--muted-foreground))' }
      ].filter(item => item.value > 0);

      if (pieData.length === 0) {
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground text-center">
              Nenhum compromisso registrado para hoje
            </p>
          </div>
        );
      }

      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    // For other periods, show informative message about future chart implementations
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground text-center">
          Gráficos históricos para {periodoSelecionado} serão implementados em breve.
          <br />
          Use os dados resumidos acima para acompanhar seu progresso.
        </p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col space-y-4">
              <h1 className="text-2xl font-bold">Conquistas</h1>
              <div className="flex gap-2">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-8 w-20" />)}
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6 space-y-8">
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col space-y-4">
            <h1 className="text-2xl font-bold">Conquistas</h1>
            
            {/* Chips de período */}
            {renderPeriodChips()}
            
            {/* Seletor de categoria */}
            {renderCategoriaSelect()}
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 py-6 space-y-8">
        {renderResumoCard()}
        {renderMiniCards()}
        
        {/* Seção de gráficos */}
        <div id="graficos" className="space-y-6">
          <h2 className="text-xl font-semibold">
            Progresso - {periodoSelecionado.charAt(0).toUpperCase() + periodoSelecionado.slice(1)}
          </h2>
          {renderGraficos()}
        </div>
      </div>
    </div>
  );
}