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
    const url = new URL(`https://pgbjqwdhtsinnaydijfj.supabase.co/functions/v1/manage-appointments`);
    if (tipo) {
      url.searchParams.set('tipo', tipo);
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch appointments');
    }

    const result = await response.json();
    return result.appointments || [];
  };

  const query = useQuery({
    queryKey: ['appointments', tipo],
    queryFn: fetchAppointments,
  });

  const createMutation = useMutation({
    mutationFn: async (appointmentData: CreateAppointmentData) => {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        method: 'POST',
        body: appointmentData,
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
      const url = new URL(`https://pgbjqwdhtsinnaydijfj.supabase.co/functions/v1/manage-appointments`);
      url.searchParams.set('id', id);
      
      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update appointment');
      }

      const result = await response.json();
      return result.appointment;
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
      const url = new URL(`https://pgbjqwdhtsinnaydijfj.supabase.co/functions/v1/manage-appointments`);
      url.searchParams.set('id', id);
      
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete appointment');
      }

      return await response.json();
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