import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface HistoricalDataPoint {
  mes: string;
  aderencia: number;
  concluidos: number;
  total: number;
}

export function useHistoricalData() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['historical-conquests', profile?.id],
    queryFn: async (): Promise<HistoricalDataPoint[]> => {
      if (!profile?.id) {
        throw new Error('No profile available');
      }

      // Get data for the last 12 months
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);

      try {
        // Query v_conquests_occurrences view directly for real data
        const { data, error } = await supabase
          .from('v_conquests_occurrences')
          .select('*')
          .eq('context_id', profile.id)
          .gte('due_at', startDate.toISOString())
          .lte('due_at', endDate.toISOString());

        if (error) {
          console.error('Error fetching conquests:', error);
          throw error;
        }

        // Se não há dados, retornar array vazio
        if (!data || data.length === 0) {
          return [];
        }

        // Agregar dados por mês
        const monthlyData = new Map<string, { concluidos: number; total: number }>();
        
        data.forEach((item: any) => {
          if (!item.due_at) return;
          
          const date = new Date(item.due_at);
          const month = date.toLocaleDateString('pt-BR', { month: 'short' }).toLowerCase().replace('.', '');
          const year = date.getFullYear().toString().slice(-2);
          const monthYear = `${month}${year}`;
          
          if (!monthlyData.has(monthYear)) {
            monthlyData.set(monthYear, { concluidos: 0, total: 0 });
          }
          
          const monthStats = monthlyData.get(monthYear)!;
          monthStats.total += 1;
          
          // Considerar como concluído se status for 'concluido' ou 'realizado'
          if (item.status === 'concluido' || item.status === 'realizado') {
            monthStats.concluidos += 1;
          }
        });

        // Converter para array e calcular aderência
        const historicalData: HistoricalDataPoint[] = Array.from(monthlyData.entries())
          .map(([mes, stats]) => ({
            mes,
            concluidos: stats.concluidos,
            total: stats.total,
            aderencia: stats.total > 0 ? Math.round((stats.concluidos / stats.total) * 100) : 0
          }))
          .sort((a, b) => {
            // Ordenar por data - converter formato mmaa para comparação
            const parseMonthYear = (str: string) => {
              const monthMap: { [key: string]: number } = {
                'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
                'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
              };
              const monthStr = str.slice(0, 3);
              const yearStr = str.slice(3);
              return new Date(2000 + parseInt(yearStr), monthMap[monthStr]).getTime();
            };
            
            return parseMonthYear(a.mes) - parseMonthYear(b.mes);
          });

        return historicalData;
      } catch (err) {
        console.error('Error fetching historical data:', err);
        throw err;
      }
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}