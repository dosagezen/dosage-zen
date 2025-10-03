import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type NotificationType = 'medicacao' | 'consulta' | 'exame' | 'atividade';

interface NotificationSchedule {
  id: string;
  profile_id: string;
  notification_type: NotificationType;
  entity_id: string;
  scheduled_for: string;
  title: string;
  body: string;
  data?: any;
  sent_at?: string;
  is_cancelled: boolean;
}

interface NotificationPreferences {
  id?: string;
  profile_id: string;
  enabled: boolean;
  medicacao_enabled: boolean;
  consulta_enabled: boolean;
  exame_enabled: boolean;
  atividade_enabled: boolean;
  medicacao_advance_minutes: number;
  consulta_advance_hours: number;
  exame_advance_hours: number;
  atividade_advance_hours: number;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export const useNotificationSchedule = (profileId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notification preferences
  const { data: preferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['notification-preferences', profileId],
    queryFn: async () => {
      if (!profileId) return null;
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) throw error;
      return data as NotificationPreferences | null;
    },
    enabled: !!profileId
  });

  // Fetch scheduled notifications
  const { data: scheduledNotifications, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['notification-schedule', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      
      const { data, error } = await supabase
        .from('notification_schedule')
        .select('*')
        .eq('profile_id', profileId)
        .is('sent_at', null)
        .eq('is_cancelled', false)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      return data as NotificationSchedule[];
    },
    enabled: !!profileId
  });

  // Save/Update preferences
  const savePreferencesMutation = useMutation({
    mutationFn: async (prefs: Partial<NotificationPreferences>) => {
      if (!profileId) throw new Error('Profile ID required');

      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          profile_id: profileId,
          ...prefs
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', profileId] });
      toast({
        title: 'Preferências salvas',
        description: 'Suas configurações de notificação foram atualizadas'
      });
    },
    onError: (error) => {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar suas preferências',
        variant: 'destructive'
      });
    }
  });

  // Cancel a scheduled notification
  const cancelNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notification_schedule')
        .update({ is_cancelled: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-schedule', profileId] });
      toast({
        title: 'Notificação cancelada',
        description: 'A notificação foi removida da programação'
      });
    }
  });

  return {
    preferences,
    isLoadingPreferences,
    scheduledNotifications,
    isLoadingSchedule,
    savePreferences: savePreferencesMutation.mutate,
    isSavingPreferences: savePreferencesMutation.isPending,
    cancelNotification: cancelNotificationMutation.mutate,
    isCancellingNotification: cancelNotificationMutation.isPending
  };
};
