import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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

    // Enviar email de boas-vindas
    try {
      const emailResponse = await resend.emails.send({
        from: 'Dosage Zen <onboarding@resend.dev>',
        to: [email],
        subject: 'Bem-vindo ao Dosage Zen - Acesso de Administrador',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">Bem-vindo ao Dosage Zen!</h1>
            <p style="font-size: 16px; color: #555;">Olá <strong>${nome}</strong>,</p>
            <p style="font-size: 16px; color: #555;">
              Você foi convidado para ser administrador da plataforma Dosage Zen. 
              Sua conta foi criada com sucesso e você já pode acessar o sistema.
            </p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Informações de Acesso:</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Perfil:</strong> Administrador</p>
            </div>
            <p style="font-size: 16px; color: #555;">
              Como administrador, você terá acesso completo ao painel administrativo onde poderá:
            </p>
            <ul style="color: #555;">
              <li>Gerenciar usuários da plataforma</li>
              <li>Visualizar relatórios e estatísticas</li>
              <li>Configurar integrações e recursos</li>
              <li>Acessar logs e informações do sistema</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://1d09a4e8-3f82-475e-a521-6d8acb12f2bd.sandbox.lovable.dev/login" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Acessar Dosage Zen
              </a>
            </div>
            <p style="font-size: 14px; color: #888; text-align: center;">
              Se você não solicitou este convite, pode ignorar este email com segurança.
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              © Dosage Zen - Sistema de Gerenciamento de Medicações
            </p>
          </div>
        `,
      });

      console.log('Email de boas-vindas enviado:', emailResponse);
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      // Não falha a operação se o email não for enviado
    }

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