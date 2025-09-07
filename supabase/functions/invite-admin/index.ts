import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

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
    const { email, nome } = await req.json();

    console.log('Convidando admin:', { email, nome });

    // Validate input
    if (!email || !nome) {
      throw new Error('Email e nome são obrigatórios');
    }

    // Create admin Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create user in auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        nome: nome
      }
    });

    if (authError) {
      console.error('Erro ao criar usuário:', authError);
      throw authError;
    }

    console.log('Usuário criado:', authData.user.id);

    // Wait a bit for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Get the created profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
      throw profileError;
    }

    console.log('Perfil encontrado:', profileData.id);

    // Create admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        profile_id: profileData.id,
        role: 'admin',
        is_active: true
      });

    if (roleError) {
      console.error('Erro ao criar role:', roleError);
      throw roleError;
    }

    console.log('Role de admin criado com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Administrador convidado com sucesso',
        user_id: authData.user.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Erro na function invite-admin:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        details: error 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});