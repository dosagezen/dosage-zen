import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Appointment {
  id: string;
  patient_profile_id: string;
  tipo: 'consulta' | 'exame' | 'atividade';
  titulo: string;
  especialidade?: string;
  medico_profissional?: string;
  local_endereco?: string;
  data_agendamento: string;
  duracao_minutos: number;
  status: 'agendado' | 'realizado' | 'cancelado';
  observacoes?: string;
  resultado?: string;
  created_at: string;
  updated_at: string;
  // Activity specific
  dias_semana?: number[];
  repeticao?: 'none' | 'weekly';
}

export interface CreateAppointmentData {
  tipo?: 'consulta' | 'exame' | 'atividade';
  titulo: string;
  especialidade?: string;
  medico_profissional?: string;
  local_endereco?: string;
  data_agendamento: string;
  duracao_minutos?: number;
  observacoes?: string;
  // Activity specific
  dias_semana?: number[];
  repeticao?: 'none' | 'weekly';
}

export interface DayCounts {
  [date: string]: {
    consultas: number;
    exames: number;
    atividades: number;
  };
}

export const useAppointments = (tipo?: 'consulta' | 'exame' | 'atividade', context_id?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchAppointments = async (): Promise<Appointment[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('manage-agenda', {
      body: { action: 'list', category: tipo, context_id }
    });

    if (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }

    return data.appointments || [];
  };

  const fetchDayCounts = async (month_start: string, month_end: string): Promise<DayCounts> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('manage-agenda', {
      body: { action: 'day_counts', month_start, month_end, context_id }
    });

    if (error) {
      console.error('Error fetching day counts:', error);
      throw error;
    }

    return data.counts || {};
  };

  const query = useQuery({
    queryKey: ['appointments', tipo, context_id],
    queryFn: fetchAppointments,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    staleTime: 60_000, // 1 minute
    gcTime: 300_000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: async (appointmentData: CreateAppointmentData) => {
      // Validação básica
      if (!appointmentData.titulo?.trim()) {
        throw new Error('Título é obrigatório');
      }
      if (!appointmentData.data_agendamento) {
        throw new Error('Data de agendamento é obrigatória');
      }

      try {
        const { data, error } = await supabase.functions.invoke('manage-agenda', {
          body: { 
            action: 'create', 
            context_id: context_id || undefined,
            ...appointmentData 
          },
        });

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(error.message || 'Erro na criação do compromisso');
        }

        if (!data?.appointment) {
          throw new Error('Resposta inválida do servidor');
        }

        return data.appointment;
      } catch (error) {
        console.error('Create mutation error:', error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Sucesso',
        description: 'Compromisso criado com sucesso!',
      });
    },
    onError: (error: any) => {
      console.error('Error creating appointment:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Falha ao criar compromisso. Tente novamente.';
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...appointmentData }: Partial<Appointment> & { id: string }) => {
      // Validação básica
      if (!id) {
        throw new Error('ID do compromisso é obrigatório');
      }

      try {
        const { data, error } = await supabase.functions.invoke('manage-agenda', {
          body: { 
            action: 'update', 
            id: id.trim(), 
            context_id: context_id || undefined,
            ...appointmentData 
          },
        });

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(error.message || 'Erro na atualização do compromisso');
        }

        if (!data?.appointment) {
          throw new Error('Resposta inválida do servidor');
        }

        return data.appointment;
      } catch (error) {
        console.error('Update mutation error:', error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Sucesso',
        description: 'Compromisso atualizado com sucesso!',
      });
    },
    onError: (error: any) => {
      console.error('Error updating appointment:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Falha ao atualizar compromisso. Tente novamente.';
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('manage-agenda', {
        body: { action: 'delete', id, context_id },
      });

      if (error) {
        console.error('Error deleting appointment:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Sucesso',
        description: 'Compromisso removido com sucesso!',
      });
    },
    onError: (error: any) => {
      console.error('Error deleting appointment:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover compromisso.',
        variant: 'destructive',
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('manage-agenda', {
        body: { action: 'complete', id, context_id },
      });

      if (error) {
        console.error('Error completing appointment:', error);
        throw error;
      }

      return data.appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Sucesso',
        description: 'Compromisso concluído!',
      });
    },
    onError: (error: any) => {
      console.error('Error completing appointment:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao concluir compromisso.',
        variant: 'destructive',
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('manage-agenda', {
        body: { action: 'restore', id, context_id },
      });

      if (error) {
        console.error('Error restoring appointment:', error);
        throw error;
      }

      return data.appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Sucesso',
        description: 'Compromisso restaurado!',
      });
    },
    onError: (error: any) => {
      console.error('Error restoring appointment:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao restaurar compromisso.',
        variant: 'destructive',
      });
    },
  });

  return {
    appointments: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetchAppointments: query.refetch,
    createAppointment: createMutation.mutate,
    updateAppointment: updateMutation.mutate,
    deleteAppointment: deleteMutation.mutate,
    completeAppointment: completeMutation.mutate,
    restoreAppointment: restoreMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isCompleting: completeMutation.isPending,
    isRestoring: restoreMutation.isPending,
    fetchDayCounts,
  };
};