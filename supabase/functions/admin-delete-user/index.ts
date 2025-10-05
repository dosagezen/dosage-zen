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

    // Check if requesting user is admin using security definer function
    const { data: isAdminData, error: isAdminError } = await supabaseAdmin
      .rpc('is_admin', { user_uuid: user.id });

    if (isAdminError || !isAdminData) {
      console.error('Admin check failed:', isAdminError);
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem executar esta ação.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { userEmail } = await req.json();

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: 'Email do usuário é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${user.email} requesting deletion of user: ${userEmail}`);

    // Find user by email in auth.users
    const { data: targetAuthUser, error: findUserError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (findUserError) {
      console.error('Error finding user:', findUserError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetUser = targetAuthUser.users.find(u => u.email === userEmail);

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetUserId = targetUser.id;

    // Get user's profile_id
    const { data: profileData, error: profileFetchError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', targetUserId)
      .single();

    if (profileFetchError || !profileData) {
      console.error('Error fetching profile:', profileFetchError);
      return new Response(
        JSON.stringify({ error: 'Perfil não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const profileId = profileData.id;
    console.log(`Found profile_id: ${profileId} for user: ${targetUserId}`);

    const deletionReport: string[] = [];

    // Delete related data in correct order to avoid FK constraint violations
    // 1. Delete medication_occurrences
    const { error: occurrencesError, count: occurrencesCount } = await supabaseAdmin
      .from('medication_occurrences')
      .delete({ count: 'exact' })
      .eq('patient_profile_id', profileId);
    
    if (occurrencesError) {
      console.error('Error deleting medication_occurrences:', occurrencesError);
    } else {
      deletionReport.push(`medication_occurrences: ${occurrencesCount || 0} rows`);
      console.log('Deleted medication_occurrences');
    }

    // 2. Delete medication_schedules
    const { error: schedulesError, count: schedulesCount } = await supabaseAdmin
      .from('medication_schedules')
      .delete({ count: 'exact' })
      .eq('patient_profile_id', profileId);
    
    if (schedulesError) {
      console.error('Error deleting medication_schedules:', schedulesError);
    } else {
      deletionReport.push(`medication_schedules: ${schedulesCount || 0} rows`);
      console.log('Deleted medication_schedules');
    }

    // 3. Delete medication_check_log
    const { error: checkLogError, count: checkLogCount } = await supabaseAdmin
      .from('medication_check_log')
      .delete({ count: 'exact' })
      .eq('user_id', targetUserId);
    
    if (checkLogError) {
      console.error('Error deleting medication_check_log:', checkLogError);
    } else {
      deletionReport.push(`medication_check_log: ${checkLogCount || 0} rows`);
      console.log('Deleted medication_check_log');
    }

    // 4. Delete medications
    const { error: medicationsError, count: medicationsCount } = await supabaseAdmin
      .from('medications')
      .delete({ count: 'exact' })
      .eq('patient_profile_id', profileId);
    
    if (medicationsError) {
      console.error('Error deleting medications:', medicationsError);
    } else {
      deletionReport.push(`medications: ${medicationsCount || 0} rows`);
      console.log('Deleted medications');
    }

    // 5. Delete appointments
    const { error: appointmentsError, count: appointmentsCount } = await supabaseAdmin
      .from('appointments')
      .delete({ count: 'exact' })
      .eq('patient_profile_id', profileId);
    
    if (appointmentsError) {
      console.error('Error deleting appointments:', appointmentsError);
    } else {
      deletionReport.push(`appointments: ${appointmentsCount || 0} rows`);
      console.log('Deleted appointments');
    }

    // 6. Delete collaborations
    const { error: collabError, count: collabCount } = await supabaseAdmin
      .from('collaborations')
      .delete({ count: 'exact' })
      .or(`patient_profile_id.eq.${profileId},collaborator_profile_id.eq.${profileId}`);
    
    if (collabError) {
      console.error('Error deleting collaborations:', collabError);
    } else {
      deletionReport.push(`collaborations: ${collabCount || 0} rows`);
      console.log('Deleted collaborations');
    }

    // 7. Delete invitations
    const { error: invitationsError, count: invitationsCount } = await supabaseAdmin
      .from('invitations')
      .delete({ count: 'exact' })
      .or(`patient_profile_id.eq.${profileId},created_by.eq.${targetUserId}`);
    
    if (invitationsError) {
      console.error('Error deleting invitations:', invitationsError);
    } else {
      deletionReport.push(`invitations: ${invitationsCount || 0} rows`);
      console.log('Deleted invitations');
    }

    // 8. Delete notification_schedule
    const { error: notificationScheduleError, count: notificationScheduleCount } = await supabaseAdmin
      .from('notification_schedule')
      .delete({ count: 'exact' })
      .eq('profile_id', profileId);
    
    if (notificationScheduleError) {
      console.error('Error deleting notification_schedule:', notificationScheduleError);
    } else {
      deletionReport.push(`notification_schedule: ${notificationScheduleCount || 0} rows`);
      console.log('Deleted notification_schedule');
    }

    // 9. Delete push_subscriptions
    const { error: pushSubscriptionsError, count: pushSubscriptionsCount } = await supabaseAdmin
      .from('push_subscriptions')
      .delete({ count: 'exact' })
      .eq('user_id', targetUserId);
    
    if (pushSubscriptionsError) {
      console.error('Error deleting push_subscriptions:', pushSubscriptionsError);
    } else {
      deletionReport.push(`push_subscriptions: ${pushSubscriptionsCount || 0} rows`);
      console.log('Deleted push_subscriptions');
    }

    // 10. Delete notification_preferences
    const { error: notificationPreferencesError, count: notificationPreferencesCount } = await supabaseAdmin
      .from('notification_preferences')
      .delete({ count: 'exact' })
      .eq('profile_id', profileId);
    
    if (notificationPreferencesError) {
      console.error('Error deleting notification_preferences:', notificationPreferencesError);
    } else {
      deletionReport.push(`notification_preferences: ${notificationPreferencesCount || 0} rows`);
      console.log('Deleted notification_preferences');
    }

    // 11. Delete subscriptions
    const { error: subscriptionsError, count: subscriptionsCount } = await supabaseAdmin
      .from('subscriptions')
      .delete({ count: 'exact' })
      .eq('patient_profile_id', profileId);
    
    if (subscriptionsError) {
      console.error('Error deleting subscriptions:', subscriptionsError);
    } else {
      deletionReport.push(`subscriptions: ${subscriptionsCount || 0} rows`);
      console.log('Deleted subscriptions');
    }

    // 12. Delete user_roles
    const { error: rolesError, count: rolesCount } = await supabaseAdmin
      .from('user_roles')
      .delete({ count: 'exact' })
      .eq('user_id', targetUserId);
    
    if (rolesError) {
      console.error('Error deleting user_roles:', rolesError);
    } else {
      deletionReport.push(`user_roles: ${rolesCount || 0} rows`);
      console.log('Deleted user_roles');
    }

    // 13. Delete profile
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
    deletionReport.push('profiles: 1 row');
    console.log('Deleted profile');

    // 14. Finally, delete the auth user using Admin API
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Erro ao excluir conta. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    deletionReport.push('auth.users: 1 row');

    console.log(`User account deleted successfully by admin: ${user.email}`);

    // Log admin action in audit_logs
    try {
      await supabaseAdmin.rpc('log_admin_action', {
        p_action: 'DELETE_USER',
        p_entity: 'users',
        p_entity_id: targetUserId,
        p_old_data: {
          email: userEmail,
          user_id: targetUserId,
          profile_id: profileId
        },
        p_new_data: null
      });
    } catch (auditError) {
      console.error('Error logging admin action:', auditError);
      // Don't fail the request if audit log fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuário removido com sucesso',
        deleted: {
          user_id: targetUserId,
          profile_id: profileId,
          email: userEmail,
          tables_affected: deletionReport
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in admin-delete-user:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
