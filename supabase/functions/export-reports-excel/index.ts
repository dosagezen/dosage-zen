import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportExcelRequest {
  contextId: string;
  period: string;
  category: string;
  rangeStart: string;
  rangeEnd: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const requestData: ExportExcelRequest = await req.json();
    const { contextId, period, category, rangeStart, rangeEnd } = requestData;

    // Get report data
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const { data: summaryData, error: summaryError } = await supabaseClient.rpc(
      'fn_reports_summary',
      {
        p_context_id: contextId,
        p_range_start: rangeStart,
        p_range_end: rangeEnd,
        p_category: category,
        p_tz: userTimezone,
      }
    );

    if (summaryError) throw summaryError;

    const { data: historicalData, error: historicalError } = await supabaseClient.rpc(
      'fn_reports_historical',
      {
        p_context_id: contextId,
        p_months: 4,
        p_tz: userTimezone,
      }
    );

    if (historicalError) throw historicalError;

    // Generate CSV format (simpler than Excel)
    let csvContent = "Relatório de Adesão - Dosage Zen\n";
    csvContent += `Período: ${period}, Categoria: ${category}\n\n`;
    
    csvContent += "RESUMO GERAL\n";
    csvContent += "Métrica,Valor,Percentual\n";
    csvContent += `Planejados,${summaryData.totals.planejados},-\n`;
    csvContent += `Concluídos,${summaryData.totals.concluidos},${summaryData.totals.concluidos_pct}%\n`;
    csvContent += `Retardatários,${summaryData.totals.retardatarios},${summaryData.totals.retardatarios_pct}%\n`;
    csvContent += `Atrasados,${summaryData.totals.atrasados},${summaryData.totals.atrasados_pct}%\n`;
    csvContent += `Faltando,${summaryData.totals.faltando},${summaryData.totals.faltando_pct}%\n`;
    csvContent += `Excluídos,${summaryData.totals.excluidos},${summaryData.totals.excluidos_pct}%\n\n`;

    csvContent += "DETALHAMENTO POR CATEGORIA\n";
    csvContent += "Categoria,Planejados,Concluídos,Retardatários,Atrasados,Faltando,Excluídos\n";
    Object.entries(summaryData.by_category || {}).forEach(([cat, data]: [string, any]) => {
      csvContent += `${cat},${data.planejados},${data.concluidos},${data.retardatarios},${data.atrasados},${data.faltando},${data.excluidos}\n`;
    });

    csvContent += "\nHISTÓRICO MENSAL\n";
    csvContent += "Mês,Adesão %,Concluídos,Total\n";
    (historicalData || []).forEach((item: any) => {
      csvContent += `${item.month},${item.adherence_pct},${item.completed},${item.total}\n`;
    });

    csvContent += `\nGerado em: ${new Date().toLocaleString('pt-BR')}\n`;

    // Return CSV data
    return new Response(
      JSON.stringify({ 
        success: true, 
        csvContent,
        filename: `relatorio-${period}-${Date.now()}.csv`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error generating Excel:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
