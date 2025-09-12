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
    const { action, id, nome, dosagem, forma, frequencia, horarios, estoque, data_inicio, data_fim, ativo, observacoes, occurrence_id, status } = body;

    console.log('Processing medication request:', { action, id });

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
        // Get ALL active medications with their occurrences
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const { data: medications, error } = await supabaseClient
          .from('medications')
          .select(`
            *,
            medication_occurrences(
              id,
              scheduled_at,
              status,
              completed_at
            )
          `)
          .eq('patient_profile_id', patientProfileId)
          .eq('ativo', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching medications:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Process medications with complete horarios and today's filter
        const medicationsWithComplete = await Promise.all(
          (medications || []).map(async (med) => {
            // All scheduled times from medication.horarios (original schedule)
            const originalHorarios = Array.isArray(med.horarios) ? med.horarios : [];
            
            // Today's occurrences from database
            const todayOccurrences = (med.medication_occurrences || []).filter((occ: any) => {
              const occDate = new Date(occ.scheduled_at).toISOString().split('T')[0];
              return occDate === today;
            });

            // Create complete horarios array with status
            const allHorarios = originalHorarios.map((horario: string) => {
              // Find matching occurrence for today
              const todayOcc = todayOccurrences.find((occ: any) => {
                const occTime = new Date(occ.scheduled_at).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
                return occTime === horario;
              });

              return {
                hora: horario,
                status: todayOcc ? todayOcc.status : 'pendente',
                occurrence_id: todayOcc?.id,
                scheduled_at: todayOcc?.scheduled_at,
                completed_at: todayOcc?.completed_at
              };
            });

            // Get next occurrence for this medication
            const { data: nextOccurrence } = await supabaseClient.rpc(
              'fn_next_occurrence', 
              { p_medication_id: med.id }
            );
            
            // Calculate if has pending doses today for "hoje" filter
            const hasPendingToday = allHorarios.some(h => h.status === 'pendente');
            
            console.log(`Med ${med.nome}: originalHorarios=${originalHorarios.length}, todayOccs=${todayOccurrences.length}, pendingToday=${hasPendingToday}`);
            
            return {
              ...med,
              proxima: nextOccurrence,
              horarios: allHorarios.sort((a: any, b: any) => a.hora.localeCompare(b.hora)),
              hasPendingToday // Helper for frontend filtering
            };
          })
        );

        console.log('Medications found:', medicationsWithComplete?.length || 0);
        return new Response(JSON.stringify({ medications: medicationsWithComplete }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create': {
        // Create new medication
        console.log('Creating medication:', { nome, dosagem, forma, frequencia, ativo });

        if (!nome || !dosagem || !forma || !frequencia) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Validate horarios format if provided
        if (horarios && Array.isArray(horarios)) {
          for (const horario of horarios) {
            if (typeof horario === 'string' && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(horario)) {
              console.error('Invalid horario format:', horario);
              return new Response(JSON.stringify({ error: 'Invalid horario format. Use HH:mm' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
        }

        const { data: medication, error } = await supabaseClient
          .from('medications')
          .insert({
            patient_profile_id: patientProfileId,
            nome,
            dosagem,
            forma,
            frequencia,
            horarios: horarios || [],
            estoque: estoque || 0,
            data_inicio,
            data_fim,
            observacoes,
            ativo: ativo !== undefined ? ativo : true
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating medication:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create occurrences for the new medication
        const horariosArray = horarios ? horarios.map((h: any) => typeof h === 'string' ? h : h.hora) : [];
        if (horariosArray.length > 0) {
          const { error: occurrenceError } = await supabaseClient.rpc(
            'fn_upsert_medication_occurrences',
            {
              p_medication_id: medication.id,
              p_patient_profile_id: patientProfileId,
              p_horarios: horariosArray,
              p_data_inicio: data_inicio || null,
              p_data_fim: data_fim || null
            }
          );

          if (occurrenceError) {
            console.error('Error creating occurrences:', occurrenceError);
          }
        }

        // Get today's occurrences for the new medication for immediate UI update
        const today = new Date().toISOString().split('T')[0];
        const { data: todayOccurrences } = await supabaseClient
          .from('medication_occurrences')
          .select('id, scheduled_at, status, completed_at')
          .eq('medication_id', medication.id)
          .gte('scheduled_at', `${today}T00:00:00Z`)
          .lt('scheduled_at', `${today}T23:59:59Z`);

        // Get next occurrence
        const { data: nextOccurrence } = await supabaseClient.rpc(
          'fn_next_occurrence', 
          { p_medication_id: medication.id }
        );

        // Create complete horarios array with all scheduled times and their status
        const originalHorarios = horariosArray || [];
        const allHorarios = originalHorarios.map((horario: string) => {
          // Find matching occurrence for today
          const todayOcc = (todayOccurrences || []).find((occ: any) => {
            const occTime = new Date(occ.scheduled_at).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            return occTime === horario;
          });

          return {
            hora: horario,
            status: todayOcc ? todayOcc.status : 'pendente',
            occurrence_id: todayOcc?.id,
            scheduled_at: todayOcc?.scheduled_at,
            completed_at: todayOcc?.completed_at
          };
        });

        // Return complete medication data with all horarios
        const completeMedication = {
          ...medication,
          proxima: nextOccurrence,
          horarios: allHorarios.sort((a: any, b: any) => a.hora.localeCompare(b.hora)),
          hasPendingToday: allHorarios.some(h => h.status === 'pendente')
        };

        console.log('Medication created successfully:', medication.id);
        return new Response(JSON.stringify({ medication: completeMedication }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        // Update existing medication
        console.log('Updating medication:', id, { ativo });

        if (!id) {
          return new Response(JSON.stringify({ error: 'Medication ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Validate horarios format if provided
        if (horarios && Array.isArray(horarios)) {
          for (const horario of horarios) {
            if (typeof horario === 'string' && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(horario)) {
              console.error('Invalid horario format:', horario);
              return new Response(JSON.stringify({ error: 'Invalid horario format. Use HH:mm' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
        }

        const { data: medication, error } = await supabaseClient
          .from('medications')
          .update({
            nome,
            dosagem,
            forma,
            frequencia,
            horarios,
            estoque,
            data_inicio,
            data_fim,
            ativo,
            observacoes
          })
          .eq('id', id)
          .eq('patient_profile_id', patientProfileId)
          .select()
          .single();

        if (error) {
          console.error('Error updating medication:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Update occurrences if horarios were modified
        if (horarios && Array.isArray(horarios)) {
          const horariosArray = horarios.map((h: any) => typeof h === 'string' ? h : h.hora);
          const { error: occurrenceError } = await supabaseClient.rpc(
            'fn_upsert_medication_occurrences',
            {
              p_medication_id: id,
              p_patient_profile_id: patientProfileId,
              p_horarios: horariosArray,
              p_data_inicio: data_inicio || medication.data_inicio,
              p_data_fim: data_fim || medication.data_fim
            }
          );

          if (occurrenceError) {
            console.error('Error updating occurrences:', occurrenceError);
          }
        }

        // Get updated data with complete horarios like in create
        const today = new Date().toISOString().split('T')[0];
        const { data: todayOccurrences } = await supabaseClient
          .from('medication_occurrences')
          .select('id, scheduled_at, status, completed_at')
          .eq('medication_id', id)
          .gte('scheduled_at', `${today}T00:00:00Z`)
          .lt('scheduled_at', `${today}T23:59:59Z`);

        const { data: nextOccurrence } = await supabaseClient.rpc(
          'fn_next_occurrence', 
          { p_medication_id: id }
        );

        // Create complete horarios array
        const originalHorarios = (horarios || medication.horarios || []);
        const allHorarios = originalHorarios.map((horario: string) => {
          const todayOcc = (todayOccurrences || []).find((occ: any) => {
            const occTime = new Date(occ.scheduled_at).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            return occTime === horario;
          });

          return {
            hora: horario,
            status: todayOcc ? todayOcc.status : 'pendente',
            occurrence_id: todayOcc?.id,
            scheduled_at: todayOcc?.scheduled_at,
            completed_at: todayOcc?.completed_at
          };
        });

        const completeMedication = {
          ...medication,
          proxima: nextOccurrence,
          horarios: allHorarios.sort((a: any, b: any) => a.hora.localeCompare(b.hora)),
          hasPendingToday: allHorarios.some(h => h.status === 'pendente')
        };

        console.log('Medication updated successfully:', id);
        return new Response(JSON.stringify({ medication: completeMedication }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        // Delete medication
        console.log('Deleting medication:', id);

        if (!id) {
          return new Response(JSON.stringify({ error: 'Medication ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabaseClient
          .from('medications')
          .delete()
          .eq('id', id)
          .eq('patient_profile_id', patientProfileId);

        if (error) {
          console.error('Error deleting medication:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('Medication deleted successfully:', id);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'mark_occurrence': {
        const { occurrence_id, status: occurrenceStatus } = body;

        if (!occurrence_id || !occurrenceStatus) {
          return new Response(JSON.stringify({ error: 'Occurrence ID and status are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: markedOccurrence, error: markError } = await supabaseClient.rpc(
          'fn_mark_occurrence',
          {
            p_occurrence_id: occurrence_id,
            p_status: occurrenceStatus
          }
        );

        if (markError) {
          console.error('Error marking occurrence:', markError);
          return new Response(JSON.stringify({ error: markError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ occurrence: markedOccurrence }), {
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