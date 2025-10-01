import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Collaborator {
  id: string;
  nome: string;
  sobrenome: string;
  role: string;
}

export const useCollaboratorsList = () => {
  const { profile } = useAuth();

  const { data: collaborators, isLoading, error } = useQuery({
    queryKey: ['collaborators-list', profile?.id],
    queryFn: async () => {
      if (!profile?.id) {
        return [];
      }

      // Get active collaborations where current user is the patient
      const { data: collaborations, error: collabError } = await supabase
        .from('collaborations')
        .select(`
          collaborator_profile_id,
          collaborator_role,
          profiles:collaborator_profile_id (
            id,
            nome,
            sobrenome
          )
        `)
        .eq('patient_profile_id', profile.id)
        .eq('is_active', true);

      if (collabError) {
        console.error('Error fetching collaborators:', collabError);
        throw collabError;
      }

      const collaboratorsList: Collaborator[] = collaborations?.map((collab: any) => ({
        id: collab.profiles.id,
        nome: collab.profiles.nome,
        sobrenome: collab.profiles.sobrenome,
        role: collab.collaborator_role
      })) || [];

      return collaboratorsList;
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    collaborators: collaborators || [],
    isLoading,
    error
  };
};
