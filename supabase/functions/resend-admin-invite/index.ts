import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResendInviteRequest {
  email: string;
  nome: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, nome }: ResendInviteRequest = await req.json();

    if (!email || !nome) {
      throw new Error('Email e nome são obrigatórios');
    }

    console.log('Reenviando convite para:', { email, nome });

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user exists and get user info
    const { data: existingUsers, error: checkError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (checkError) {
      console.error('Erro ao verificar usuários existentes:', checkError);
      throw checkError;
    }

    const userExists = existingUsers.users.find(user => user.email === email);

    if (!userExists) {
      throw new Error('Usuário não encontrado para reenvio de convite');
    }

    // Check if user already confirmed email
    if (userExists.email_confirmed_at) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Usuário já confirmou o email. Não é necessário reenviar o convite.',
          already_confirmed: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Resend invitation for unconfirmed user
    const { error: resendError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        nome: nome,
        role: 'admin'
      }
    });

    if (resendError) {
      console.error('Erro ao reenviar convite:', resendError);
      throw resendError;
    }

    console.log('Convite reenviado com sucesso para:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Convite reenviado com sucesso',
        user_id: userExists.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Erro na function resend-admin-invite:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);