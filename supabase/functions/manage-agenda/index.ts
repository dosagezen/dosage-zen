import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user profile ID
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    const body = await req.json();
    const { action } = body;

    console.log('Agenda action:', action, 'User:', user.id);

    switch (action) {
      case 'list': {
        const { 
          range_start, 
          range_end, 
          context_id, 
          category, 
          status, 
          search, 
          page = 1, 
          page_size = 50 
        } = body;

        let query = supabaseClient
          .from('appointments')
          .select('*')
          .eq('patient_profile_id', context_id || profile.id)
          .order('data_agendamento', { ascending: true });

        if (range_start) query = query.gte('data_agendamento', range_start);
        if (range_end) query = query.lte('data_agendamento', range_end);
        if (category) query = query.eq('tipo', category);
        if (status) query = query.eq('status', status);

        if (search) {
          query = query.or(`
            titulo.ilike.%${search}%,
            especialidade.ilike.%${search}%,
            medico_profissional.ilike.%${search}%,
            local_endereco.ilike.%${search}%
          `);
        }

        const offset = (page - 1) * page_size;
        query = query.range(offset, offset + page_size - 1);

        const { data: appointments, error } = await query;
        if (error) throw error;

        return new Response(JSON.stringify({ appointments }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create': {
        const {
          tipo,
          titulo,
          especialidade,
          medico_profissional,
          local_endereco,
          data_agendamento,
          duracao_minutos,
          observacoes,
          context_id,
          // Activity specific fields
          dias_semana,
          repeticao
        } = body;

        // Create base appointment using existing structure
        const appointmentData = {
          patient_profile_id: context_id || profile.id,
          tipo,
          titulo,
          especialidade,
          medico_profissional,
          local_endereco,
          data_agendamento,
          duracao_minutos: duracao_minutos || 60,
          observacoes,
          status: 'agendado'
        };

        const { data: appointment, error } = await supabaseClient
          .from('appointments')
          .insert(appointmentData)
          .select()
          .single();

        if (error) throw error;

        // For activities with recurrence, we'll handle this in the future
        // For now, just create the basic appointment

        return new Response(JSON.stringify({ appointment }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        const { id, context_id, ...updateData } = body;

        // Validação de entrada
        if (!id || typeof id !== 'string') {
          throw new Error('ID do compromisso é obrigatório e deve ser uma string válida');
        }

        // Limpar dados de entrada
        const cleanedData = Object.fromEntries(
          Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== null)
        );

        console.log('Updating appointment:', id, 'with data:', cleanedData);

        // Verificar se o compromisso existe e pertence ao usuário
        const { data: existingAppointment, error: checkError } = await supabaseClient
          .from('appointments')
          .select('id, patient_profile_id')
          .eq('id', id)
          .eq('patient_profile_id', context_id || profile.id)
          .single();

        if (checkError || !existingAppointment) {
          console.error('Appointment not found or access denied:', checkError);
          throw new Error('Compromisso não encontrado ou acesso negado');
        }

        // Atualizar o compromisso
        const { data: appointment, error } = await supabaseClient
          .from('appointments')
          .update({
            ...cleanedData,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Update error:', error);
          throw new Error(`Erro ao atualizar: ${error.message}`);
        }

        console.log('Appointment updated successfully:', appointment?.id);

        return new Response(JSON.stringify({ appointment }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        const { id, context_id } = body;

        // Soft delete - set status to cancelled with permission check
        const { data: appointment, error } = await supabaseClient
          .from('appointments')
          .update({ status: 'cancelado' })
          .eq('id', id)
          .eq('patient_profile_id', context_id || profile.id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ appointment }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'complete': {
        const { id, context_id } = body;

        const { data: appointment, error } = await supabaseClient
          .from('appointments')
          .update({ 
            status: 'realizado',
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('patient_profile_id', context_id || profile.id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ appointment }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'day_counts': {
        const { month_start, month_end, context_id } = body;

        // Get appointments for the month and count by day and category
        const { data: appointments, error } = await supabaseClient
          .from('appointments')
          .select('data_agendamento, tipo, status')
          .eq('patient_profile_id', context_id || profile.id)
          .gte('data_agendamento', month_start)
          .lte('data_agendamento', month_end)
          .eq('status', 'agendado');

        if (error) throw error;

        // Group by day and count by category
        const counts: Record<string, { consultas: number; exames: number; atividades: number }> = {};
        
        appointments?.forEach(apt => {
          const date = apt.data_agendamento.split('T')[0];
          if (!counts[date]) {
            counts[date] = { consultas: 0, exames: 0, atividades: 0 };
          }
          
          if (apt.tipo === 'consulta') counts[date].consultas++;
          else if (apt.tipo === 'exame') counts[date].exames++;
          else if (apt.tipo === 'atividade') counts[date].atividades++;
        });

        return new Response(JSON.stringify({ counts }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error in manage-agenda function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});