import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTermsOfUse = () => {
  return useQuery({
    queryKey: ['terms-active'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fn_terms_get_active');
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

export const useTermsVersions = (limit = 10, offset = 0) => {
  return useQuery({
    queryKey: ['terms-versions', limit, offset],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fn_terms_list_versions', {
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
