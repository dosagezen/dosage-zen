import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTermsAcceptance = () => {
  return useMutation({
    mutationFn: async ({ 
      termsId, 
      userId 
    }: { 
      termsId: string; 
      userId: string;
    }) => {
      const userAgent = navigator.userAgent;
      
      const { error } = await supabase.rpc('fn_terms_log_accept', {
        p_terms_id: termsId,
        p_user_id: userId,
        p_user_agent: userAgent,
        p_acceptance_method: 'checkbox'
      });
      
      if (error) throw error;
    }
  });
};

export const useTermsViewLog = () => {
  return useMutation({
    mutationFn: async ({ 
      termsId, 
      userId 
    }: { 
      termsId: string; 
      userId?: string;
    }) => {
      const userAgent = navigator.userAgent;
      
      const { error } = await supabase.rpc('fn_terms_log_view', {
        p_terms_id: termsId,
        p_viewer_user_id: userId || null,
        p_user_agent: userAgent
      });
      
      if (error) throw error;
    }
  });
};
