import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminSignupRequest {
  invite_token: string;
  password: string;
  password_confirm: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { invite_token, password, password_confirm }: AdminSignupRequest = await req.json();

    // Validate required fields
    if (!invite_token || !password || !password_confirm) {
      return new Response(
        JSON.stringify({ error: 'Token, senha e confirmação de senha são obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate password confirmation
    if (password !== password_confirm) {
      return new Response(
        JSON.stringify({ error: 'Senhas não coincidem' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Senha deve ter pelo menos 8 caracteres' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    
    if (!hasUppercase || !hasDigit) {
      return new Response(
        JSON.stringify({ error: 'Senha deve conter pelo menos uma letra maiúscula e um dígito' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find and validate invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('admin_invitations')
      .select('*')
      .eq('invite_token', invite_token)
      .single();

    if (inviteError || !invitation) {
      return new Response(
        JSON.stringify({ error: 'Token de convite inválido' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if invitation is still valid
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    if (now > expiresAt) {
      // Mark invitation as expired
      await supabase
        .from('admin_invitations')
        .update({ status: 'expirado' })
        .eq('id', invitation.id);

      return new Response(
        JSON.stringify({ error: 'Convite expirado' }),
        {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (invitation.status !== 'pendente') {
      return new Response(
        JSON.stringify({ error: 'Convite não está mais disponível' }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user already exists in auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users?.find(u => u.email === invitation.email);

    let authUser;

    if (existingUser) {
      // User exists, update with password
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password }
      );

      if (updateError) {
        console.error('Error updating existing user:', updateError);
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar usuário existente' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      authUser = updatedUser.user;
    } else {
      // Create new auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: invitation.email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: invitation.first_name,
          last_name: invitation.last_name,
          role: 'admin'
        }
      });

      if (createError) {
        console.error('Error creating auth user:', createError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar usuário de autenticação' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      authUser = newUser.user;
    }

    if (!authUser) {
      return new Response(
        JSON.stringify({ error: 'Erro ao processar usuário' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate unique code for profile
    const { data: userCode, error: codeError } = await supabase
      .rpc('generate_unique_code');

    if (codeError || !userCode) {
      console.error('Error generating user code:', codeError);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar código de usuário' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create or update profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: authUser.id,
        email: invitation.email,
        nome: `${invitation.first_name} ${invitation.last_name}`,
        codigo: userCode
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating/updating profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar perfil de usuário' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: authUser.id,
        profile_id: profile.id,
        role: 'admin',
        is_active: true,
        email_confirmed: true
      });

    if (roleError) {
      console.error('Error creating admin role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar role de administrador' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Mark invitation as accepted
    const { error: updateInviteError } = await supabase
      .from('admin_invitations')
      .update({ status: 'aceito' })
      .eq('id', invitation.id);

    if (updateInviteError) {
      console.error('Error updating invitation status:', updateInviteError);
    }

    // Log the action
    await supabase.rpc('log_admin_action', {
      p_action: 'admin_invite_accepted',
      p_entity: 'admin_invitations',
      p_entity_id: invitation.id,
      p_new_data: {
        user_id: authUser.id,
        profile_id: profile.id,
        email: invitation.email
      }
    });

    // Return success response
    return new Response(
      JSON.stringify({
        message: 'Convite aceito com sucesso',
        user: {
          id: authUser.id,
          email: authUser.email,
          profile: {
            id: profile.id,
            nome: profile.nome,
            codigo: profile.codigo
          }
        },
        redirect_hint: '/admin'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in admin-signup-accept function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);