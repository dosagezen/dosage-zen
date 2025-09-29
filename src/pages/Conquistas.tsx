import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, BarChart3 } from 'lucide-react';
import { useConquests } from '@/hooks/useConquests';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Period = 'hoje' | 'semana' | 'mes' | 'historico';
type Category = 'todas' | 'medicacao' | 'consulta' | 'exame' | 'atividade';

const CATEGORIA_LABELS = {
  todas: 'Todas as categorias',
  medicacao: 'Medicações',
  consulta: 'Consultas',
  exame: 'Exames',
  atividade: 'Atividades'
} as const;

export default function Conquistas() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(() => {
    return (searchParams.get('periodo') as Period) || 'hoje';
  });

  const [selectedCategory, setSelectedCategory] = useState<Category>(() => {
    return (searchParams.get('categoria') as Category) || 'todas';
  });

  const { summary, isLoading, error } = useConquests({
    period: selectedPeriod,
    category: selectedCategory
  });

  const updateFilters = (newPeriod: Period, newCategory: Category) => {
    const params = new URLSearchParams(searchParams);
    params.set('periodo', newPeriod);
    params.set('categoria', newCategory);
    setSearchParams(params);
    setSelectedPeriod(newPeriod);
    setSelectedCategory(newCategory);
  };

  const renderFilterChips = () => {
    const periods = [
      { value: 'hoje' as Period, label: 'Hoje' },
      { value: 'semana' as Period, label: 'Semana' },
      { value: 'mes' as Period, label: 'Mês' },
      { value: 'historico' as Period, label: 'Histórico' }
    ];

    const categories = [
      { value: 'todas' as Category, label: 'Todas' },
      { value: 'medicacao' as Category, label: 'Medicações' },
      { value: 'consulta' as Category, label: 'Consultas' },
      { value: 'exame' as Category, label: 'Exames' },
      { value: 'atividade' as Category, label: 'Atividades' }
    ];

    const getCount = (type: 'period' | 'category', value: string) => {
      if (!summary) return 0;
      
      if (type === 'period') {
        // Para períodos, sempre mostrar total planejados
        return summary.planejados || 0;
      } else {
        // Para categorias
        if (value === 'todas') {
          return summary.planejados || 0;
        }
        const categoryData = summary.by_category?.[value];
        return (categoryData as any)?.planejados || 0;
      }
    };

    return (
      <div className="flex items-center gap-2 flex-wrap">
        {/* Period chips */}
        {periods.map((period) => {
          const count = getCount('period', period.value);
          const isActive = selectedPeriod === period.value;
          
          return (
            <button
              key={period.value}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
                isActive
                  ? "bg-[#344E41] text-white"
                  : "bg-[#DAD7CD] text-[#344E41] hover:bg-[#B8B5A7]"
              )}
              onClick={() => updateFilters(period.value, selectedCategory)}
            >
              {period.label}
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-semibold",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-[#344E41]/10 text-[#344E41]"
              )}>
                {count}
              </span>
            </button>
          );
        })}
        
        {/* Separator */}
        <div className="w-px h-6 bg-border mx-2" />
        
        {/* Category chips */}
        {categories.map((category) => {
          const count = getCount('category', category.value);
          const isActive = selectedCategory === category.value;
          
          return (
            <button
              key={category.value}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
                isActive
                  ? "bg-[#344E41] text-white"
                  : "bg-[#DAD7CD] text-[#344E41] hover:bg-[#B8B5A7]"
              )}
              onClick={() => updateFilters(selectedPeriod, category.value)}
            >
              {category.label}
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-semibold",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-[#344E41]/10 text-[#344E41]"
              )}>
                {count}
              </span>
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
            <h3 className="text-xl font-bold text-primary mb-1">Resumo Hoje</h3>
            <p className="text-sm text-primary/70">Progresso diário</p>
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

  const renderProgressoSection = () => {
    if (!summary?.by_category || selectedCategory !== 'todas') return null;

    const categories = [
      { key: 'medicacao', label: 'Medicações', color: 'hsl(var(--conquistas-concluido))' },
      { key: 'consulta', label: 'Consultas', color: 'hsl(var(--conquistas-faltando))' },
      { key: 'exame', label: 'Exames', color: 'hsl(var(--conquistas-atrasado))' },
      { key: 'atividade', label: 'Atividades', color: 'hsl(var(--conquistas-cancelado))' }
    ];

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Progresso – Hoje</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => {
            const categoryData = summary.by_category?.[category.key];
            if (!categoryData || typeof categoryData !== 'object') return null;

            const total = (categoryData as any).planejados || 0;
            const completed = (categoryData as any).concluidos || 0;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <Card key={category.key} className="border border-gray-100 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{category.label}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {total} planejados / {completed} concluídos
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: category.color,
                          width: `${percentage}%`
                        }}
                      />
                    </div>
                    <span className="text-lg font-bold text-gray-900 min-w-[3rem] text-right">
                      {percentage}%
                    </span>
                  </div>
                </CardContent>
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          {renderResumoCard()}
        </div>
        
        <div className="space-y-6">
          {renderProgressoSection()}
        </div>
      </div>
    </div>
  );
}