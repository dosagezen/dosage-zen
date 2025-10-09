import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePrivacyPolicy = () => {
  return useQuery({
    queryKey: ['privacy-active'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fn_privacy_get_active');
      if (error) throw error;
      return data as {
        id: string;
        version: string;
        effective_date: string;
        content_md: string;
      } | null;
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  });
};

export const usePrivacyVersions = (limit = 10, offset = 0) => {
  return useQuery({
    queryKey: ['privacy-versions', limit, offset],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fn_privacy_list_versions', {
        p_limit: limit,
        p_offset: offset
      });
      if (error) throw error;
      return data as Array<{
        id: string;
        version: string;
        effective_date: string;
        is_active: boolean;
        created_at: string;
      }> | null;
    },
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
