import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportInsights {
  best_week: {
    start_date: string;
    adherence_pct: number;
  };
  most_forgotten: {
    item: string;
    missed_pct: number;
  };
  consecutive_days: number;
  trend: {
    direction: 'subindo' | 'descendo' | 'estável';
    value: number;
  };
}

export const useReportsInsights = (contextId?: string) => {
  const { profile, currentContext } = useAuth();
  const selectedContextId = contextId || currentContext || profile?.id;

  const { data: insights, isLoading, error } = useQuery({
    queryKey: ['reports-insights', selectedContextId],
    queryFn: async () => {
      if (!selectedContextId) {
        throw new Error('No context selected');
      }

      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const { data, error } = await supabase.rpc('fn_reports_insights', {
        p_context_id: selectedContextId,
        p_tz: userTimezone
      });

      if (error) {
        console.error('Error fetching reports insights:', error);
        throw error;
      }

      return data as unknown as ReportInsights;
    },
    enabled: !!selectedContextId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  // Format insights for display
  const formattedInsights = insights ? {
    bestWeek: {
      label: insights.best_week.start_date 
        ? format(new Date(insights.best_week.start_date), "dd 'de' MMM", { locale: ptBR })
        : '-',
      value: `${insights.best_week.adherence_pct}%`,
      trend: 'up' as const
    },
    mostForgotten: {
      label: getCategoryLabel(insights.most_forgotten.item),
      value: `${insights.most_forgotten.missed_pct}% esquecimento`,
      trend: 'down' as const
    },
    consecutiveDays: {
      label: 'Dias seguidos',
      value: insights.consecutive_days.toString(),
      trend: 'neutral' as const
    },
    currentTrend: {
      label: 'Tendência',
      value: getTrendLabel(insights.trend.direction, insights.trend.value),
      trend: insights.trend.direction === 'subindo' ? 'up' as const : 
             insights.trend.direction === 'descendo' ? 'down' as const : 
             'neutral' as const
    }
  } : null;

  return {
    insights: formattedInsights,
    rawInsights: insights,
    isLoading,
    error
  };
};

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

const getTrendLabel = (direction: string, value: number): string => {
  if (direction === 'subindo') return `↑ ${value.toFixed(1)}%`;
  if (direction === 'descendo') return `↓ ${value.toFixed(1)}%`;
  return '→ Estável';
};
