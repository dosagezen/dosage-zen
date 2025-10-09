import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePrivacyAcceptance = () => {
  return useMutation({
    mutationFn: async ({ 
      policyId, 
      userId 
    }: { 
      policyId: string; 
      userId: string;
    }) => {
      const userAgent = navigator.userAgent;
      
      const { error } = await supabase.rpc('fn_privacy_log_accept', {
        p_policy_id: policyId,
        p_user_id: userId,
        p_user_agent: userAgent,
        p_acceptance_method: 'checkbox'
      });
      
      if (error) throw error;
    }
  });
};

export const usePrivacyViewLog = () => {
  return useMutation({
    mutationFn: async ({ 
      policyId, 
      userId 
    }: { 
      policyId: string; 
      userId?: string;
    }) => {
      const userAgent = navigator.userAgent;
      
      const { error } = await supabase.rpc('fn_privacy_log_view', {
        p_policy_id: policyId,
        p_viewer_user_id: userId || null,
        p_user_agent: userAgent
      });
      
      if (error) throw error;
    }
  });
};
