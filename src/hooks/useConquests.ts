import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompromissosEvents } from "@/contexts/CompromissosEventContext";
import { useToast } from "@/hooks/use-toast";

export type ConquestPeriod = 'hoje' | 'semana' | 'mes' | 'historico';
export type ConquestCategory = 'todas' | 'medicacao' | 'consulta' | 'exame' | 'atividade';

export interface ConquestSummary {
  planejados: number;
  concluidos: number;
  faltando: number;
  atrasados: number;
  cancelados: number;
  aderencia_pct: number;
  by_category: {
    [key: string]: {
      planejados: number;
      concluidos: number;
      faltando: number;
      atrasados: number;
      cancelados: number;
      aderencia_pct: number;
    };
  };
}

interface UseConquestsParams {
  period: ConquestPeriod;
  category: ConquestCategory;
}

export function useConquests({ period, category }: UseConquestsParams) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { subscribeToConquestsUpdates } = useCompromissosEvents();

  const getDateRange = useCallback(() => {
    const now = new Date();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    let start: Date, end: Date;
    
    switch (period) {
      case 'hoje':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'semana':
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start = new Date(now.getTime() - daysToMonday * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
        end.setHours(23, 59, 59, 999);
        break;
      case 'mes':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'historico':
        start = new Date('2020-01-01');
        end = now;
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    }
    
    return { start, end, timezone };
  }, [period]);

  const {
    data: summary,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['conquests', profile?.id, period, category],
    queryFn: async (): Promise<ConquestSummary> => {
      if (!profile?.id) {
        throw new Error('No profile available');
      }

      const { start, end, timezone } = getDateRange();
      
      try {
        const { data, error } = await supabase.rpc('fn_conquests_summary', {
          p_context_id: profile.id,
          p_range_start: start.toISOString(),
          p_range_end: end.toISOString(),
          p_tz: timezone
        });

        if (error) {
          console.error('RPC Error:', error);
          throw error;
        }

        if (!data) {
          // Return empty summary if no data
          return {
            planejados: 0,
            concluidos: 0,
            faltando: 0,
            atrasados: 0,
            cancelados: 0,
            aderencia_pct: 0,
            by_category: {}
          };
        }

        return data as unknown as ConquestSummary;
      } catch (err) {
        console.error('Error fetching conquests summary:', err);
        throw err;
      }
    },
    enabled: !!profile?.id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Filter data by category if not 'todas'
  const filteredSummary = useCallback(() => {
    if (!summary || category === 'todas') {
      return summary;
    }

    const categoryData = summary.by_category[category];
    if (!categoryData) {
      return {
        planejados: 0,
        concluidos: 0,
        faltando: 0,
        atrasados: 0,
        cancelados: 0,
        aderencia_pct: 0,
        by_category: { [category]: categoryData || {} }
      };
    }

    return {
      planejados: categoryData.planejados,
      concluidos: categoryData.concluidos,
      faltando: categoryData.faltando,
      atrasados: categoryData.atrasados,
      cancelados: categoryData.cancelados,
      aderencia_pct: categoryData.aderencia_pct,
      by_category: { [category]: categoryData }
    };
  }, [summary, category]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToConquestsUpdates(() => {
      // Invalidate and refetch conquest data when compromissos are updated
      queryClient.invalidateQueries({ queryKey: ['conquests'] });
    });

    return unsubscribe;
  }, [subscribeToConquestsUpdates, queryClient]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar conquistas",
        description: "Não foi possível carregar os dados de conquistas. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return {
    summary: filteredSummary(),
    isLoading,
    error,
    refetch
  };
}