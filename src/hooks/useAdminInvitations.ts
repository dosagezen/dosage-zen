import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AdminInvitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: 'pendente' | 'aceito' | 'revogado' | 'expirado';
  invite_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface AdminInviteRequest {
  first_name: string;
  last_name: string;
  email: string;
}

export const useAdminInvitations = () => {
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadInvitations = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('admin_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading admin invitations:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao carregar convites de administrador."
        });
        return;
      }

      setInvitations((data || []) as AdminInvitation[]);
    } catch (error) {
      console.error('Error loading admin invitations:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar convites de administrador."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createInvitation = async (inviteData: AdminInviteRequest) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-invite', {
        body: inviteData
      });

      if (error) {
        console.error('Error creating invitation:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao criar convite de administrador."
        });
        return null;
      }

      if (data.error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: data.error
        });
        return null;
      }

      toast({
        title: "Sucesso",
        description: "Convite de administrador criado com sucesso!"
      });

      // Add the new invitation to the local state for immediate UI update
      if (data.invitation) {
        setInvitations(prev => [data.invitation, ...prev]);
      }

      return data.invitation;
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar convite de administrador."
      });
      return null;
    }
  };

  const resendInvitation = async (invitationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('resend-admin-invite', {
        body: { invitation_id: invitationId }
      });

      if (error) {
        console.error('Error resending invitation:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao reenviar convite."
        });
        return false;
      }

      if (data.error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: data.error
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: "Convite reenviado com sucesso!"
      });

      // Update the local state with the updated invitation
      if (data.invitation) {
        setInvitations(prev => 
          prev.map(inv => 
            inv.id === invitationId ? { ...inv, ...data.invitation } : inv
          )
        );
      }

      return true;
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao reenviar convite."
      });
      return false;
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('admin_invitations')
        .update({ status: 'revogado' })
        .eq('id', invitationId);

      if (error) {
        console.error('Error canceling invitation:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao cancelar convite."
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: "Convite cancelado com sucesso!"
      });

      // Update the local state
      setInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId ? { ...inv, status: 'revogado' as const } : inv
        )
      );

      return true;
    } catch (error) {
      console.error('Error canceling invitation:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao cancelar convite."
      });
      return false;
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  // Set up real-time subscription for admin_invitations
  useEffect(() => {
    const channel = supabase
      .channel('admin-invitations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_invitations'
        },
        (payload) => {
          console.log('Admin invitation change:', payload);
          
          if (payload.eventType === 'INSERT') {
            setInvitations(prev => [payload.new as AdminInvitation, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setInvitations(prev => 
              prev.map(inv => 
                inv.id === payload.new.id ? payload.new as AdminInvitation : inv
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setInvitations(prev => 
              prev.filter(inv => inv.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    invitations,
    isLoading,
    loadInvitations,
    createInvitation,
    resendInvitation,
    cancelInvitation
  };
};