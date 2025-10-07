import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  role: 'paciente' | 'acompanhante' | 'cuidador' | 'admin' | 'gestor';
  context_patient_id?: string;
  is_active: boolean;
  email_confirmed: boolean;
  created_at: string;
  updated_at: string;
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

  const profileFetchUserIdRef = useRef<string | null>(null);
  const isFetchingProfileRef = useRef(false);

  const fetchProfile = async (userId: string) => {
    try {
      if (isFetchingProfileRef.current && profileFetchUserIdRef.current === userId) {
        console.log('AuthContext: Skip duplicate profile fetch for userId:', userId);
        return;
      }
      isFetchingProfileRef.current = true;
      profileFetchUserIdRef.current = userId;
      console.log('AuthContext: Fetching profile for userId:', userId);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setLoading(false);
        return;
      }

      console.log('AuthContext: Profile fetched successfully:', profileData);
      setProfile(profileData);

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        setUserRoles([]);
      } else {
        console.log('AuthContext: Roles fetched:', rolesData);
        setUserRoles(rolesData || []);
      }

      // Set default context (own profile if is paciente, or first available context)
      const pacienteRole = rolesData?.find(role => role.role === 'paciente');
      if (pacienteRole) {
        console.log('AuthContext: Setting context to own profile (paciente)');
        setCurrentContext(profileData.id);
      } else if (rolesData && rolesData.length > 0) {
        console.log('AuthContext: Setting context to first available role');
        setCurrentContext(rolesData[0].context_patient_id || profileData.id);
      } else {
        console.log('AuthContext: Setting context to own profile (default)');
        setCurrentContext(profileData.id);
      }

      // Always set loading to false after profile fetch completes
      console.log('AuthContext: Profile fetch complete, setting loading false');
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setLoading(false);
    } finally {
      isFetchingProfileRef.current = false;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');
    
    // Set up auth state listener - NEVER use async here to prevent deadlock
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthContext: Auth state changed', { event, hasUser: !!session?.user });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // PROTEÇÃO: NÃO buscar perfil se estiver na rota de reset-password
        const isResetPasswordRoute = window.location.pathname === '/reset-password';
        
        // Use setTimeout to defer async operations and prevent deadlock
        if (session?.user && !isResetPasswordRoute) {
          setTimeout(() => {
            console.log('AuthContext: Fetching profile for user', session.user.id);
            fetchProfile(session.user.id);
          }, 0);
        } else if (isResetPasswordRoute) {
          console.log('AuthContext: Skipping profile fetch - on reset-password route');
          setLoading(false);
        } else {
          console.log('AuthContext: No user, clearing profile data');
          setProfile(null);
          setUserRoles([]);
          setCurrentContext(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    console.log('AuthContext: Checking for existing session');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session check', { hasUser: !!session?.user });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('AuthContext: Found existing session, will rely on onAuthStateChange to fetch profile');
      } else {
        console.log('AuthContext: No existing session, setting loading false');
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
          sobrenome: userData.sobrenome,
          celular: userData.celular,
        }
      }
    });

    // Profile and role creation are now handled automatically by database triggers
    // No manual intervention needed
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUserRoles([]);
    setCurrentContext(null);
    profileFetchUserIdRef.current = null;
    isFetchingProfileRef.current = false;
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