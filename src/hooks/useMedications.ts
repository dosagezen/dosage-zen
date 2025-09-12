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
  isOptimistic?: boolean; // Flag for optimistic updates
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
    onMutate: async (newMedication) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['medications'] });

      // Snapshot the previous value
      const previousMedications = queryClient.getQueryData(['medications']);

      // Create optimistic medication with proper structure
      const optimisticMedication: Medication = {
        id: `temp-${Date.now()}`, // Temporary ID
        patient_profile_id: '',
        nome: newMedication.nome,
        dosagem: newMedication.dosagem,
        forma: newMedication.forma,
        frequencia: newMedication.frequencia,
        horarios: (newMedication.horarios || []).map(hora => ({
          hora,
          status: 'pendente' as const
        })),
        estoque: newMedication.estoque || 0,
        data_inicio: newMedication.data_inicio,
        data_fim: newMedication.data_fim,
        ativo: true,
        observacoes: newMedication.observacoes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        proxima: newMedication.horarios?.[0] || null,
        isOptimistic: true // Flag to identify optimistic updates
      };

      queryClient.setQueryData(['medications'], (old: Medication[] = []) => [
        optimisticMedication,
        ...old
      ]);

      // Return a context object with the snapshotted value
      return { previousMedications };
    },
    onSuccess: (realMedication) => {
      // Replace optimistic update with real data
      queryClient.setQueryData(['medications'], (old: Medication[] = []) => {
        const filtered = old.filter(med => !med.isOptimistic);
        return [realMedication, ...filtered];
      });
      
      // Diagnóstico com dados persistidos
      const todayOccurrences = realMedication?.horarios?.filter(h => h.status === 'pendente')?.length || 0;
      console.log('Medicação criada com dados completos:', {
        id: realMedication?.id,
        nome: realMedication?.nome,
        data_inicio: realMedication?.data_inicio,
        data_fim: realMedication?.data_fim,
        horarios: realMedication?.horarios?.length,
        todayOccurrences
      });
      
      toast({
        title: 'Sucesso',
        description: todayOccurrences > 0 
          ? `Medicação criada com ${todayOccurrences} dose(s) para hoje!` 
          : 'Medicação criada com sucesso!',
      });
      callbacks?.onCreateSuccess?.();
    },
    onError: (error: any, newMedication, context) => {
      // Rollback on error
      if (context?.previousMedications) {
        queryClient.setQueryData(['medications'], context.previousMedications);
      }
      console.error('Error creating medication:', error);
      toast({
        title: 'Erro',
        description: `Falha ao criar medicação: ${error?.message || 'Erro desconhecido'}`,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    }
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
    onMutate: async ({ id, ...medicationData }) => {
      // Optimistic update with date preservation
      await queryClient.cancelQueries({ queryKey: ['medications'] });
      
      const previousMedications = queryClient.getQueryData(['medications']);
      
      queryClient.setQueryData(['medications'], (old: Medication[] = []) => {
        return old.map(med => 
          med.id === id 
            ? { 
                ...med, 
                ...medicationData,
                data_inicio: medicationData.data_inicio || med.data_inicio,
                data_fim: medicationData.data_fim || med.data_fim,
                isOptimistic: true
              }
            : med
        );
      });
      
      return { previousMedications };
    },
    onSuccess: (data) => {
      console.log('Medicação atualizada com dados completos:', {
        id: data?.id,
        nome: data?.nome,
        data_inicio: data?.data_inicio,
        data_fim: data?.data_fim,
        horarios: data?.horarios?.length,
        proxima: data?.proxima
      });
      
      // Update the query cache with the new medication data
      if (data) {
        queryClient.setQueryData(['medications'], (old: Medication[] = []) => {
          return old.map(med => 
            med.id === data.id 
              ? { ...data, isOptimistic: false }
              : med
          );
        });
      }
      
      toast({
        title: 'Sucesso',
        description: 'Medicação atualizada com sucesso!',
      });
      callbacks?.onUpdateSuccess?.();
    },
    onError: (error: any, variables, context) => {
      if (context?.previousMedications) {
        queryClient.setQueryData(['medications'], context.previousMedications);
      }
      console.error('Error updating medication:', error);
      toast({
        title: 'Erro',
        description: `Falha ao atualizar medicação: ${error?.message || 'Erro desconhecido'}`,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      // Always refetch to ensure consistency after optimistic update
      queryClient.invalidateQueries({ queryKey: ['medications'] });
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

  const markNearestOccurrenceMutation = useMutation({
    mutationFn: async ({ medicationId, action }: { medicationId: string; action: 'concluir' | 'cancelar' }) => {
      const { data, error } = await supabase.functions.invoke('manage-medications', {
        body: {
          action: 'mark_nearest',
          id: medicationId,
          nearestAction: action,
          currentTime: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    }
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
    markNearestOccurrence: markNearestOccurrenceMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMarkingOccurrence: markOccurrenceMutation.isPending,
    isMarkingNearest: markNearestOccurrenceMutation.isPending
  };
};