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

    // Generate elegant HTML-based PDF content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório de Saúde - DosageZen</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #2c3e50;
              line-height: 1.6;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 20px;
            }
            
            .container {
              max-width: 900px;
              margin: 0 auto;
              background: white;
              border-radius: 16px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              overflow: hidden;
            }
            
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px;
              text-align: center;
            }
            
            .logo {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 10px;
              letter-spacing: 1px;
            }
            
            .header h1 {
              font-size: 28px;
              font-weight: 600;
              margin: 20px 0 10px;
            }
            
            .header .subtitle {
              font-size: 16px;
              opacity: 0.9;
              font-weight: 300;
            }
            
            .patient-info {
              background: #f8f9fa;
              padding: 30px 40px;
              border-bottom: 1px solid #e9ecef;
            }
            
            .patient-info h2 {
              color: #667eea;
              font-size: 18px;
              margin-bottom: 15px;
              font-weight: 600;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
            }
            
            .info-item {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .info-label {
              font-weight: 600;
              color: #6c757d;
              font-size: 14px;
            }
            
            .info-value {
              color: #2c3e50;
              font-size: 14px;
            }
            
            .content {
              padding: 40px;
            }
            
            .section {
              margin-bottom: 40px;
            }
            
            .section-title {
              color: #667eea;
              font-size: 20px;
              font-weight: 600;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 2px solid #e9ecef;
            }
            
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            
            .metric-card {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              padding: 20px;
              border-radius: 12px;
              text-align: center;
              border-left: 4px solid #667eea;
            }
            
            .metric-card.success { border-left-color: #10b981; }
            .metric-card.warning { border-left-color: #f59e0b; }
            .metric-card.danger { border-left-color: #ef4444; }
            
            .metric-value {
              font-size: 32px;
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 5px;
            }
            
            .metric-label {
              font-size: 13px;
              color: #6c757d;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .metric-percentage {
              font-size: 14px;
              color: #667eea;
              font-weight: 600;
              margin-top: 5px;
            }
            
            .insights-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
            }
            
            .insight-card {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 12px;
              border-left: 4px solid #667eea;
            }
            
            .insight-title {
              font-size: 14px;
              color: #6c757d;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 10px;
            }
            
            .insight-value {
              font-size: 20px;
              font-weight: 600;
              color: #2c3e50;
            }
            
            .insight-detail {
              font-size: 13px;
              color: #6c757d;
              margin-top: 5px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            thead {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            
            th {
              padding: 15px;
              text-align: left;
              font-weight: 600;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            td {
              padding: 15px;
              border-bottom: 1px solid #e9ecef;
              font-size: 14px;
            }
            
            tbody tr:hover {
              background: #f8f9fa;
            }
            
            tbody tr:last-child td {
              border-bottom: none;
            }
            
            .progress-bar {
              width: 100%;
              height: 8px;
              background: #e9ecef;
              border-radius: 4px;
              overflow: hidden;
              margin-top: 8px;
            }
            
            .progress-fill {
              height: 100%;
              background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
              border-radius: 4px;
              transition: width 0.3s ease;
            }
            
            .footer {
              background: #f8f9fa;
              padding: 30px 40px;
              text-align: center;
              border-top: 1px solid #e9ecef;
            }
            
            .footer-text {
              color: #6c757d;
              font-size: 13px;
              margin-bottom: 5px;
            }
            
            .footer-brand {
              color: #667eea;
              font-weight: 600;
              font-size: 14px;
            }
            
            @media print {
              body { background: white; padding: 0; }
              .container { box-shadow: none; }
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
