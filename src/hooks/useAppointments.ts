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
}

export const useAppointments = (tipo?: 'consulta' | 'exame' | 'atividade') => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchAppointments = async (): Promise<Appointment[]> => {
    const { data, error } = await supabase.functions.invoke('manage-appointments', {
      body: { action: 'list', tipo }
    });

    if (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }

    return data.appointments || [];
  };

  const query = useQuery({
    queryKey: ['appointments', tipo],
    queryFn: fetchAppointments,
  });

  const createMutation = useMutation({
    mutationFn: async (appointmentData: CreateAppointmentData) => {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: { action: 'create', ...appointmentData },
      });

      if (error) {
        console.error('Error creating appointment:', error);
        throw error;
      }

      return data.appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Sucesso',
        description: 'Compromisso criado com sucesso!',
      });
    },
    onError: (error: any) => {
      console.error('Error creating appointment:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar compromisso.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...appointmentData }: Partial<Appointment> & { id: string }) => {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: { action: 'update', id, ...appointmentData },
      });

      if (error) {
        console.error('Error updating appointment:', error);
        throw error;
      }

      return data.appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Sucesso',
        description: 'Compromisso atualizado com sucesso!',
      });
    },
    onError: (error: any) => {
      console.error('Error updating appointment:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar compromisso.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: { action: 'delete', id },
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

  return {
    appointments: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createAppointment: createMutation.mutate,
    updateAppointment: updateMutation.mutate,
    deleteAppointment: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};