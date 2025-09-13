import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HorarioStatus {
  hora: string;
  status: 'pendente' | 'concluido' | 'excluido';
  occurrence_id?: string;
  scheduled_at?: string;
  completed_at?: string;
  onTime?: boolean;
}

interface UndoContext {
  medicationId: string;
  occurrenceId: string;
  previousStatus: 'pendente' | 'concluido' | 'excluido';
  timestamp: number;
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
  occurrencesToday?: Array<{
    id: string;
    time: string;
    status: 'pendente' | 'concluido' | 'excluido';
    scheduledAtLocal?: string;
  }>;
  isOptimistic?: boolean; // Flag for optimistic updates
  has_today?: boolean;
  has_pending_today?: boolean;
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

  // Helper function to compute daily times based on frequency (for optimistic updates)
  const computeDailyTimes = (startTime: string, frequency: string): string[] => {
    const times = [startTime];
    
    // Parse frequency to get hours interval
    const freqMatch = frequency.match(/(\d+)h/i);
    if (!freqMatch) return times;
    
    const intervalHours = parseInt(freqMatch[1]);
    if (intervalHours <= 0 || intervalHours >= 24) return times;
    
    // Calculate how many doses fit in 24 hours
    const dosesPerDay = Math.floor(24 / intervalHours);
    
    // Parse start time
    const [startHour, startMinute] = startTime.split(':').map(Number);
    if (isNaN(startHour) || isNaN(startMinute)) return times;
    
    // Generate additional times
    for (let i = 1; i < dosesPerDay; i++) {
      const totalMinutes = (startHour * 60 + startMinute) + (i * intervalHours * 60);
      const newHour = Math.floor(totalMinutes / 60) % 24;
      const newMinute = totalMinutes % 60;
      
      const timeStr = `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
      times.push(timeStr);
    }
    
    return times.sort();
  };

  const fetchMedications = async (): Promise<Medication[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('manage-medications', {
      body: { action: 'list', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo' }
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
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    gcTime: 300_000, // 5 minutes
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

      // Expand horarios based on frequency for optimistic update
      let expandedHorarios = newMedication.horarios || [];
      if (newMedication.horarios && newMedication.horarios.length === 1 && newMedication.frequencia) {
        expandedHorarios = computeDailyTimes(newMedication.horarios[0], newMedication.frequencia);
      }

      // Create optimistic medication with proper structure
      const optimisticMedication: Medication = {
        id: `temp-${Date.now()}`, // Temporary ID
        patient_profile_id: '',
        nome: newMedication.nome,
        dosagem: newMedication.dosagem,
        forma: newMedication.forma,
        frequencia: newMedication.frequencia,
        horarios: expandedHorarios.map(hora => ({
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
        proxima: expandedHorarios[0] || null,
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

  // Mark oldest pending occurrence - with optimistic update aligned to UI logic
  const markNearestOccurrenceMutation = useMutation({
    mutationFn: async ({ medicationId, action }: { medicationId: string; action: 'concluir' | 'cancelar' }) => {
      const currentTime = new Date().toISOString();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
      
      console.log('Mobile check - mark_oldest request:', {
        medication_id: medicationId,
        action,
        currentTime,
        timezone
      });

      const { data, error } = await supabase.functions.invoke('manage-medications', {
        body: {
          action: 'mark_oldest',
          id: medicationId,
          nearestAction: action,
          currentTime,
          timezone
        }
      });

      if (error) {
        console.error('Edge Function HTTP error:', {
          status: error.status,
          message: error.message,
          details: error
        });
        throw new Error(`Falha na comunicação: ${error.message || 'Erro de rede'}`);
      }

      console.log('mark_oldest response:', data);
      
      // Standardized response checking - Edge Function now returns { success: boolean }
      if (!data?.success) {
        if (data?.code === 'no_pending') {
          throw new Error('NO_PENDING_OCCURRENCE');
        }
        throw new Error(data?.message || 'Falha ao marcar medicação');
      }

      return data;
    },
    onMutate: async ({ medicationId, action }) => {
      // Cancel refetches so we don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['medications'] });
      const previous = queryClient.getQueryData<Medication[]>(['medications']);

      const newStatus = action === 'concluir' ? 'concluido' : 'excluido' as const;
      const now = new Date();

      const getOldestPendingIndex = (horarios: any[]): number => {
        const pendentes = (horarios || []).map((h: any, i: number) => ({...h, _idx: i}))
          .filter((h: any) => h.status === 'pendente' && h.hora && h.hora !== '-');
        if (pendentes.length === 0) return -1;
        
        // Sort by time (ascending) to get the oldest first
        const sortedByTime = pendentes.sort((a: any, b: any) => {
          const [ah, am] = a.hora.split(':').map(Number); 
          const [bh, bm] = b.hora.split(':').map(Number);
          return (ah*60+am) - (bh*60+bm);
        });
        
        // Return the index of the oldest pending time
        return sortedByTime[0]._idx;
      };

      // Apply optimistic update on the specific medication and its nearest time
      queryClient.setQueryData<Medication[]>(['medications'], (old) => {
        if (!old) return old;
        return old.map(med => {
          if (med.id !== medicationId) return med;
          const horarios = Array.isArray(med.horarios) ? [...med.horarios] : [];
          const idx = getOldestPendingIndex(horarios);
          if (idx >= 0) {
            horarios[idx] = { ...horarios[idx], status: newStatus } as any;
          }
          return { ...med, horarios } as Medication;
        });
      });

      return { previous };
    },
    onSuccess: (data, { medicationId, action }) => {
      // Store undo context
      const undoContext: UndoContext = {
        medicationId,
        occurrenceId: (data as any).occ_id,
        previousStatus: 'pendente',
        timestamp: Date.now()
      };

      // Update the local cache optimistically with exact time match
      queryClient.setQueryData<Medication[]>(['medications'], (oldData) => {
        if (!oldData) return oldData;
        
        return oldData.map(medication => {
          if (medication.id === medicationId) {
            let matched = false;
            let updatedHorarios = (medication.horarios || []).map(horario => {
              // Try exact occurrence_id match first
              if (horario.occurrence_id === (data as any).occ_id) {
                matched = true;
                return {
                  ...horario,
                  status: (data as any).new_status as 'concluido' | 'excluido',
                  onTime: ((data as any).new_status === 'concluido') && Math.abs(((data as any).delta_minutes ?? 9999)) <= 5
                };
              }
              
              // If no occurrence_id match, fallback to oldest pending time logic
              if (!matched && horario.status === 'pendente' && horario.hora && horario.hora !== '-') {
                // Find if this is the oldest pending time among all pending times
                const allPendingTimes = (medication.horarios || [])
                  .filter(h => h.status === 'pendente' && h.hora && h.hora !== '-')
                  .map(h => h.hora)
                  .sort();
                
                if (allPendingTimes[0] === horario.hora) {
                  matched = true;
                  return {
                    ...horario,
                    status: (data as any).new_status as 'concluido' | 'excluido',
                    onTime: ((data as any).new_status === 'concluido') && Math.abs(((data as any).delta_minutes ?? 9999)) <= 5
                  };
                }
              }
              
              return horario;
            });

            // Final fallback: if no match found, update the true "horário da vez" based on local time
            if (!matched) {
              const now = new Date();
              const pendentes = updatedHorarios.map((h, i) => ({...h, _idx: i}))
                .filter((h: any) => h.status === 'pendente' && h.hora && h.hora !== '-');
              if (pendentes.length > 0) {
                const cur = now.getHours() * 60 + now.getMinutes();
                const future = pendentes.filter((h: any) => {
                  const [hh, mm] = h.hora.split(':').map(Number);
                  return (hh*60 + mm) >= cur;
                }).sort((a: any, b: any) => {
                  const [ah, am] = a.hora.split(':').map(Number); const [bh, bm] = b.hora.split(':').map(Number);
                  return (ah*60+am) - (bh*60+bm);
                });
                const chosen = future[0] ?? pendentes.sort((a: any, b: any) => {
                  const [ah, am] = a.hora.split(':').map(Number); const [bh, bm] = b.hora.split(':').map(Number);
                  return (bh*60+bm) - (ah*60+am);
                })[0];
                const idx = chosen?._idx ?? -1;
                if (idx >= 0) {
                  updatedHorarios = updatedHorarios.map((h, i) => i === idx ? {
                    ...h,
                    status: (data as any).new_status as 'concluido' | 'excluido',
                    onTime: ((data as any).new_status === 'concluido') && Math.abs(((data as any).delta_minutes ?? 9999)) <= 5
                  } : h);
                }
              }
            }
            
            const updatedOccsToday = Array.isArray(medication.occurrencesToday)
              ? medication.occurrencesToday.map(occ =>
                  occ.id === (data as any).occ_id
                    ? { ...occ, status: (data as any).new_status as 'concluido' | 'excluido' }
                    : occ
                )
              : medication.occurrencesToday;
            return {
              ...medication,
              horarios: updatedHorarios,
              occurrencesToday: updatedOccsToday as any,
              allDoneToday: (data as any).all_done_today
            };
          }
          return medication;
        });
      });

      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      
      const actionText = action === 'concluir' ? 'Medicação concluída' : 'Medicação cancelada';
      toast({
        title: actionText,
        description: "Ação realizada com sucesso. Toque em Desfazer nos próximos segundos para reverter.",
      });
    },
    onError: (error: any, variables, context) => {
      console.error('markNearestOccurrence FAILED:', {
        error: error.message,
        medicationId: variables.medicationId,
        action: variables.action,
        fullError: error
      });
      // Rollback optimistic update
      if (context?.previous) {
        queryClient.setQueryData(['medications'], context.previous);
      }
      // Simplified error handling
      if (error.message === 'NO_PENDING_OCCURRENCE') {
        toast({
          title: "Nenhuma dose pendente",
          description: "Não há doses pendentes para hoje. Use o botão de reabrir para restaurar.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: `Não foi possível atualizar: ${error.message || 'Erro desconhecido'}`,
          variant: "destructive",
        });
      }
    }
  });

  // Undo functionality
  const undoMutation = useMutation({
    mutationFn: async (undoContext: UndoContext) => {
      console.log('Undo: calling manage-medications with undo action:', undoContext.occurrenceId);

      const { data, error } = await supabase.functions.invoke('manage-medications', {
        body: {
          action: 'undo_occurrence',
          occurrence_id: undoContext.occurrenceId
        }
      });

      if (error) {
        console.error('Error undoing occurrence:', error);
        throw error;
      }

      if (!data?.success && !data?.ok) {
        throw new Error(data?.message || 'Failed to undo occurrence');
      }

      return data;
    },
    onSuccess: (data, undoContext) => {
      // Update the local cache to restore pending status
      queryClient.setQueryData<Medication[]>(['medications'], (oldData) => {
        if (!oldData) return oldData;
        
        return oldData.map(medication => {
          if (medication.id === undoContext.medicationId) {
            const updatedHorarios = medication.horarios?.map(horario => {
              if (horario.occurrence_id === undoContext.occurrenceId) {
                return {
                  ...horario,
                  status: 'pendente' as const
                };
              }
              return horario;
            }) || [];
            
            const updatedOccsToday = Array.isArray(medication.occurrencesToday)
              ? medication.occurrencesToday.map(occ =>
                  occ.id === undoContext.occurrenceId ? { ...occ, status: 'pendente' as const } : occ
                )
              : medication.occurrencesToday;
            return {
              ...medication,
              horarios: updatedHorarios,
              occurrencesToday: updatedOccsToday as any,
              allDoneToday: false // Restore to active list
            };
          }
          return medication;
        });
      });

      queryClient.invalidateQueries({ queryKey: ['medications'] });
      
      toast({
        title: "Ação desfeita",
        description: "A medicação foi restaurada para pendente.",
      });
    },
    onError: (error) => {
      console.error('Error undoing occurrence:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desfazer a ação.",
        variant: "destructive",
      });
    }
  });

  // Restore card functionality
  const restoreCardMutation = useMutation({
    mutationFn: async (medicationId: string) => {
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      console.log('Restore: calling manage-medications with restore action:', medicationId);

      const { data, error } = await supabase.functions.invoke('manage-medications', {
        body: {
          action: 'restore_card',
          medication_id: medicationId,
          day_local: today,
          timezone
        }
      });

      if (error) {
        console.error('Error restoring card:', error);
        throw error;
      }

      return { restoredCount: data?.restored_count || 0 };
    },
    onSuccess: (data, medicationId) => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      
      toast({
        title: "Card restaurado",
        description: `${data.restoredCount} horário(s) foram reabertos para hoje.`,
      });
    },
    onError: (error: any) => {
      console.error('Error restoring card:', {
        message: error.message,
        details: error.details || error
      });
      toast({
        title: "Erro",
        description: `Não foi possível restaurar: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
    }
  });

  return {
    medications: Array.isArray(query.data) ? query.data : [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    error: query.error,
    refetchMedications: query.refetch,
    createMedication: createMutation.mutate,
    updateMedication: updateMutation.mutate,
    deleteMedication: deleteMutation.mutate,
    markOccurrence: markOccurrenceMutation.mutate,
    markNearestOccurrence: markNearestOccurrenceMutation.mutate,
    restoreCard: restoreCardMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMarkingOccurrence: markOccurrenceMutation.isPending,
    isMarkingNearest: markNearestOccurrenceMutation.isPending,
    isRestoringCard: restoreCardMutation.isPending,
  };
};