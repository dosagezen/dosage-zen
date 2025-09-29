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

        // For now, generate mock data based on the current month
        // In a real implementation, this would aggregate the data by month
        const mockData: HistoricalDataPoint[] = [];
        const currentDate = new Date();
        
        for (let i = 11; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          
          // Formatar diretamente no padrão mmaa
          const month = date.toLocaleDateString('pt-BR', { month: 'short' }).toLowerCase().replace('.', '');
          const year = date.getFullYear().toString().slice(-2);
          const monthYear = `${month}${year}`;
          
          // Generate realistic mock data with some variation
          const baseAderencia = 65 + Math.random() * 30; // 65-95%
          const total = 25 + Math.floor(Math.random() * 15); // 25-40 total items
          const concluidos = Math.floor((total * baseAderencia) / 100);
          
          mockData.push({
            mes: monthYear,
            aderencia: Math.round(baseAderencia),
            concluidos,
            total
          });
        }

        return mockData;
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