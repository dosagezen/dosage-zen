import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportPDFRequest {
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

    const requestData: ExportPDFRequest = await req.json();
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

    const { data: insightsData, error: insightsError } = await supabaseClient.rpc(
      'fn_reports_insights',
      {
        p_context_id: contextId,
        p_tz: userTimezone,
      }
    );

    if (insightsError) throw insightsError;

    // Generate simple HTML-based PDF content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório - Dosage Zen</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
            .section { margin: 30px 0; }
            .metric { display: inline-block; margin: 10px 20px 10px 0; }
            .metric-label { font-weight: bold; color: #666; }
            .metric-value { font-size: 24px; color: #4CAF50; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
          </style>
        </head>
        <body>
          <h1>Relatório de Adesão - Dosage Zen</h1>
          <p><strong>Período:</strong> ${period} | <strong>Categoria:</strong> ${category}</p>
          
          <div class="section">
            <h2>Resumo Geral</h2>
            <div class="metric">
              <div class="metric-label">Total Planejados</div>
              <div class="metric-value">${summaryData.totals.planejados}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Concluídos</div>
              <div class="metric-value">${summaryData.totals.concluidos} (${summaryData.totals.concluidos_pct}%)</div>
            </div>
            <div class="metric">
              <div class="metric-label">Atrasados</div>
              <div class="metric-value">${summaryData.totals.atrasados}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Faltando</div>
              <div class="metric-value">${summaryData.totals.faltando}</div>
            </div>
          </div>

          <div class="section">
            <h2>Insights</h2>
            <p><strong>Melhor Semana:</strong> ${insightsData.best_week.start_date} (${insightsData.best_week.adherence_pct}% adesão)</p>
            <p><strong>Mais Esquecido:</strong> ${insightsData.most_forgotten.item}</p>
            <p><strong>Dias Seguidos 100%:</strong> ${insightsData.consecutive_days}</p>
            <p><strong>Tendência:</strong> ${insightsData.trend.direction} (${insightsData.trend.value}%)</p>
          </div>

          <div class="section">
            <h2>Detalhamento por Categoria</h2>
            <table>
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Planejados</th>
                  <th>Concluídos</th>
                  <th>Atrasados</th>
                  <th>Faltando</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(summaryData.by_category || {}).map(([cat, data]: [string, any]) => `
                  <tr>
                    <td>${cat}</td>
                    <td>${data.planejados}</td>
                    <td>${data.concluidos}</td>
                    <td>${data.atrasados}</td>
                    <td>${data.faltando}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <p style="margin-top: 40px; color: #999; font-size: 12px;">
            Gerado em ${new Date().toLocaleString('pt-BR')}
          </p>
        </body>
      </html>
    `;

    // Return HTML content (frontend can use print or a library to convert to PDF)
    return new Response(
      JSON.stringify({ 
        success: true, 
        htmlContent,
        filename: `relatorio-${period}-${Date.now()}.pdf`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
