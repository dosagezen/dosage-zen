import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse query parameters
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token de convite é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find invitation by token
    const { data: invitation, error } = await supabase
      .from('admin_invitations')
      .select('*')
      .eq('invite_token', token)
      .single();

    if (error || !invitation) {
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

    // Check invitation status
    if (invitation.status !== 'pendente') {
      let errorMessage = 'Convite não está mais disponível';
      
      switch (invitation.status) {
        case 'aceito':
          errorMessage = 'Este convite já foi aceito';
          break;
        case 'revogado':
          errorMessage = 'Este convite foi cancelado';
          break;
        case 'expirado':
          errorMessage = 'Este convite expirou';
          break;
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate a unique user code for the new admin
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

    // Return invitation data
    return new Response(
      JSON.stringify({
        invitation: {
          email: invitation.email,
          first_name: invitation.first_name,
          last_name: invitation.last_name,
          user_code: userCode,
          expires_at: invitation.expires_at
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in admin-invite-validate function:', error);
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