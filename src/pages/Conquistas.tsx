import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Filter } from 'lucide-react';
import { useConquests } from '@/hooks/useConquests';
import { toast } from 'sonner';

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

  const renderPeriodChips = () => {
    const periods = [
      { value: 'hoje' as Period, label: 'Hoje' },
      { value: 'semana' as Period, label: 'Semana' },
      { value: 'mes' as Period, label: 'Mês' },
      { value: 'historico' as Period, label: 'Histórico' }
    ];

    return (
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-5 h-5 text-muted-foreground" />
        {periods.map((period) => (
          <div
            key={period.value}
            className={`filter-chip ${
              selectedPeriod === period.value 
                ? 'filter-chip-active' 
                : 'filter-chip-inactive'
            }`}
            onClick={() => updateFilters(period.value, selectedCategory)}
          >
            {period.label}
          </div>
        ))}
      </div>
    );
  };

  const renderCategoriaSelect = () => (
    <Select value={selectedCategory} onValueChange={(value: Category) => updateFilters(selectedPeriod, value)}>
      <SelectTrigger className="w-[220px] h-12 rounded-2xl border-border/50 focus:ring-1 focus:ring-primary/20">
        <SelectValue placeholder="Todas as categorias" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(CATEGORIA_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

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
        <Card className="w-full">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32 w-32 rounded-full mx-auto" />
              <Skeleton className="h-4 w-full" />
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    const metricas = calcularMetricas();
    
    return (
      <Card className="w-full shadow-sm border border-gray-100 bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Resumo Hoje</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl h-3 overflow-hidden">
                <div className="h-full flex">
                  <div 
                    className="bg-[hsl(var(--conquistas-concluido))]" 
                    style={{ width: `${(metricas.concluidos / metricas.total * 100) || 0}%` }}
                  />
                  <div 
                    className="bg-[hsl(var(--conquistas-faltando))]" 
                    style={{ width: `${(metricas.faltando / metricas.total * 100) || 0}%` }}
                  />
                  <div 
                    className="bg-[hsl(var(--conquistas-atrasado))]" 
                    style={{ width: `${(metricas.atrasados / metricas.total * 100) || 0}%` }}
                  />
                  <div 
                    className="bg-[hsl(var(--conquistas-cancelado))]" 
                    style={{ width: `${(metricas.cancelados / metricas.total * 100) || 0}%` }}
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--conquistas-concluido))]" />
                  <span className="text-gray-600">Concluídos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--conquistas-faltando))]" />
                  <span className="text-gray-600">Faltando</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--conquistas-atrasado))]" />
                  <span className="text-gray-600">Atrasados</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[hsl(var(--conquistas-cancelado))]" />
                  <span className="text-gray-600">Cancelados</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-24 h-24 mb-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="none"
                    className="text-gray-100"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${metricas.percentual * 2.638} 264`}
                    className="text-[hsl(var(--conquistas-concluido))] transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{metricas.percentual}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center">Progresso diário</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="status-chip bg-[hsl(var(--conquistas-concluido))] text-white mb-3 w-fit">
                {metricas.percentual}%
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{metricas.concluidos}</div>
              <div className="text-sm text-gray-500">Concluídos</div>
            </div>
            
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="status-chip bg-[hsl(var(--conquistas-faltando))] text-white mb-3 w-fit">
                {Math.round((metricas.faltando / metricas.total * 100) || 0)}%
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{metricas.faltando}</div>
              <div className="text-sm text-gray-500">Faltando</div>
            </div>
            
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="status-chip bg-[hsl(var(--conquistas-atrasado))] text-white mb-3 w-fit">
                {Math.round((metricas.atrasados / metricas.total * 100) || 0)}%
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{metricas.atrasados}</div>
              <div className="text-sm text-gray-500">Atrasados</div>
            </div>
            
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="status-chip bg-[hsl(var(--conquistas-cancelado))] text-white mb-3 w-fit">
                {Math.round((metricas.cancelados / metricas.total * 100) || 0)}%
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{metricas.cancelados}</div>
              <div className="text-sm text-gray-500">Cancelados</div>
            </div>
          </div>
          
          <Button 
            className="w-full h-12 rounded-full bg-[hsl(var(--conquistas-concluido))] hover:bg-[hsl(var(--conquistas-concluido))]/90 text-white font-medium text-base"
            onClick={() => toast.info("Análise detalhada em desenvolvimento")}
          >
            Ver análise detalhada
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </CardContent>
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
          <div className="flex flex-col sm:flex-row gap-4">
            {renderPeriodChips()}
            {renderCategoriaSelect()}
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