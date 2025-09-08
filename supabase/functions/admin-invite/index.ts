import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminInviteRequest {
  first_name: string;
  last_name: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { first_name, last_name, email }: AdminInviteRequest = await req.json();

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return new Response(
        JSON.stringify({ error: 'Nome, sobrenome e e-mail são obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Formato de e-mail inválido' }),
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

    // Get current user for authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização necessário' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create regular client to verify current user
    const supabaseAnon = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if current user is admin
    const { data: isAdminResult, error: adminError } = await supabase
      .rpc('is_admin', { user_uuid: user.id });

    if (adminError || !isAdminResult) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado: privilégios de administrador necessários' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if there's already a pending invitation for this email
    const { data: existingInvites, error: inviteCheckError } = await supabase
      .from('admin_invitations')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('status', 'pendente');

    if (inviteCheckError) {
      console.error('Error checking existing invites:', inviteCheckError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar convites existentes' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (existingInvites && existingInvites.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Já existe um convite pendente para este e-mail' }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate invite token
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('generate_invite_token');

    if (tokenError || !tokenData) {
      console.error('Error generating invite token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar token de convite' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create admin invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('admin_invitations')
      .insert({
        email: email.toLowerCase(),
        first_name,
        last_name,
        invite_token: tokenData,
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
        status: 'pendente'
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar convite de administrador' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Log the action
    await supabase.rpc('log_admin_action', {
      p_action: 'admin_invite_created',
      p_entity: 'admin_invitations',
      p_entity_id: invitation.id,
      p_new_data: {
        email: email.toLowerCase(),
        first_name,
        last_name,
        invite_token: tokenData
      }
    });

    // TODO: Send email with invitation link
    // For now, we'll just log the invitation details
    console.log('Admin invitation created:', {
      email: email.toLowerCase(),
      name: `${first_name} ${last_name}`,
      token: tokenData,
      inviteLink: `${req.headers.get('origin') || supabaseUrl}/admin/signup?token=${tokenData}`
    });

    // Return success response with invitation data
    return new Response(
      JSON.stringify({
        message: 'Convite de administrador criado com sucesso',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          first_name: invitation.first_name,
          last_name: invitation.last_name,
          status: invitation.status,
          created_at: invitation.created_at,
          expires_at: invitation.expires_at
        }
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in admin-invite function:', error);
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