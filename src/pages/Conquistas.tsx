import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Award, Target, Clock, XCircle, Filter, ChevronRight } from 'lucide-react';
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
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {periodos.map(periodo => (
          <Badge
            key={periodo.key}
            variant={periodoSelecionado === periodo.key ? 'default' : 'secondary'}
            className={`cursor-pointer px-3 py-1 ${
              periodoSelecionado === periodo.key 
                ? 'bg-conquistas-concluido text-conquistas-concluido-foreground hover:bg-conquistas-concluido/90' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
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
      <Card className="bg-conquistas-card-bg border-border">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold mb-2">
              Resumo {periodoSelecionado === 'hoje' ? 'Hoje' : 
                      periodoSelecionado === 'semana' ? 'Semana' :
                      periodoSelecionado === 'mes' ? 'Mês' : 'Histórico'}
            </h3>
            
            {/* Circular Progress - mais simples */}
            <div className="relative w-20 h-20 mx-auto mb-3">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  fill="transparent"
                  strokeDasharray={`${metricas.aderencia * 2.51} 251`}
                  className="text-conquistas-concluido"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-conquistas-concluido">{metricas.aderencia}%</span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">Progresso diário</p>
            <p className="text-sm font-medium text-foreground">
              {metricas.concluidos} de {metricas.total}
            </p>
          </div>

          {/* Barra empilhada com legenda inline */}
          <div className="mb-4">
            <div className="h-2 rounded-full overflow-hidden bg-gray-200 flex">
              <div 
                className="bg-conquistas-concluido h-full"
                style={{ width: `${metricas.percentuais.concluidos}%` }}
              ></div>
              <div 
                className="bg-conquistas-faltando h-full"
                style={{ width: `${metricas.percentuais.faltando}%` }}
              ></div>
              <div 
                className="bg-conquistas-atrasado h-full"
                style={{ width: `${metricas.percentuais.atrasados}%` }}
              ></div>
              <div 
                className="bg-conquistas-cancelado h-full"
                style={{ width: `${metricas.percentuais.cancelados}%` }}
              ></div>
            </div>
            
            {/* Legenda inline */}
            <div className="flex items-center justify-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-conquistas-concluido"></div>
                <span>Concluídos</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-conquistas-faltando"></div>
                <span>Faltando</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-conquistas-atrasado"></div>
                <span>Atrasados</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-conquistas-cancelado"></div>
                <span>Cancelados</span>
              </div>
            </div>
          </div>

          {/* Métricas em linha - simples como na imagem */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-conquistas-concluido mb-1">{metricas.percentuais.concluidos}%</div>
              <div className="text-sm font-medium text-conquistas-concluido">{metricas.concluidos}</div>
              <div className="text-xs text-muted-foreground">Concluídos</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-conquistas-faltando mb-1">{metricas.percentuais.faltando}%</div>
              <div className="text-sm font-medium text-conquistas-faltando">{metricas.faltando}</div>
              <div className="text-xs text-muted-foreground">Faltando</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-conquistas-atrasado mb-1">{metricas.percentuais.atrasados}%</div>
              <div className="text-sm font-medium text-conquistas-atrasado">{metricas.atrasados}</div>
              <div className="text-xs text-muted-foreground">Atrasados</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-conquistas-cancelado mb-1">{metricas.percentuais.cancelados}%</div>
              <div className="text-sm font-medium text-conquistas-cancelado">{metricas.cancelados}</div>
              <div className="text-xs text-muted-foreground">Cancelados</div>
            </div>
          </div>

          <Button 
            onClick={scrollToGraficos} 
            className="w-full bg-conquistas-concluido hover:bg-conquistas-concluido/90 text-conquistas-concluido-foreground"
          >
            Ver análise detalhada
            <ChevronRight className="w-4 h-4 ml-2" />
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
        <h3 className="text-lg font-semibold text-conquistas-concluido">Progresso - Hoje</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categorias.map((categoria) => {
            return (
              <Card key={categoria.key} className="p-4 bg-conquistas-card-bg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-foreground">{categoria.label}</span>
                  <span className="text-sm text-conquistas-concluido font-medium">
                    {categoria.planejados} planejados / {categoria.concluidos} concluídos - {categoria.aderencia}%
                  </span>
                </div>
                <Progress 
                  value={categoria.aderencia} 
                  className="h-2" 
                />
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
        { name: 'Concluídos', value: metricas.concluidos, color: 'hsl(var(--conquistas-concluido))' },
        { name: 'Faltando', value: metricas.faltando, color: 'hsl(var(--conquistas-faltando))' },
        { name: 'Atrasados', value: metricas.atrasados, color: 'hsl(var(--conquistas-atrasado))' },
        { name: 'Cancelados', value: metricas.cancelados, color: 'hsl(var(--conquistas-cancelado))' }
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
            <div>
              <h1 className="text-2xl font-bold text-foreground">Minhas Conquistas</h1>
              <p className="text-sm text-conquistas-concluido font-medium">Resumo de compromissos concluídos</p>
            </div>
            
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