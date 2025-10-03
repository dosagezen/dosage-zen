import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationScheduleData {
  profile_id: string;
  notification_type: 'medicacao' | 'consulta' | 'exame' | 'atividade';
  entity_id: string;
  scheduled_for: string;
  title: string;
  body: string;
  data?: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, data } = await req.json();
    console.log('[Schedule Notifications] Action:', action, 'Data:', data);

    if (action === 'schedule') {
      const scheduleData: NotificationScheduleData = data;
      
      // Get user's notification preferences
      const { data: preferences, error: prefError } = await supabaseClient
        .from('notification_preferences')
        .select('*')
        .eq('profile_id', scheduleData.profile_id)
        .maybeSingle();

      if (prefError) {
        console.error('[Schedule Notifications] Error fetching preferences:', prefError);
        throw prefError;
      }

      // Check if notifications are enabled for this type
      const typeEnabled = preferences?.[`${scheduleData.notification_type}_enabled`] ?? true;
      if (!preferences?.enabled || !typeEnabled) {
        console.log('[Schedule Notifications] Notifications disabled for type:', scheduleData.notification_type);
        return new Response(
          JSON.stringify({ message: 'Notifications disabled for this type', scheduled: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert notification schedule
      const { data: scheduled, error: scheduleError } = await supabaseClient
        .from('notification_schedule')
        .insert(scheduleData)
        .select()
        .single();

      if (scheduleError) {
        console.error('[Schedule Notifications] Error scheduling:', scheduleError);
        throw scheduleError;
      }

      console.log('[Schedule Notifications] Successfully scheduled:', scheduled.id);

      return new Response(
        JSON.stringify({ scheduled: true, id: scheduled.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'cancel') {
      const { entity_id, notification_type } = data;

      const { error: cancelError } = await supabaseClient
        .from('notification_schedule')
        .update({ is_cancelled: true })
        .eq('entity_id', entity_id)
        .eq('notification_type', notification_type)
        .is('sent_at', null);

      if (cancelError) {
        console.error('[Schedule Notifications] Error cancelling:', cancelError);
        throw cancelError;
      }

      console.log('[Schedule Notifications] Successfully cancelled notifications for:', entity_id);

      return new Response(
        JSON.stringify({ cancelled: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Schedule Notifications] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
