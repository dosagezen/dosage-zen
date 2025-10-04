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
    // Check for Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('Missing Authorization header');
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

    console.log('User auth check:', { hasUser: !!user, error: userError?.message });

    if (userError || !user) {
      console.error('Authentication failed:', userError);
      throw new Error('Unauthorized: ' + (userError?.message || 'No user found'));
    }

    console.log('Authenticated user:', user.id);

    const requestData: ExportPDFRequest = await req.json();
    const { contextId, period, category, rangeStart, rangeEnd } = requestData;

    // Get user profile data (including id for default context)
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, nome, sobrenome, email, celular')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
    }

    // Use provided contextId or fallback to user's own profile id
    const effectiveContextId = contextId || profileData?.id;
    console.log('Using context:', effectiveContextId);

    // Get report data
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Ensure category has a fallback value
    const categoryParam = category || 'todas';
    
    console.log('Calling fn_reports_summary with params:', {
      p_context_id: effectiveContextId,
      p_range_start: rangeStart,
      p_range_end: rangeEnd,
      p_category: categoryParam,
      p_tz: userTimezone
    });

    const { data: summaryData, error: summaryError } = await supabaseClient.rpc(
      'fn_reports_summary',
      {
        p_context_id: effectiveContextId,
        p_range_start: rangeStart,
        p_range_end: rangeEnd,
        p_category: categoryParam,
        p_tz: userTimezone,
      }
    );

    if (summaryError) {
      console.error('Summary error:', summaryError);
      throw summaryError;
    }

    const { data: insightsData, error: insightsError } = await supabaseClient.rpc(
      'fn_reports_insights',
      {
        p_context_id: effectiveContextId,
        p_tz: userTimezone,
      }
    );

    if (insightsError) {
      console.error('Insights error:', insightsError);
    }

    // Format period text
    const periodText = period === 'hoje' ? 'Hoje' :
                      period === 'semana' ? 'Esta Semana' :
                      period === 'mes' ? 'Este Mês' :
                      `${new Date(rangeStart).toLocaleDateString('pt-BR')} - ${new Date(rangeEnd).toLocaleDateString('pt-BR')}`;

    const categoryText = category === 'todas' ? 'Todas as Categorias' :
                        category === 'medicacao' ? 'Medicações' :
                        category === 'consulta' ? 'Consultas' :
                        category === 'exame' ? 'Exames' :
                        category === 'atividade' ? 'Atividades' : category;

    const categoryMapping: Record<string, string> = {
      'medicacao': 'Medicações',
      'consulta': 'Consultas',
      'exame': 'Exames',
      'atividade': 'Atividades'
    };

    // Generate mobile-first responsive HTML report
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
          <title>Relatório de Saúde - DosageZen</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              color: #2c3e50;
              line-height: 1.5;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px 12px;
            }
            
            .container {
              width: 100%;
              max-width: 900px;
              margin: 0 auto;
              background: white;
              border-radius: 8px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              overflow: hidden;
            }
            
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            
            .logo {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 8px;
              letter-spacing: 1px;
            }
            
            .header h1 {
              font-size: 20px;
              font-weight: 600;
              margin: 16px 0 6px;
              line-height: 1.3;
            }
            
            .header .subtitle {
              font-size: 14px;
              opacity: 0.95;
              font-weight: 300;
              line-height: 1.4;
            }
            
            .patient-info {
              background: #f8f9fa;
              padding: 24px 20px;
              border-bottom: 1px solid #e9ecef;
            }
            
            .patient-info h2 {
              color: #667eea;
              font-size: 16px;
              margin-bottom: 12px;
              font-weight: 600;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: 12px;
            }
            
            .info-item {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }
            
            .info-label {
              font-weight: 600;
              color: #6c757d;
              font-size: 13px;
            }
            
            .info-value {
              color: #2c3e50;
              font-size: 14px;
              word-break: break-word;
              overflow-wrap: break-word;
            }
            
            .content {
              padding: 24px 20px;
            }
            
            .section {
              margin-bottom: 30px;
            }
            
            .section-title {
              color: #667eea;
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 16px;
              padding-bottom: 8px;
              border-bottom: 3px solid #667eea;
            }
            
            .metrics-grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: 15px;
              margin-bottom: 24px;
            }
            
            .metric-card {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              padding: 16px;
              border-radius: 12px;
              text-align: center;
              border-left: 4px solid #667eea;
              min-height: 120px;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            
            .metric-card.success { border-left-color: #10b981; }
            .metric-card.warning { border-left-color: #f59e0b; }
            .metric-card.danger { border-left-color: #ef4444; }
            
            .metric-value {
              font-size: 28px;
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 4px;
            }
            
            .metric-label {
              font-size: 13px;
              color: #6c757d;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            
            .metric-percentage {
              font-size: 13px;
              color: #667eea;
              font-weight: 600;
              margin-top: 4px;
            }
            
            .insights-grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: 15px;
            }
            
            .insight-card {
              background: #f8f9fa;
              padding: 16px;
              border-radius: 12px;
              border-left: 4px solid #667eea;
            }
            
            .insight-title {
              font-size: 13px;
              color: #6c757d;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            
            .insight-value {
              font-size: 18px;
              font-weight: 600;
              color: #2c3e50;
            }
            
            .insight-detail {
              font-size: 13px;
              color: #6c757d;
              margin-top: 4px;
            }
            
            .table-wrapper {
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
              margin: 0 -20px 20px;
              padding: 0 20px;
            }
            
            table {
              width: 100%;
              min-width: 600px;
              border-collapse: collapse;
              margin-top: 16px;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              font-size: 13px;
            }
            
            thead {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            
            th {
              padding: 12px 10px;
              text-align: left;
              font-weight: 600;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              white-space: nowrap;
            }
            
            td {
              padding: 12px 10px;
              border-bottom: 1px solid #e9ecef;
              white-space: nowrap;
            }
            
            tbody tr:hover {
              background: #f8f9fa;
            }
            
            tbody tr:last-child td {
              border-bottom: none;
            }
            
            .progress-bar {
              width: 100%;
              min-width: 100px;
              height: 6px;
              background: #e9ecef;
              border-radius: 10px;
              overflow: hidden;
              margin-top: 4px;
            }
            
            .progress-fill {
              height: 100%;
              background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
              border-radius: 10px;
              transition: width 0.3s ease;
            }
            
            .footer {
              background: #f8f9fa;
              padding: 24px 20px;
              text-align: center;
              border-top: 2px solid #e9ecef;
            }
            
            .footer-text {
              color: #6c757d;
              font-size: 13px;
              margin-bottom: 4px;
            }
            
            .footer-brand {
              color: #667eea;
              font-weight: 600;
              font-size: 14px;
            }

            /* Tablet (480px+) */
            @media (min-width: 480px) {
              body {
                padding: 30px 16px;
              }

              .container {
                border-radius: 12px;
              }

              .header {
                padding: 35px 24px;
              }

              .logo {
                font-size: 28px;
              }

              .header h1 {
                font-size: 24px;
              }

              .header .subtitle {
                font-size: 15px;
              }

              .content {
                padding: 30px 24px;
              }

              .section-title {
                font-size: 20px;
              }

              .metrics-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
              }

              .metric-value {
                font-size: 30px;
              }

              .insight-value {
                font-size: 19px;
              }
            }

            /* Tablet landscape / Small desktop (640px+) */
            @media (min-width: 640px) {
              .info-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
              }

              .info-item {
                flex-direction: row;
                align-items: center;
                gap: 10px;
              }

              .insights-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
              }

              .table-wrapper {
                margin: 0;
                padding: 0;
              }
            }

            /* Desktop (768px+) */
            @media (min-width: 768px) {
              body {
                padding: 40px 20px;
                line-height: 1.6;
              }

              .container {
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              }

              .header {
                padding: 40px;
              }

              .logo {
                font-size: 32px;
                margin-bottom: 10px;
              }

              .header h1 {
                font-size: 28px;
                margin: 20px 0 10px;
              }

              .header .subtitle {
                font-size: 16px;
              }

              .patient-info {
                padding: 30px 40px;
              }

              .patient-info h2 {
                font-size: 18px;
                margin-bottom: 15px;
              }

              .info-label {
                font-size: 14px;
              }

              .info-value {
                font-size: 14px;
              }

              .content {
                padding: 40px;
              }

              .section {
                margin-bottom: 40px;
              }

              .section-title {
                font-size: 20px;
                margin-bottom: 20px;
                padding-bottom: 10px;
              }

              .metrics-grid {
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-bottom: 30px;
              }

              .metric-card {
                padding: 20px;
              }

              .metric-label {
                font-size: 13px;
                margin-bottom: 10px;
              }

              .metric-value {
                font-size: 32px;
                margin-bottom: 5px;
              }

              .metric-percentage {
                font-size: 14px;
                margin-top: 5px;
              }

              .insight-card {
                padding: 20px;
              }

              .insight-title {
                font-size: 14px;
                margin-bottom: 10px;
              }

              .insight-value {
                font-size: 20px;
              }

              .insight-detail {
                font-size: 13px;
                margin-top: 5px;
              }

              table {
                font-size: 14px;
              }

              th {
                padding: 15px;
                font-size: 12px;
              }

              td {
                padding: 15px;
              }

              .progress-bar {
                height: 8px;
                margin-top: 8px;
              }

              .footer {
                padding: 30px 40px;
              }

              .footer-text {
                font-size: 13px;
                margin-bottom: 5px;
              }

              .footer-brand {
                font-size: 14px;
              }
            }
            
            @media print {
              body { background: white; padding: 0; }
              .container { box-shadow: none; border-radius: 0; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="logo">🏥 DosageZen</div>
              <h1>Relatório de Saúde e Adesão</h1>
              <p class="subtitle">${categoryText} • ${periodText}</p>
            </div>
            
            <!-- Patient Info -->
            <div class="patient-info">
              <h2>📋 Informações do Paciente</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Nome:</span>
                  <span class="info-value">${profileData?.nome || ''} ${profileData?.sobrenome || ''}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">E-mail:</span>
                  <span class="info-value">${profileData?.email || 'Não informado'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Celular:</span>
                  <span class="info-value">${profileData?.celular || 'Não informado'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Data do Relatório:</span>
                  <span class="info-value">${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
            
            <!-- Content -->
            <div class="content">
              <!-- Summary Section -->
              <div class="section">
                <h2 class="section-title">📊 Resumo Geral</h2>
                <div class="metrics-grid">
                  <div class="metric-card">
                    <div class="metric-value">${summaryData?.totals?.planejados || 0}</div>
                    <div class="metric-label">Total Planejados</div>
                  </div>
                  <div class="metric-card success">
                    <div class="metric-value">${summaryData?.totals?.concluidos || 0}</div>
                    <div class="metric-label">Concluídos</div>
                    <div class="metric-percentage">${summaryData?.totals?.concluidos_pct || 0}%</div>
                  </div>
                  <div class="metric-card warning">
                    <div class="metric-value">${summaryData?.totals?.retardatarios || 0}</div>
                    <div class="metric-label">Retardatários</div>
                    <div class="metric-percentage">${summaryData?.totals?.retardatarios_pct || 0}%</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${summaryData?.totals?.faltando || 0}</div>
                    <div class="metric-label">Pendentes</div>
                    <div class="metric-percentage">${summaryData?.totals?.faltando_pct || 0}%</div>
                  </div>
                  <div class="metric-card danger">
                    <div class="metric-value">${summaryData?.totals?.atrasados || 0}</div>
                    <div class="metric-label">Atrasados</div>
                    <div class="metric-percentage">${summaryData?.totals?.atrasados_pct || 0}%</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${summaryData?.totals?.excluidos || 0}</div>
                    <div class="metric-label">Excluídos</div>
                    <div class="metric-percentage">${summaryData?.totals?.excluidos_pct || 0}%</div>
                  </div>
                </div>
              </div>
              
              <!-- Insights Section -->
              ${insightsData ? `
              <div class="section">
                <h2 class="section-title">💡 Insights e Análises</h2>
                <div class="insights-grid">
                  <div class="insight-card">
                    <div class="insight-title">🏆 Melhor Período</div>
                    <div class="insight-value">${insightsData.best_week?.adherence_pct || 0}% de adesão</div>
                    <div class="insight-detail">Semana de ${insightsData.best_week?.start_date ? new Date(insightsData.best_week.start_date).toLocaleDateString('pt-BR') : 'N/A'}</div>
                  </div>
                  <div class="insight-card">
                    <div class="insight-title">⚠️ Mais Esquecido</div>
                    <div class="insight-value">${insightsData.most_forgotten?.item || 'N/A'}</div>
                    <div class="insight-detail">${insightsData.most_forgotten?.missed_pct || 0}% de falhas</div>
                  </div>
                  <div class="insight-card">
                    <div class="insight-title">🔥 Dias Consecutivos</div>
                    <div class="insight-value">${insightsData.consecutive_days || 0} dias</div>
                    <div class="insight-detail">Com 100% de adesão</div>
                  </div>
                  <div class="insight-card">
                    <div class="insight-title">📈 Tendência Atual</div>
                    <div class="insight-value">${insightsData.trend?.direction === 'subindo' ? '↗️ Melhorando' : insightsData.trend?.direction === 'descendo' ? '↘️ Piorando' : '➡️ Estável'}</div>
                    <div class="insight-detail">${insightsData.trend?.value || 0}% de variação</div>
                  </div>
                </div>
              </div>
              ` : ''}
              
              <!-- Category Breakdown -->
              ${summaryData?.by_category && Object.keys(summaryData.by_category).length > 0 ? `
              <div class="section">
                <h2 class="section-title">📋 Detalhamento por Categoria</h2>
                <div class="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Categoria</th>
                        <th>Planejados</th>
                        <th>Concluídos</th>
                        <th>Retardatários</th>
                        <th>Atrasados</th>
                        <th>Pendentes</th>
                        <th>Adesão</th>
                      </tr>
                    </thead>
                  <tbody>
                    ${Object.entries(summaryData.by_category).map(([cat, data]: [string, any]) => {
                      const adherence = data.planejados > 0 ? Math.round((data.concluidos / data.planejados) * 100) : 0;
                      return `
                      <tr>
                        <td><strong>${categoryMapping[cat] || cat}</strong></td>
                        <td>${data.planejados || 0}</td>
                        <td>${data.concluidos || 0}</td>
                        <td>${data.retardatarios || 0}</td>
                        <td>${data.atrasados || 0}</td>
                        <td>${data.faltando || 0}</td>
                        <td>
                          ${adherence}%
                          <div class="progress-bar">
                            <div class="progress-fill" style="width: ${adherence}%"></div>
                          </div>
                        </td>
                      </tr>
                    `}).join('')}
                  </tbody>
                  </table>
                </div>
              </div>
              ` : ''}
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p class="footer-text">Relatório gerado automaticamente em ${new Date().toLocaleString('pt-BR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              <p class="footer-brand">DosageZen - Gerenciamento Inteligente de Saúde</p>
            </div>
          </div>
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
