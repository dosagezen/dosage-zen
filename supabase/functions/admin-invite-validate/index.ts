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
    console.log('=== Admin Invite Validate Function Started ===');
    
    // Parse query parameters
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    console.log('Token received:', token);

    if (!token) {
      console.log('No token provided');
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
    console.log('Supabase client initialized');

    // Find invitation by token
    console.log('Looking for invitation with token:', token);
    const { data: invitation, error } = await supabase
      .from('admin_invitations')
      .select('*')
      .eq('invite_token', token)
      .single();

    console.log('Invitation query result:', { invitation, error });

    if (error || !invitation) {
      console.log('Invitation not found or error:', error);
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
    console.log('Time check:', { now: now.toISOString(), expiresAt: expiresAt.toISOString() });

    if (now > expiresAt) {
      console.log('Invitation expired');
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
    console.log('Invitation status:', invitation.status);
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

      console.log('Invitation status invalid:', errorMessage);
      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate a unique user code for the new admin
    console.log('Generating user code...');
    const { data: userCode, error: codeError } = await supabase
      .rpc('generate_unique_code');

    console.log('User code generation result:', { userCode, codeError });

    if (codeError || !userCode) {
      console.error('Error generating user code:', codeError);
      // Fallback: generate a simple code if the function fails
      const fallbackCode = Math.random().toString(36).substr(2, 6).toUpperCase();
      console.log('Using fallback code:', fallbackCode);
      
      return new Response(
        JSON.stringify({
          invitation: {
            email: invitation.email,
            first_name: invitation.first_name,
            last_name: invitation.last_name,
            user_code: fallbackCode,
            expires_at: invitation.expires_at
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return invitation data
    console.log('Returning successful response with user code:', userCode);
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