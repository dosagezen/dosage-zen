import { useMemo, useEffect, useCallback } from 'react';
import { useMedications } from './useMedications';
import { useAppointments } from './useAppointments';
import { useCompromissosEvents } from '@/contexts/CompromissosEventContext';
import { useAuth } from '@/contexts/AuthContext';

export interface CompromissoItem {
  id: string;
  type: 'medicacao' | 'consulta' | 'exame' | 'atividade';
  title: string;
  subtitle?: string;
  time?: string;
  status: 'pendente' | 'concluido' | 'cancelado' | 'realizado' | 'excluido';
  originalData: any;
}

export interface CompromissosDia {
  total: number;
  concluidos: number;
  restantes: number;
  items: CompromissoItem[];
  dataLocal: string;
}

export function useCompromissosDodia(): CompromissosDia & { refetch: () => void } {
  const { profile, currentContext } = useAuth();
  const { medications, refetchMedications } = useMedications();
  const { appointments, refetchAppointments } = useAppointments(undefined, currentContext);
  const { subscribeToUpdates } = useCompromissosEvents();

  // Get user's local date
  const dataLocal = useMemo(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Date().toLocaleDateString('pt-BR', { timeZone: timezone });
  }, []);

  // Get today's date for filtering
  const today = useMemo(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    return new Date(now.toLocaleDateString('en-CA', { timeZone: timezone }));
  }, []);

  // Convert medications to compromisso items
  const medicationItems = useMemo((): CompromissoItem[] => {
    if (!medications) return [];

    const items: CompromissoItem[] = [];
    
    medications.forEach(medication => {
      if (!medication.ativo) return;
      
      // Check if medication should have doses today
      const startDate = medication.data_inicio ? new Date(medication.data_inicio) : null;
      const endDate = medication.data_fim ? new Date(medication.data_fim) : null;
      
      if (startDate && startDate > today) return;
      if (endDate && endDate < today) return;
      
      // Process each scheduled time for today
      if (Array.isArray(medication.horarios)) {
        medication.horarios.forEach((horario, index) => {
          // For medications, we'll check if there are any pending/completed occurrences today
          // Since we don't have direct access to occurrences, we'll use a simplified approach
          
          items.push({
            id: `${medication.id}-${index}`,
            type: 'medicacao',
            title: medication.nome,
            subtitle: `${medication.dosagem} • ${medication.forma}`,
            time: typeof horario === 'string' ? horario : horario.hora,
            status: 'pendente', // We'll update this based on actual data later
            originalData: { medication }
          });
        });
      }
    });

    return items;
  }, [medications, today]);

  // Convert appointments to compromisso items
  const appointmentItems = useMemo((): CompromissoItem[] => {
    if (!appointments) return [];

    return appointments
      .filter(appointment => {
        const appointmentDate = new Date(appointment.data_agendamento);
        const appointmentLocalDate = new Date(appointmentDate.toLocaleDateString('en-CA'));
        return appointmentLocalDate.getTime() === today.getTime();
      })
      .map(appointment => ({
        id: appointment.id,
        type: appointment.tipo === 'consulta' ? 'consulta' : appointment.tipo === 'exame' ? 'exame' : 'atividade',
        title: appointment.titulo,
        subtitle: appointment.especialidade || appointment.medico_profissional || appointment.local_endereco,
        time: new Date(appointment.data_agendamento).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit'
        }),
        status: appointment.status === 'agendado' ? 'pendente' : 
                appointment.status === 'realizado' ? 'concluido' : 
                appointment.status === 'cancelado' ? 'cancelado' : 'pendente',
        originalData: appointment
      }));
  }, [appointments, today]);

  // Combine all items
  const allItems = useMemo(() => {
    return [...medicationItems, ...appointmentItems].sort((a, b) => {
      if (!a.time || !b.time) return 0;
      return a.time.localeCompare(b.time);
    });
  }, [medicationItems, appointmentItems]);

  // Calculate totals
  const compromissosDia = useMemo((): CompromissosDia => {
    const total = allItems.length;
    const concluidos = allItems.filter(item => 
      ['concluido', 'realizado', 'cancelado', 'excluido'].includes(item.status)
    ).length;
    const restantes = total - concluidos;

    return {
      total,
      concluidos,
      restantes,
      items: allItems,
      dataLocal
    };
  }, [allItems, dataLocal]);

  // Refetch function
  const refetch = useCallback(() => {
    refetchMedications();
    refetchAppointments();
  }, [refetchMedications, refetchAppointments]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToUpdates((event) => {
      // Trigger refetch when items are updated
      refetch();
    });

    return unsubscribe;
  }, [subscribeToUpdates, refetch]);

  // Auto-refresh at midnight
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        refetch();
      }
    };

    const interval = setInterval(checkMidnight, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [refetch]);

  return {
    ...compromissosDia,
    refetch
  };
}