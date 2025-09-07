import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const method = req.method;
    const url = new URL(req.url);
    const appointmentId = url.searchParams.get('id');
    const tipo = url.searchParams.get('tipo'); // consulta, exame, atividade

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's profile to determine patient_profile_id
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const patientProfileId = profile.id;

    switch (method) {
      case 'GET': {
        // List appointments with optional filtering by type
        let query = supabaseClient
          .from('appointments')
          .select('*')
          .eq('patient_profile_id', patientProfileId)
          .order('data_agendamento', { ascending: true });

        if (tipo) {
          query = query.eq('tipo', tipo);
        }

        const { data: appointments, error } = await query;

        if (error) {
          console.error('Error fetching appointments:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ appointments }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'POST': {
        // Create new appointment
        const body = await req.json();
        const { 
          tipo, titulo, especialidade, medico_profissional, local_endereco, 
          data_agendamento, duracao_minutos, observacoes 
        } = body;

        if (!titulo || !data_agendamento) {
          return new Response(JSON.stringify({ error: 'Missing required fields: titulo, data_agendamento' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: appointment, error } = await supabaseClient
          .from('appointments')
          .insert({
            patient_profile_id: patientProfileId,
            tipo: tipo || 'consulta',
            titulo,
            especialidade,
            medico_profissional,
            local_endereco,
            data_agendamento,
            duracao_minutos: duracao_minutos || 60,
            status: 'agendado',
            observacoes
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating appointment:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ appointment }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'PUT': {
        // Update existing appointment
        if (!appointmentId) {
          return new Response(JSON.stringify({ error: 'Appointment ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const body = await req.json();
        const { 
          tipo, titulo, especialidade, medico_profissional, local_endereco, 
          data_agendamento, duracao_minutos, status, observacoes, resultado 
        } = body;

        const { data: appointment, error } = await supabaseClient
          .from('appointments')
          .update({
            tipo,
            titulo,
            especialidade,
            medico_profissional,
            local_endereco,
            data_agendamento,
            duracao_minutos,
            status,
            observacoes,
            resultado
          })
          .eq('id', appointmentId)
          .eq('patient_profile_id', patientProfileId)
          .select()
          .single();

        if (error) {
          console.error('Error updating appointment:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ appointment }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'DELETE': {
        // Delete appointment
        if (!appointmentId) {
          return new Response(JSON.stringify({ error: 'Appointment ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabaseClient
          .from('appointments')
          .delete()
          .eq('id', appointmentId)
          .eq('patient_profile_id', patientProfileId);

        if (error) {
          console.error('Error deleting appointment:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});