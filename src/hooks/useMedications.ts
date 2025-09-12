import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HorarioStatus {
  hora: string;
  status: 'pendente' | 'concluido' | 'excluido';
  occurrence_id?: string;
  scheduled_at?: string;
  completed_at?: string;
}

export interface Medication {
  id: string;
  patient_profile_id: string;
  nome: string;
  dosagem: string;
  forma: string;
  frequencia: string;
  horarios: HorarioStatus[];
  estoque: number;
  data_inicio?: string;
  data_fim?: string;
  ativo: boolean;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  proxima?: string;
}

export interface CreateMedicationData {
  nome: string;
  dosagem: string;
  forma: string;
  frequencia: string;
  horarios?: string[];
  estoque?: number;
  data_inicio?: string;
  data_fim?: string;
  observacoes?: string;
}

export const useMedications = (callbacks?: {
  onCreateSuccess?: () => void;
  onUpdateSuccess?: () => void;
  onDeleteSuccess?: () => void;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchMedications = async (): Promise<Medication[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('manage-medications', {
      body: { action: 'list' }
    });

    if (error) {
      console.error('Error fetching medications:', error);
      throw error;
    }

    return data.medications || [];
  };

  const query = useQuery({
    queryKey: ['medications'],
    queryFn: fetchMedications,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async (medicationData: CreateMedicationData) => {
      const { data, error } = await supabase.functions.invoke('manage-medications', {
        body: { action: 'create', ...medicationData },
      });

      if (error) {
        console.error('Error creating medication:', error);
        throw error;
      }

      return data.medication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      toast({
        title: 'Sucesso',
        description: 'Medicação criada com sucesso!',
      });
      callbacks?.onCreateSuccess?.();
    },
    onError: (error: any) => {
      console.error('Error creating medication:', error);
      toast({
        title: 'Erro',
        description: `Falha ao criar medicação: ${error?.message || 'Erro desconhecido'}`,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...medicationData }: Partial<Medication> & { id: string }) => {
      const { data, error } = await supabase.functions.invoke('manage-medications', {
        body: { action: 'update', id, ...medicationData },
      });

      if (error) {
        console.error('Error updating medication:', error);
        throw error;
      }

      return data.medication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      toast({
        title: 'Sucesso',
        description: 'Medicação atualizada com sucesso!',
      });
      callbacks?.onUpdateSuccess?.();
    },
    onError: (error: any) => {
      console.error('Error updating medication:', error);
      toast({
        title: 'Erro',
        description: `Falha ao atualizar medicação: ${error?.message || 'Erro desconhecido'}`,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('manage-medications', {
        body: { action: 'delete', id },
      });

      if (error) {
        console.error('Error deleting medication:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      toast({
        title: 'Sucesso',
        description: 'Medicação removida com sucesso!',
      });
      callbacks?.onDeleteSuccess?.();
    },
    onError: (error: any) => {
      console.error('Error deleting medication:', error);
      toast({
        title: 'Erro',
        description: `Falha ao remover medicação: ${error?.message || 'Erro desconhecido'}`,
        variant: 'destructive',
      });
    },
  });

  const markOccurrenceMutation = useMutation({
    mutationFn: async ({ occurrence_id, status }: { occurrence_id: string, status: 'pendente' | 'concluido' | 'excluido' }) => {
      console.log('Marking occurrence:', occurrence_id, 'as', status);
      
      const { data, error } = await supabase.functions.invoke('manage-medications', {
        body: {
          action: 'mark_occurrence',
          occurrence_id,
          status
        }
      });

      if (error) {
        console.error('Error marking occurrence:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      toast({
        title: 'Sucesso',
        description: 'Status da medicação atualizado.',
      });
    },
    onError: (error: any) => {
      console.error('Error marking occurrence:', error);
      toast({
        title: 'Erro',
        description: `Falha ao atualizar status: ${error?.message || 'Erro desconhecido'}`,
        variant: 'destructive',
      });
    },
  });

  return {
    medications: Array.isArray(query.data) ? query.data : [],
    isLoading: query.isLoading || query.isFetching,
    isSuccess: query.isSuccess,
    error: query.error,
    createMedication: createMutation.mutate,
    updateMedication: updateMutation.mutate,
    deleteMedication: deleteMutation.mutate,
    markOccurrence: markOccurrenceMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMarkingOccurrence: markOccurrenceMutation.isPending,
  };
};