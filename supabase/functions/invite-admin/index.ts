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

    // First, check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (checkError) {
      console.error('Erro ao verificar usuários existentes:', checkError);
      throw checkError;
    }

    const userExists = existingUser.users.find(user => user.email === email);

    if (userExists) {
      console.log('Usuário já existe, promovendo a admin:', email);
      
      // Get user profile (or create if missing)
      let { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', userExists.id)
        .maybeSingle();

      if (profileError) {
        console.error('Erro ao buscar perfil do usuário:', profileError);
        throw profileError;
      }

      // If profile doesn't exist, create it automatically
      if (!profile) {
        console.log('Perfil não encontrado, criando automaticamente para usuário órfão:', email);
        
        // Generate unique code for profile
        const generateUniqueCode = async (): Promise<string> => {
          let code: string;
          let isUnique = false;
          
          while (!isUnique) {
            code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const { data: existingProfile } = await supabaseAdmin
              .from('profiles')
              .select('id')
              .eq('codigo', code)
              .maybeSingle();
            
            if (!existingProfile) {
              isUnique = true;
            }
          }
          
          return code!;
        };

        const uniqueCode = await generateUniqueCode();

        // Create the missing profile
        const { data: newProfile, error: createProfileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: userExists.id,
            email: email,
            nome: nome,
            codigo: uniqueCode
          })
          .select('id')
          .single();

        if (createProfileError) {
          console.error('Erro ao criar perfil para usuário órfão:', createProfileError);
          throw new Error('Falha ao criar perfil para usuário existente');
        }

        profile = newProfile;
        console.log('Perfil criado automaticamente:', profile.id);
      }

      // Check if user already has admin role
      const { data: existingRole, error: roleCheckError } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', userExists.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleCheckError) {
        console.error('Erro ao verificar role existente:', roleCheckError);
        throw roleCheckError;
      }

      if (existingRole) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Usuário já possui privilégios de administrador',
            user_id: userExists.id,
            already_admin: true
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Create admin role for existing user
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userExists.id,
          profile_id: profile.id,
          role: 'admin',
          is_active: true
        });

      if (roleError) {
        console.error('Erro ao criar role de admin:', roleError);
        throw roleError;
      }

      console.log('Role de admin criado para usuário existente:', email);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Usuário existente promovido a administrador com sucesso',
          user_id: userExists.id,
          promoted_existing: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      console.log('Usuário não existe, enviando convite:', email);
      
      // Get the current request URL to build the correct redirect URL
      const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/')[0] + '//' + req.headers.get('referer')?.split('/')[2] || 'https://pgbjqwdhtsinnaydijfj.supabase.co';
      const redirectUrl = `${origin}/`;

      console.log('🔗 Using redirect URL:', redirectUrl);

      // Invite new user via Supabase native invite
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          nome: nome,
          role: 'admin'
        },
        redirectTo: redirectUrl
      });

      if (inviteError) {
        console.error('Erro ao convidar usuário:', inviteError);
        throw inviteError;
      }

      console.log('Convite enviado para:', email, 'User ID:', inviteData.user.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Convite de administrador enviado com sucesso',
          user_id: inviteData.user.id,
          invited_new: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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