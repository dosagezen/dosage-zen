import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfToday, startOfWeek, startOfMonth, endOfToday, endOfWeek, endOfMonth } from "date-fns";

export type ReportPeriod = 'hoje' | 'semana' | 'mes' | 'personalizado';
export type ReportCategory = 'todas' | 'medicacao' | 'consulta' | 'exame' | 'atividade';

interface UseReportsDataParams {
  period: ReportPeriod;
  category: ReportCategory;
  contextId?: string;
  customRange?: { start: Date; end: Date };
}

interface ReportSummary {
  totals: {
    planejados: number;
    concluidos: number;
    retardatarios: number;
    faltando: number;
    atrasados: number;
    excluidos: number;
    concluidos_pct: number;
    retardatarios_pct: number;
    faltando_pct: number;
    atrasados_pct: number;
    excluidos_pct: number;
  };
  by_category: {
    [key: string]: {
      planejados: number;
      concluidos: number;
      retardatarios: number;
      faltando: number;
      atrasados: number;
      excluidos: number;
    };
  };
}

const getDateRange = (period: ReportPeriod, customRange?: { start: Date; end: Date }) => {
  if (period === 'personalizado' && customRange) {
    return {
      start: customRange.start.toISOString(),
      end: customRange.end.toISOString()
    };
  }

  const now = new Date();
  let start: Date;
  let end: Date;

  switch (period) {
    case 'hoje':
      start = startOfToday();
      end = endOfToday();
      break;
    case 'semana':
      start = startOfWeek(now, { weekStartsOn: 0 });
      end = endOfWeek(now, { weekStartsOn: 0 });
      break;
    case 'mes':
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    default:
      start = startOfToday();
      end = endOfToday();
  }

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
};

export const useReportsData = ({ period, category, contextId, customRange }: UseReportsDataParams) => {
  const { profile, currentContext } = useAuth();
  const selectedContextId = contextId || currentContext || profile?.id;

  const { data: summary, isLoading, error, refetch } = useQuery({
    queryKey: ['reports-summary', selectedContextId, period, category, customRange],
    queryFn: async () => {
      if (!selectedContextId) {
        throw new Error('No context selected');
      }

      const { start, end } = getDateRange(period, customRange);
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const { data, error } = await supabase.rpc('fn_reports_summary', {
        p_context_id: selectedContextId,
        p_range_start: start,
        p_range_end: end,
        p_category: category,
        p_tz: userTimezone
      });

      if (error) {
        console.error('Error fetching reports summary:', error);
        throw error;
      }

      return data as unknown as ReportSummary;
    },
    enabled: !!selectedContextId,
    staleTime: period === 'hoje' ? 5 * 60 * 1000 : 30 * 60 * 1000, // 5min for today, 30min for others
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  return {
    summary: summary || {
      totals: {
        planejados: 0,
        concluidos: 0,
        retardatarios: 0,
        faltando: 0,
        atrasados: 0,
        excluidos: 0,
        concluidos_pct: 0,
        retardatarios_pct: 0,
        faltando_pct: 0,
        atrasados_pct: 0,
        excluidos_pct: 0,
      },
      by_category: {}
    },
    isLoading,
    error,
    refetch
  };
};
