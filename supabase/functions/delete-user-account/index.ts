import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Deleting user account: ${user.id}`);

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get user's profile_id
    const { data: profileData, error: profileFetchError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileFetchError || !profileData) {
      console.error('Error fetching profile:', profileFetchError);
      return new Response(
        JSON.stringify({ error: 'Perfil não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const profileId = profileData.id;
    console.log(`Found profile_id: ${profileId}`);

    // Delete related data in correct order to avoid FK constraint violations
    // 1. Delete medication_occurrences (references medications and profiles)
    const { error: occurrencesError } = await supabaseAdmin
      .from('medication_occurrences')
      .delete()
      .eq('patient_profile_id', profileId);
    
    if (occurrencesError) {
      console.error('Error deleting medication_occurrences:', occurrencesError);
    } else {
      console.log('Deleted medication_occurrences');
    }

    // 2. Delete medication_schedules
    const { error: schedulesError } = await supabaseAdmin
      .from('medication_schedules')
      .delete()
      .eq('patient_profile_id', profileId);
    
    if (schedulesError) {
      console.error('Error deleting medication_schedules:', schedulesError);
    } else {
      console.log('Deleted medication_schedules');
    }

    // 3. Delete medication_check_log
    const { error: checkLogError } = await supabaseAdmin
      .from('medication_check_log')
      .delete()
      .eq('user_id', user.id);
    
    if (checkLogError) {
      console.error('Error deleting medication_check_log:', checkLogError);
    } else {
      console.log('Deleted medication_check_log');
    }

    // 4. Delete medications
    const { error: medicationsError } = await supabaseAdmin
      .from('medications')
      .delete()
      .eq('patient_profile_id', profileId);
    
    if (medicationsError) {
      console.error('Error deleting medications:', medicationsError);
    } else {
      console.log('Deleted medications');
    }

    // 5. Delete appointments
    const { error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('patient_profile_id', profileId);
    
    if (appointmentsError) {
      console.error('Error deleting appointments:', appointmentsError);
    } else {
      console.log('Deleted appointments');
    }

    // 6. Delete collaborations (both as patient and collaborator)
    const { error: collabError } = await supabaseAdmin
      .from('collaborations')
      .delete()
      .or(`patient_profile_id.eq.${profileId},collaborator_profile_id.eq.${profileId}`);
    
    if (collabError) {
      console.error('Error deleting collaborations:', collabError);
    } else {
      console.log('Deleted collaborations');
    }

    // 7. Delete invitations
    const { error: invitationsError } = await supabaseAdmin
      .from('invitations')
      .delete()
      .or(`patient_profile_id.eq.${profileId},created_by.eq.${user.id}`);
    
    if (invitationsError) {
      console.error('Error deleting invitations:', invitationsError);
    } else {
      console.log('Deleted invitations');
    }

    // 8. Delete subscriptions
    const { error: subscriptionsError } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('patient_profile_id', profileId);
    
    if (subscriptionsError) {
      console.error('Error deleting subscriptions:', subscriptionsError);
    } else {
      console.log('Deleted subscriptions');
    }

    // 9. Delete user_roles
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);
    
    if (rolesError) {
      console.error('Error deleting user_roles:', rolesError);
    } else {
      console.log('Deleted user_roles');
    }

    // 10. Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', profileId);
    
    if (profileError) {
      console.error('Error deleting profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Erro ao excluir perfil. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('Deleted profile');

    // 11. Finally, delete the auth user using Admin API
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Erro ao excluir conta. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User account deleted successfully: ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Conta excluída com sucesso' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in delete-user-account:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
