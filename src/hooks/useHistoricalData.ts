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
        const { data, error } = await supabase.rpc('fn_conquests_summary', {
          p_context_id: profile.id,
          p_range_start: startDate.toISOString(),
          p_range_end: endDate.toISOString(),
          p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone
        });

        if (error) {
          console.error('RPC Error:', error);
          throw error;
        }

        // Se não há dados, retornar array vazio
        if (!data || !Array.isArray(data) || data.length === 0) {
          return [];
        }

        // Agregar dados por mês
        const monthlyData = new Map<string, { concluidos: number; total: number }>();
        
        (data as any[]).forEach((item: any) => {
          if (!item.data_referencia) return;
          
          const date = new Date(item.data_referencia);
          const month = date.toLocaleDateString('pt-BR', { month: 'short' }).toLowerCase().replace('.', '');
          const year = date.getFullYear().toString().slice(-2);
          const monthYear = `${month}${year}`;
          
          if (!monthlyData.has(monthYear)) {
            monthlyData.set(monthYear, { concluidos: 0, total: 0 });
          }
          
          const monthStats = monthlyData.get(monthYear)!;
          monthStats.total += 1;
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
            // Ordenar por data (extrair mês e ano do formato "mmaa")
            const [mesA, anoA] = [a.mes.slice(0, 3), a.mes.slice(3)];
            const [mesB, anoB] = [b.mes.slice(0, 3), b.mes.slice(3)];
            
            if (anoA !== anoB) return anoA.localeCompare(anoB);
            return mesA.localeCompare(mesB);
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