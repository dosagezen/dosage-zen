import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, BarChart3 } from 'lucide-react';
import { useConquests } from '@/hooks/useConquests';
import { HistoricalChart } from '@/components/HistoricalChart';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Period = 'hoje' | 'semana' | 'mes' | 'historico';

const PERIOD_LABELS = {
  hoje: 'Hoje',
  semana: 'Semana',
  mes: 'Mês',
  historico: 'Histórico'
} as const;

export default function Conquistas() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(() => {
    return (searchParams.get('periodo') as Period) || 'hoje';
  });

  const { summary, isLoading, error } = useConquests({
    period: selectedPeriod,
    category: 'todas'
  });

  const updateFilters = (newPeriod: Period) => {
    const params = new URLSearchParams(searchParams);
    params.set('periodo', newPeriod);
    setSearchParams(params);
    setSelectedPeriod(newPeriod);
  };

  const renderFilterChips = () => {
    const periods = [
      { value: 'hoje' as Period, label: 'Hoje' },
      { value: 'semana' as Period, label: 'Semana' },
      { value: 'mes' as Period, label: 'Mês' },
      { value: 'historico' as Period, label: 'Histórico' }
    ];

    return (
      <div className="flex items-center gap-2 flex-wrap">
        {periods.map((period) => {
          const isActive = selectedPeriod === period.value;
          
          return (
            <button
              key={period.value}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
                isActive
                  ? "bg-[#344E41] text-white"
                  : "bg-[#DAD7CD] text-[#344E41] hover:bg-[#B8B5A7]"
              )}
              onClick={() => updateFilters(period.value)}
            >
              {period.label}
            </button>
          );
        })}
      </div>
    );
  };

  const calcularMetricas = () => {
    if (!summary) return { concluidos: 0, faltando: 0, atrasados: 0, cancelados: 0, total: 0, percentual: 0 };
    
    const total = summary.planejados || 0;
    const concluidos = summary.concluidos || 0;
    const faltando = summary.faltando || 0;
    const atrasados = summary.atrasados || 0;
    const cancelados = summary.cancelados || 0;
    
    return {
      concluidos,
      faltando,
      atrasados,
      cancelados,
      total,
      percentual: total > 0 ? Math.round((concluidos / total) * 100) : 0
    };
  };

  const renderResumoCard = () => {
    if (isLoading) {
      return (
        <Card className="relative p-6 bg-gradient-to-br from-white to-emerald-50/40 shadow-lg rounded-[20px]">
          <div className="pr-24 md:pr-32 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-4 gap-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </div>
        </Card>
      );
    }

    const metricas = calcularMetricas();
    
    // Calculate segment widths for stacked bar
    const segmentWidths = metricas.total > 0 ? {
      concluidos: (metricas.concluidos / metricas.total) * 100,
      faltando: (metricas.faltando / metricas.total) * 100,
      atrasados: (metricas.atrasados / metricas.total) * 100,
      cancelados: (metricas.cancelados / metricas.total) * 100
    } : { concluidos: 0, faltando: 0, atrasados: 0, cancelados: 0 };
    
    return (
      <Card className="relative p-6 bg-gradient-to-br from-white to-emerald-50/40 shadow-lg rounded-[20px]">
        {/* Progress Ring - Positioned absolutely at top-right */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6">
          <div className="relative">
            <svg className="w-20 h-20 md:w-24 md:h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="hsl(var(--conquistas-concluido))"
                strokeWidth="10"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - metricas.percentual / 100)}`}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl md:text-2xl font-bold text-primary">{Math.round(metricas.percentual)}%</span>
            </div>
          </div>
        </div>

        {/* Main content - Reserve space for ring */}
        <div className="pr-24 md:pr-32 space-y-4">
          {/* Header */}
          <div>
            <h3 className="text-xl font-bold text-primary mb-1">
              {selectedPeriod === 'hoje' && 'Resumo Hoje'}
              {selectedPeriod === 'semana' && 'Resumo da Semana'}
              {selectedPeriod === 'mes' && 'Resumo do Mês'}
              {selectedPeriod === 'historico' && 'Resumo Histórico'}
            </h3>
            <p className="text-sm text-primary/70">
              {selectedPeriod === 'hoje' && 'Progresso diário'}
              {selectedPeriod === 'semana' && 'Progresso semanal'}
              {selectedPeriod === 'mes' && 'Progresso mensal'}
              {selectedPeriod === 'historico' && 'Visão geral histórica'}
            </p>
          </div>
          
          {/* Progress line */}
          <div className="flex items-center justify-between text-sm text-primary/70">
            <span>Progresso</span>
            <span className="font-medium">{metricas.concluidos} de {metricas.total}</span>
          </div>
          
          {/* Stacked progress bar */}
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex">
              {metricas.total > 0 ? (
                <>
                  {segmentWidths.concluidos > 0 && (
                    <div 
                      className="h-full bg-[hsl(var(--conquistas-concluido))]"
                      style={{ width: `${segmentWidths.concluidos}%` }}
                    />
                  )}
                  {segmentWidths.faltando > 0 && (
                    <div 
                      className="h-full bg-[hsl(var(--conquistas-faltando))]"
                      style={{ width: `${segmentWidths.faltando}%` }}
                    />
                  )}
                  {segmentWidths.atrasados > 0 && (
                    <div 
                      className="h-full bg-[hsl(var(--conquistas-atrasado))]"
                      style={{ width: `${segmentWidths.atrasados}%` }}
                    />
                  )}
                  {segmentWidths.cancelados > 0 && (
                    <div 
                      className="h-full bg-[hsl(var(--conquistas-cancelado))]"
                      style={{ width: `${segmentWidths.cancelados}%` }}
                    />
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gray-200" />
              )}
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-between text-xs text-primary/60">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--conquistas-concluido))]" />
                <span>Concluídos</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--conquistas-faltando))]" />
                <span>Faltando</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--conquistas-atrasado))]" />
                <span>Atrasados</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--conquistas-cancelado))]" />
                <span>Cancelados</span>
              </div>
            </div>
          </div>

          {/* Mini cards - 4 columns even on mobile */}
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            <div className="p-2 md:p-3 rounded-2xl bg-white shadow-sm border border-emerald-100">
              <div className="flex items-center justify-center mb-1 md:mb-2">
                <div className="status-chip-soft text-xs" style={{ color: 'hsl(var(--conquistas-concluido))' }}>
                  {metricas.total > 0 ? Math.round((metricas.concluidos / metricas.total) * 100) : 0}%
                </div>
              </div>
              <div className="text-lg md:text-2xl font-bold text-primary text-center">{metricas.concluidos}</div>
              <div className="text-xs text-primary/60 text-center">Concluídos</div>
            </div>

            <div className="p-2 md:p-3 rounded-2xl bg-white shadow-sm border border-green-100">
              <div className="flex items-center justify-center mb-1 md:mb-2">
                <div className="status-chip-soft text-xs" style={{ color: 'hsl(var(--conquistas-faltando))' }}>
                  {metricas.total > 0 ? Math.round((metricas.faltando / metricas.total) * 100) : 0}%
                </div>
              </div>
              <div className="text-lg md:text-2xl font-bold text-primary text-center">{metricas.faltando}</div>
              <div className="text-xs text-primary/60 text-center">Faltando</div>
            </div>

            <div className="p-2 md:p-3 rounded-2xl bg-white shadow-sm border border-orange-100">
              <div className="flex items-center justify-center mb-1 md:mb-2">
                <div className="status-chip-soft text-xs" style={{ color: 'hsl(var(--conquistas-atrasado))' }}>
                  {metricas.total > 0 ? Math.round((metricas.atrasados / metricas.total) * 100) : 0}%
                </div>
              </div>
              <div className="text-lg md:text-2xl font-bold text-primary text-center">{metricas.atrasados}</div>
              <div className="text-xs text-primary/60 text-center">Atrasados</div>
            </div>

            <div className="p-2 md:p-3 rounded-2xl bg-white shadow-sm border border-pink-100">
              <div className="flex items-center justify-center mb-1 md:mb-2">
                <div className="status-chip-soft text-xs" style={{ color: 'hsl(var(--conquistas-cancelado))' }}>
                  {metricas.total > 0 ? Math.round((metricas.cancelados / metricas.total) * 100) : 0}%
                </div>
              </div>
              <div className="text-lg md:text-2xl font-bold text-primary text-center">{metricas.cancelados}</div>
              <div className="text-xs text-primary/60 text-center">Cancelados</div>
            </div>
          </div>

          {/* CTA Button */}
          <Button className="w-full h-12 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium">
            <BarChart3 className="w-4 h-4 mr-2" />
            Ver análise detalhada
          </Button>
        </div>
      </Card>
    );
  };

  const renderHistoricalContent = () => {
    if (selectedPeriod !== 'historico') return null;
    
    return <HistoricalChart />;
  };

  const renderProgressoPorCategorias = () => {
    if (!summary?.by_category || selectedPeriod === 'historico') return null;

    const categorias = [
      { key: 'medicacao', label: 'Medicações', color: 'hsl(var(--conquistas-concluido))' },
      { key: 'consulta', label: 'Consultas', color: 'hsl(var(--primary))' },
      { key: 'exame', label: 'Exames', color: 'hsl(var(--secondary))' },
      { key: 'atividade', label: 'Atividades', color: 'hsl(var(--accent))' }
    ];

    const categoriasComDados = categorias.filter(categoria => {
      const dados = summary.by_category[categoria.key];
      return dados && typeof dados === 'object' && 'planejados' in dados && typeof dados.planejados === 'number' && dados.planejados > 0;
    });

    if (categoriasComDados.length === 0) return null;

    const periodoLabel = {
      hoje: 'Hoje',
      semana: 'Semana',
      mes: 'Mês'
    }[selectedPeriod];

    return (
      <div className="w-full max-w-2xl space-y-4">
        <h2 className="text-xl font-bold text-primary">
          Progresso - {periodoLabel}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoriasComDados.map((categoria) => {
            const dados = summary.by_category[categoria.key] as { planejados: number; concluidos: number; faltando: number; atrasados: number; cancelados: number; aderencia_pct: number };
            const percentual = dados.planejados > 0 ? Math.round((dados.concluidos / dados.planejados) * 100) : 0;
            
            return (
              <Card key={categoria.key} className="p-4 bg-white shadow-sm rounded-2xl border border-gray-100">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-primary">{categoria.label}</h3>
                    <span className="text-2xl font-bold text-primary">{percentual}%</span>
                  </div>
                  
                  <p className="text-sm text-primary/70">
                    {dados.planejados} planejados / {dados.concluidos} concluídos
                  </p>
                  
                  <div className="space-y-2">
                    <Progress 
                      value={percentual} 
                      className="h-2"
                      style={{ 
                        '--progress-background': categoria.color 
                      } as React.CSSProperties}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-primary mb-2">Conquistas</h1>
            <p className="text-base text-primary/70">Acompanhe seu progresso e conquistas</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {renderFilterChips()}
          </div>
        </div>
      </div>

      {selectedPeriod === 'historico' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-6">
            {renderResumoCard()}
          </div>
          
          <div className="space-y-6">
            {renderHistoricalContent()}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-6">
          <div className="w-full max-w-2xl">
            {renderResumoCard()}
          </div>
          {renderProgressoPorCategorias()}
        </div>
      )}
    </div>
  );
}