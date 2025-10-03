import { supabase } from '@/integrations/supabase/client';
import { subMinutes, subHours } from 'date-fns';

export type NotificationType = 'medicacao' | 'consulta' | 'exame' | 'atividade';

interface ScheduleNotificationParams {
  profileId: string;
  type: NotificationType;
  entityId: string;
  scheduledFor: Date;
  title: string;
  body: string;
  data?: any;
}

/**
 * Schedule a notification to be sent at a specific time
 */
export async function scheduleNotification(params: ScheduleNotificationParams): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('schedule-notifications', {
      body: {
        action: 'schedule',
        data: {
          profile_id: params.profileId,
          notification_type: params.type,
          entity_id: params.entityId,
          scheduled_for: params.scheduledFor.toISOString(),
          title: params.title,
          body: params.body,
          data: params.data || {},
        },
      },
    });

    if (error) {
      console.error('Error scheduling notification:', error);
      return false;
    }

    console.log('Notification scheduled:', data);
    return data?.scheduled || false;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return false;
  }
}

/**
 * Cancel all notifications for a specific entity
 */
export async function cancelNotifications(entityId: string, type: NotificationType): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('schedule-notifications', {
      body: {
        action: 'cancel',
        data: {
          entity_id: entityId,
          notification_type: type,
        },
      },
    });

    if (error) {
      console.error('Error cancelling notifications:', error);
      return false;
    }

    console.log('Notifications cancelled:', data);
    return data?.cancelled || false;
  } catch (error) {
    console.error('Failed to cancel notifications:', error);
    return false;
  }
}

/**
 * Schedule medication reminder (default: 5 minutes before)
 */
export async function scheduleMedicationReminder(
  profileId: string,
  medicationId: string,
  medicationName: string,
  scheduledTime: Date,
  advanceMinutes: number = 5
): Promise<boolean> {
  const notificationTime = subMinutes(scheduledTime, advanceMinutes);
  
  return scheduleNotification({
    profileId,
    type: 'medicacao',
    entityId: medicationId,
    scheduledFor: notificationTime,
    title: 'Hora do Remédio! 💊',
    body: `${medicationName} - ${scheduledTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    data: {
      medication_id: medicationId,
      medication_name: medicationName,
      url: `/medicacoes?edit=${medicationId}`,
    },
  });
}

/**
 * Schedule appointment reminder (default: 24h and 1h before)
 */
export async function scheduleAppointmentReminders(
  profileId: string,
  appointmentId: string,
  appointmentTitle: string,
  appointmentTime: Date,
  advanceHours: number[] = [24, 1]
): Promise<boolean> {
  const promises = advanceHours.map((hours) => {
    const notificationTime = subHours(appointmentTime, hours);
    const title = hours >= 24 ? 'Lembrete de Consulta 📅' : 'Consulta em breve! 🏥';
    const body = hours >= 24 
      ? `Amanhã: ${appointmentTitle}` 
      : `Em ${hours}h: ${appointmentTitle}`;

    return scheduleNotification({
      profileId,
      type: 'consulta',
      entityId: appointmentId,
      scheduledFor: notificationTime,
      title,
      body,
      data: {
        appointment_id: appointmentId,
        appointment_title: appointmentTitle,
        url: `/agenda`,
      },
    });
  });

  const results = await Promise.all(promises);
  return results.every((r) => r);
}

/**
 * Schedule exam reminder (default: 24h and 2h before)
 */
export async function scheduleExamReminders(
  profileId: string,
  examId: string,
  examTitle: string,
  examTime: Date,
  advanceHours: number[] = [24, 2]
): Promise<boolean> {
  const promises = advanceHours.map((hours) => {
    const notificationTime = subHours(examTime, hours);
    const title = hours >= 24 ? 'Lembrete de Exame 🩺' : 'Exame em breve! 📋';
    const body = hours >= 24 
      ? `Amanhã: ${examTitle}` 
      : `Em ${hours}h: ${examTitle}`;

    return scheduleNotification({
      profileId,
      type: 'exame',
      entityId: examId,
      scheduledFor: notificationTime,
      title,
      body,
      data: {
        exam_id: examId,
        exam_title: examTitle,
        url: `/agenda`,
      },
    });
  });

  const results = await Promise.all(promises);
  return results.every((r) => r);
}

/**
 * Schedule activity reminder (default: 1h before)
 */
export async function scheduleActivityReminder(
  profileId: string,
  activityId: string,
  activityTitle: string,
  activityTime: Date,
  advanceHours: number = 1
): Promise<boolean> {
  const notificationTime = subHours(activityTime, advanceHours);

  return scheduleNotification({
    profileId,
    type: 'atividade',
    entityId: activityId,
    scheduledFor: notificationTime,
    title: 'Lembrete de Atividade 🏃',
    body: `Em ${advanceHours}h: ${activityTitle}`,
    data: {
      activity_id: activityId,
      activity_title: activityTitle,
      url: `/agenda`,
    },
  });
}
