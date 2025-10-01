import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoricalDataPoint {
  month: string;
  adherence_pct: number;
  completed: number;
  total: number;
}

export const useReportsHistorical = (contextId?: string, months: number = 4) => {
  const { profile, currentContext } = useAuth();
  const selectedContextId = contextId || currentContext || profile?.id;

  const { data: historical, isLoading, error } = useQuery({
    queryKey: ['reports-historical', selectedContextId, months],
    queryFn: async () => {
      if (!selectedContextId) {
        throw new Error('No context selected');
      }

      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const { data, error } = await supabase.rpc('fn_reports_historical', {
        p_context_id: selectedContextId,
        p_months: months,
        p_tz: userTimezone
      });

      if (error) {
        console.error('Error fetching reports historical:', error);
        throw error;
      }

      // Parse and format the data
      const historicalData = (data as unknown as HistoricalDataPoint[]) || [];
      
      return historicalData.map(item => ({
        mes: format(parse(item.month, 'yyyy-MM', new Date()), 'MMM', { locale: ptBR }),
        aderencia: item.adherence_pct,
        concluidos: item.completed,
        total: item.total
      }));
    },
    enabled: !!selectedContextId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  return {
    historical: historical || [],
    isLoading,
    error
  };
};
