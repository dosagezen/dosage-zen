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

  // Get today's date for filtering (always in user's timezone)
  const today = useMemo(() => {
    const now = new Date();
    // Create a date object at midnight today (start of day)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return todayStart;
  }, []);

  // Convert medications to compromisso items
  const medicationItems = useMemo((): CompromissoItem[] => {
    if (!medications || medications.length === 0) return [];

    const items: CompromissoItem[] = [];
    
    medications.forEach(medication => {
      if (!medication.ativo) return;
      
      // Verificar se tem horários válidos
      if (!Array.isArray(medication.horarios) || medication.horarios.length === 0) return;
      
      // Verificar se está dentro do período de validade
      const startDate = medication.data_inicio ? new Date(medication.data_inicio) : null;
      const endDate = medication.data_fim ? new Date(medication.data_fim) : null;
      
      if (startDate && startDate > today) return;
      if (endDate && endDate < today) return;
      
      // Processar apenas horários válidos e pendentes
      medication.horarios.forEach((horario, index) => {
        const timeStr = typeof horario === 'string' ? horario : horario.hora;
        const status = typeof horario === 'object' && horario.status ? horario.status : 'pendente';
        
        // Só incluir se for um horário válido e ainda pendente
        if (timeStr && timeStr !== '-' && status === 'pendente') {
          items.push({
            id: `${medication.id}-${index}`,
            type: 'medicacao',
            title: medication.nome,
            subtitle: `${medication.dosagem} • ${medication.forma}`,
            time: timeStr,
            status: status, // Use actual status instead of always 'pendente'
            originalData: { medication }
          });
        }
      });
    });

    return items;
  }, [medications, today]);

  // Convert appointments to compromisso items
  const appointmentItems = useMemo((): CompromissoItem[] => {
    if (!appointments || appointments.length === 0) return [];

    // Get today's date in local timezone (YYYY-MM-DD)
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    return appointments
      .filter(appointment => {
        // Get appointment date in local timezone
        const appointmentDate = new Date(appointment.data_agendamento);
        const aptYear = appointmentDate.getFullYear();
        const aptMonth = appointmentDate.getMonth();
        const aptDate = appointmentDate.getDate();
        
        // Compare only dates in local timezone (ignore time)
        const isSameDay = aptYear === todayYear && aptMonth === todayMonth && aptDate === todayDate;
        
        // Filtrar apenas compromissos pendentes (não finalizados)
        const status = appointment.status || 'agendado';
        const isPending = !['realizado', 'concluido', 'cancelado'].includes(status);
        
        return isSameDay && isPending;
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
        status: 'pendente',
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
    const restantes = Math.max(0, total - concluidos);

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