import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeleteUserResponse {
  success: boolean;
  message: string;
  deleted?: {
    user_id: string;
    profile_id: string;
    email: string;
    tables_affected: string[];
  };
  error?: string;
}

export const useDeleteUser = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const deleteUserByEmail = async (userEmail: string): Promise<boolean> => {
    setIsDeleting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke<DeleteUserResponse>(
        'admin-delete-user',
        {
          body: { userEmail }
        }
      );

      if (error) {
        console.error('Error deleting user:', error);
        toast({
          title: "Erro",
          description: error.message || "Falha ao remover usuário",
          variant: "destructive",
        });
        return false;
      }

      if (!data?.success) {
        toast({
          title: "Erro",
          description: data?.error || "Falha ao remover usuário",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: data.message || "Usuário removido com sucesso",
      });

      console.log('User deletion report:', data.deleted);
      return true;
    } catch (error: any) {
      console.error('Unexpected error deleting user:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro inesperado ao remover usuário",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteUserByEmail,
    isDeleting
  };
};
