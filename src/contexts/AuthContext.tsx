import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  nome: string;
  celular?: string;
  codigo: string;
  avatar_url?: string;
  is_gestor: boolean;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  profile_id: string;
  role: 'paciente' | 'acompanhante' | 'cuidador' | 'admin';
  context_patient_id?: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRoles: UserRole[];
  currentContext: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  switchContext: (contextPatientId: string) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [currentContext, setCurrentContext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      setProfile(profileData);

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        return;
      }

      setUserRoles(rolesData || []);

      // Set default context (own profile if is paciente, or first available context)
      const pacienteRole = rolesData?.find(role => role.role === 'paciente');
      if (pacienteRole) {
        setCurrentContext(profileData.id);
      } else if (rolesData && rolesData.length > 0) {
        setCurrentContext(rolesData[0].context_patient_id || profileData.id);
      } else {
        setCurrentContext(profileData.id);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Use setTimeout to defer async operations and prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserRoles([]);
          setCurrentContext(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          nome: userData.nome,
          celular: userData.celular,
        }
      }
    });

    if (!error && userData.initialRole) {
      // The profile creation is handled by the database trigger
      // We'll create the initial role after the profile is created
      setTimeout(async () => {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

          if (profileData) {
            await supabase.from('user_roles').insert({
              user_id: (await supabase.auth.getUser()).data.user?.id,
              profile_id: profileData.id,
              role: userData.initialRole,
              context_patient_id: userData.initialRole === 'paciente' ? profileData.id : null,
            });
          }
        } catch (roleError) {
          console.error('Error creating initial role:', roleError);
        }
      }, 1000);
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUserRoles([]);
    setCurrentContext(null);
  };

  const switchContext = (contextPatientId: string) => {
    setCurrentContext(contextPatientId);
    toast.success('Contexto alterado com sucesso');
  };

  const value = {
    user,
    session,
    profile,
    userRoles,
    currentContext,
    loading,
    signIn,
    signUp,
    signOut,
    switchContext,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};