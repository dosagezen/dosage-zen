import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PublicReportData {
  reportId: string;
  generatedAt: string;
  metadata: {
    period: string;
    category: string;
    rangeStart: string;
    rangeEnd: string;
    periodText: string;
    categoryText: string;
  };
  profile: {
    nome: string;
    sobrenome: string;
    email?: string;
    celular?: string;
  };
  summary: {
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
    by_category: Record<string, {
      planejados: number;
      concluidos: number;
      retardatarios: number;
      faltando: number;
      atrasados: number;
      excluidos: number;
    }>;
  };
  insights: {
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
  };
  historical: Array<{
    mes: string;
    aderencia: number;
    concluidos: number;
    total: number;
  }>;
}

export const usePublicReportData = (reportId: string | undefined) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-report', reportId],
    queryFn: async () => {
      if (!reportId) {
        throw new Error('Report ID is required');
      }

      // Download JSON from public bucket
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("public-reports")
        .download(`${reportId}.json`);

      if (downloadError) throw downloadError;

      const text = await fileData.text();
      const jsonData = JSON.parse(text) as PublicReportData;

      return jsonData;
    },
    enabled: !!reportId,
    retry: 2,
    staleTime: Infinity, // Public reports don't change
  });

  return {
    reportData: data,
    isLoading,
    error
  };
};
