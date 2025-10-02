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
    // Check for Authorization header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('Missing authorization token');
    }

    // Create service role client for data access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract token and verify user
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized: ' + (userError?.message || 'No user found'));
    }

    const requestData: ExportExcelRequest = await req.json();
    const { contextId, period, category, rangeStart, rangeEnd } = requestData;

    // Get user profile for default context if needed
    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Use provided contextId or fallback to user's own profile id
    const effectiveContextId = contextId || profileData?.id;

    // Get report data
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const { data: summaryData, error: summaryError } = await supabaseClient.rpc(
      'fn_reports_summary',
      {
        p_context_id: effectiveContextId,
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
        p_context_id: effectiveContextId,
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
