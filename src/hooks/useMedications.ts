import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Medication {
  id: string;
  patient_profile_id: string;
  nome: string;
  dosagem: string;
  forma: string;
  frequencia: string;
  horarios: string[];
  estoque: number;
  data_inicio?: string;
  data_fim?: string;
  ativo: boolean;
  observacoes?: string;
  created_at: string;
  updated_at: string;
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

export const useMedications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchMedications = async (): Promise<Medication[]> => {
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
    },
    onError: (error: any) => {
      console.error('Error creating medication:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar medicação.',
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
    },
    onError: (error: any) => {
      console.error('Error updating medication:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar medicação.',
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
    },
    onError: (error: any) => {
      console.error('Error deleting medication:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover medicação.',
        variant: 'destructive',
      });
    },
  });

  return {
    medications: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createMedication: createMutation.mutate,
    updateMedication: updateMutation.mutate,
    deleteMedication: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};