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

    const body = await req.json();
    const { action, id, tipo, titulo, especialidade, medico_profissional, local_endereco, data_agendamento, duracao_minutos, status, observacoes, resultado } = body;

    console.log('Processing appointment request:', { action, id, tipo });

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

    switch (action) {
      case 'list': {
        // List appointments with optional filtering by type
        console.log('Fetching appointments for profile:', patientProfileId, 'tipo:', tipo);
        
        let query = supabaseClient
          .from('appointments')
          .select('*')
          .eq('patient_profile_id', patientProfileId);
        
        if (tipo) {
          query = query.eq('tipo', tipo);
        }
        
        const { data: appointments, error } = await query.order('data_agendamento', { ascending: true });

        if (error) {
          console.error('Error fetching appointments:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('Appointments found:', appointments?.length || 0);
        return new Response(JSON.stringify({ appointments }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create': {
        // Create new appointment
        console.log('Creating appointment:', { titulo, tipo, data_agendamento });

        if (!titulo || !data_agendamento) {
          return new Response(JSON.stringify({ error: 'Missing required fields: titulo and data_agendamento' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: appointment, error } = await supabaseClient
          .from('appointments')
          .insert({
            patient_profile_id: patientProfileId,
            titulo,
            tipo: tipo || 'consulta',
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

        console.log('Appointment created successfully:', appointment.id);
        return new Response(JSON.stringify({ appointment }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        // Update existing appointment
        console.log('Updating appointment:', id);

        if (!id) {
          return new Response(JSON.stringify({ error: 'Appointment ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const updateData: any = {};
        if (titulo !== undefined) updateData.titulo = titulo;
        if (tipo !== undefined) updateData.tipo = tipo;
        if (especialidade !== undefined) updateData.especialidade = especialidade;
        if (medico_profissional !== undefined) updateData.medico_profissional = medico_profissional;
        if (local_endereco !== undefined) updateData.local_endereco = local_endereco;
        if (data_agendamento !== undefined) updateData.data_agendamento = data_agendamento;
        if (duracao_minutos !== undefined) updateData.duracao_minutos = duracao_minutos;
        if (status !== undefined) updateData.status = status;
        if (observacoes !== undefined) updateData.observacoes = observacoes;
        if (resultado !== undefined) updateData.resultado = resultado;

        const { data: appointment, error } = await supabaseClient
          .from('appointments')
          .update(updateData)
          .eq('id', id)
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

        console.log('Appointment updated successfully:', id);
        return new Response(JSON.stringify({ appointment }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        // Delete appointment
        console.log('Deleting appointment:', id);

        if (!id) {
          return new Response(JSON.stringify({ error: 'Appointment ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabaseClient
          .from('appointments')
          .delete()
          .eq('id', id)
          .eq('patient_profile_id', patientProfileId);

        if (error) {
          console.error('Error deleting appointment:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('Appointment deleted successfully:', id);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});