import { useState, useMemo } from 'react';
import { Calendar, Search, Plus, User, Stethoscope, Heart, MapPin, Clock, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointments, type Appointment, type CreateAppointmentData } from '@/hooks/useAppointments';
import { useToast } from '@/hooks/use-toast';
import { SwipeableCard } from '@/components/SwipeableCard';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCompromissosEvents } from '@/contexts/CompromissosEventContext';

type AppointmentCategory = 'consulta' | 'exame' | 'atividade';
type AppointmentStatus = 'agendado' | 'realizado' | 'cancelado';

const categoryIcons = {
  consulta: User,
  exame: Stethoscope,
  atividade: Heart,
};

const categoryLabels = {
  consulta: 'Consulta',
  exame: 'Exame',
  atividade: 'Atividade',
};

const statusColors = {
  agendado: 'default',
  realizado: 'secondary',
  cancelado: 'destructive',
} as const;

const weekdays = [
  { value: 1, label: 'Segunda', shortLabel: 'Seg' },
  { value: 2, label: 'Terça', shortLabel: 'Ter' },
  { value: 3, label: 'Quarta', shortLabel: 'Qua' },
  { value: 4, label: 'Quinta', shortLabel: 'Qui' },
  { value: 5, label: 'Sexta', shortLabel: 'Sex' },
  { value: 6, label: 'Sábado', shortLabel: 'Sáb' },
  { value: 0, label: 'Domingo', shortLabel: 'Dom' },
];

const weekdayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export default function Agenda() {
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AppointmentCategory | 'todas'>('todas');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'todos'>('todos');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AppointmentCategory>('consulta');
  const [formData, setFormData] = useState<CreateAppointmentData>({
    tipo: 'consulta',
    titulo: '',
    data_agendamento: '',
    duracao_minutos: 60,
  });
  const [agendadosExpanded, setAgendadosExpanded] = useState(true);
  const [realizadosExpanded, setRealizadosExpanded] = useState(false);

  const { toast } = useToast();
  const { currentContext } = useAuth();
  const { onCompromissoAtualizado } = useCompromissosEvents();
  const { 
    appointments, 
    createAppointment, 
    updateAppointment, 
    deleteAppointment, 
    completeAppointment,
    restoreAppointment,
    isCreating,
    isUpdating,
    fetchDayCounts 
  } = useAppointments(undefined, currentContext);

  // Calculate day counts from appointments data
  const dayCounts = useMemo(() => {
    const counts: Record<string, { consulta: number; exame: number; atividade: number }> = {};
    appointments.forEach(apt => {
      const date = format(new Date(apt.data_agendamento), 'yyyy-MM-dd');
      if (!counts[date]) {
        counts[date] = { consulta: 0, exame: 0, atividade: 0 };
      }
      if (apt.status === 'agendado') {
        counts[date][apt.tipo]++;
      }
    });
    return counts;
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const filtered = appointments.filter(apt => {
      const matchesSearch = searchTerm === '' || 
        apt.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.especialidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.medico_profissional?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.local_endereco?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === 'todas' || apt.tipo === categoryFilter;
      const matchesStatus = statusFilter === 'todos' || apt.status === statusFilter;
      
      // Filtrar pelo mês corrente do calendário
      const appointmentDate = new Date(apt.data_agendamento);
      const matchesMonth = isSameMonth(appointmentDate, currentDate);

      return matchesSearch && matchesCategory && matchesStatus && matchesMonth;
    });

    // Ordenar por data e horário
    const sorted = filtered.sort((a, b) => {
      const dateA = new Date(a.data_agendamento).getTime();
      const dateB = new Date(b.data_agendamento).getTime();
      return dateA - dateB;
    });

    return {
      pending: sorted.filter(apt => apt.status === 'agendado'),
      completed: sorted.filter(apt => apt.status === 'realizado' || apt.status === 'cancelado')
    };
  }, [appointments, searchTerm, categoryFilter, statusFilter, currentDate]);

  // Calendar logic - start week on Monday (weekStartsOn: 1)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    setCurrentDate(newDate);
    // Preserve selection if possible, otherwise select day 1
    if (selectedDate && !isSameMonth(selectedDate, newDate)) {
      const day1 = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      setSelectedDate(day1);
    }
  };
  
  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    setCurrentDate(newDate);
    // Preserve selection if possible, otherwise select day 1
    if (selectedDate && !isSameMonth(selectedDate, newDate)) {
      const day1 = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      setSelectedDate(day1);
    }
  };

  const getDayBadges = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const counts = dayCounts[dateStr];
    if (!counts || (counts.consulta === 0 && counts.exame === 0 && counts.atividade === 0)) return null;

    const isOutsideMonth = !isSameMonth(date, currentDate);

    return (
      <div className={`flex items-center justify-center gap-1 flex-wrap mt-1 ${isOutsideMonth ? 'opacity-60' : ''}`}>
        {counts.consulta > 0 && (
          <div className="flex items-center gap-0.5 text-xs">
            <User className="w-3 h-3 text-blue-600" />
            <span className="text-blue-600 font-medium">
              {counts.consulta > 9 ? '9+' : counts.consulta}
            </span>
          </div>
        )}
        {counts.exame > 0 && (
          <div className="flex items-center gap-0.5 text-xs">
            <Stethoscope className="w-3 h-3 text-green-600" />
            <span className="text-green-600 font-medium">
              {counts.exame > 9 ? '9+' : counts.exame}
            </span>
          </div>
        )}
        {counts.atividade > 0 && (
          <div className="flex items-center gap-0.5 text-xs">
            <Heart className="w-3 h-3 text-red-600" />
            <span className="text-red-600 font-medium">
              {counts.atividade > 9 ? '9+' : counts.atividade}
            </span>
          </div>
        )}
      </div>
    );
  };

  const handleAddAppointment = () => {
    setEditingAppointment(null);
    // Set default time to 9:00 AM if creating new appointment
    // Use selectedDate if available, otherwise empty
    const defaultDateTime = selectedDate 
      ? format(selectedDate, "yyyy-MM-dd") + 'T09:00'
      : '';
    setFormData({
      tipo: selectedCategory,
      titulo: '',
      data_agendamento: defaultDateTime,
      duracao_minutos: 60,
    });
    setShowAddDialog(true);
  };

  const handleDayClick = (date: Date) => {
    // Sempre definir a data selecionada primeiro
    setSelectedDate(date);
    
    // Verificar se existe compromisso agendado na data clicada
    const compromissosNaData = appointments.filter(apt => 
      isSameDay(new Date(apt.data_agendamento), date) && apt.status === 'agendado'
    );
    
    // Se existir compromisso, abrir dialog de edição com o primeiro
    if (compromissosNaData.length > 0) {
      handleEditAppointment(compromissosNaData[0]);
    } else {
      // Se não existir, abrir dialog de novo compromisso com a data pré-preenchida
      setTimeout(() => {
        const defaultDateTime = format(date, "yyyy-MM-dd") + 'T09:00';
        setFormData({
          tipo: selectedCategory,
          titulo: '',
          data_agendamento: defaultDateTime,
          duracao_minutos: 60,
        });
        setShowAddDialog(true);
      }, 0);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setSelectedCategory(appointment.tipo);
    
    // Convert UTC timestamp to local datetime-local format (YYYY-MM-DDTHH:mm)
    const appointmentDate = new Date(appointment.data_agendamento);
    const localDateTimeString = format(appointmentDate, "yyyy-MM-dd'T'HH:mm");
    
    setFormData({
      tipo: appointment.tipo,
      titulo: appointment.titulo,
      especialidade: appointment.especialidade,
      medico_profissional: appointment.medico_profissional,
      local_endereco: appointment.local_endereco,
      data_agendamento: localDateTimeString,
      duracao_minutos: appointment.duracao_minutos,
      observacoes: appointment.observacoes,
      dias_semana: appointment.dias_semana,
      repeticao: appointment.repeticao,
    });
    setShowAddDialog(true);
  };

  const handleSubmit = async () => {
    try {
      // Convert datetime-local format to ISO string with timezone
      // The datetime-local input returns "yyyy-MM-ddTHH:mm" in local timezone
      // We need to convert it to proper ISO format for the backend
      const dataToSave = {
        ...formData,
        data_agendamento: formData.data_agendamento 
          ? new Date(formData.data_agendamento).toISOString()
          : formData.data_agendamento
      };
      
      if (editingAppointment) {
        await updateAppointment({ id: editingAppointment.id, ...dataToSave });
      } else {
        await createAppointment(dataToSave);
      }
      setShowAddDialog(false);
      setFormData({
        tipo: 'consulta',
        titulo: '',
        data_agendamento: '',
        duracao_minutos: 60,
      });
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  const handleComplete = async (appointment: Appointment) => {
    await completeAppointment(appointment.id);
    
    // Emitir evento global para atualizar widget
    onCompromissoAtualizado({
      type: 'complete',
      itemId: appointment.id,
      itemType: appointment.tipo as 'consulta' | 'exame' | 'atividade',
      timestamp: Date.now()
    });
  };

  const handleCancel = async (appointment: Appointment) => {
    await deleteAppointment(appointment.id);
    
    // Emitir evento global para atualizar widget
    onCompromissoAtualizado({
      type: 'cancel',
      itemId: appointment.id,
      itemType: appointment.tipo as 'consulta' | 'exame' | 'atividade',
      timestamp: Date.now()
    });
  };

  const handleRestore = async (appointment: Appointment) => {
    await restoreAppointment(appointment.id);
    
    // Emitir evento global para atualizar widget
    onCompromissoAtualizado({
      type: 'complete',
      itemId: appointment.id,
      itemType: appointment.tipo as 'consulta' | 'exame' | 'atividade',
      timestamp: Date.now()
    });
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const CategoryIcon = categoryIcons[appointment.tipo];
    const time = format(new Date(appointment.data_agendamento), 'HH:mm');
    const date = format(new Date(appointment.data_agendamento), 'dd/MM/yyyy');

    return (
      <SwipeableCard
        key={appointment.id}
        onSwipeComplete={() => handleComplete(appointment)}
        onSwipeCancel={() => handleCancel(appointment)}
        onEdit={appointment.status === 'cancelado' || appointment.status === 'realizado' ? undefined : () => handleEditAppointment(appointment)}
      >
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CategoryIcon className="w-5 h-5 text-primary" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground truncate">
                    {appointment.titulo || categoryLabels[appointment.tipo]}
                  </h3>
                  <Badge variant={statusColors[appointment.status] as any} className="ml-2">
                    {appointment.status}
                  </Badge>
                </div>
                
                {appointment.medico_profissional && (
                  <p className="text-sm text-muted-foreground">
                    {appointment.medico_profissional}
                  </p>
                )}
                
                <Badge 
                  variant="outline" 
                  className={`mt-2 w-fit ${
                    appointment.tipo === 'consulta' 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : appointment.tipo === 'exame'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {categoryLabels[appointment.tipo]}
                </Badge>
                
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{time}</span>
                  </div>
                  
                  {appointment.local_endereco && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{appointment.local_endereco}</span>
                    </div>
                  )}
                </div>

                {/* Botões de ação para Desktop */}
                {!isMobile && appointment.status === 'agendado' && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(appointment);
                      }}
                      className="h-8 text-xs hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <span className="mr-1">✗</span>
                      Cancelar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAppointment(appointment);
                      }}
                      className="h-8 text-xs"
                    >
                      <span className="mr-1">✎</span>
                      Alterar
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComplete(appointment);
                      }}
                      className="h-8 text-xs bg-primary hover:bg-primary/90"
                    >
                      <span className="mr-1">✓</span>
                      Concluir
                    </Button>
                  </div>
                )}

                {/* Botão Restaurar para compromissos cancelados ou realizados */}
                {!isMobile && (appointment.status === 'cancelado' || appointment.status === 'realizado') && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(appointment);
                      }}
                      className="h-8 text-xs bg-[#588157] hover:bg-[#3A5A40] text-white"
                    >
                      <span className="mr-1">↻</span>
                      Restaurar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </SwipeableCard>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
            <p className="text-muted-foreground">
              Gerencie seus compromissos
            </p>
          </div>
          <Button 
            onClick={handleAddAppointment} 
            disabled={isCreating}
            className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-soft min-h-[44px]"
            aria-label="Adicionar novo compromisso"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isMobile ? (
              <Plus className="w-4 h-4" />
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Novo Compromisso
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Calendar */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                  ←
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  →
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-0 border border-border/20 overflow-hidden">
              {/* Header row with weekday labels */}
              {weekdayLabels.map((day, index) => (
                <div key={day} className={`py-3 text-sm font-medium text-muted-foreground text-center ${index < 5 ? 'bg-muted-darker/30' : 'bg-muted/30'} border-r border-b border-border/20 last:border-r-0`}>
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((date, index) => {
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isDayToday = isToday(date);
                const isOutsideMonth = !isSameMonth(date, currentDate);
                const isLastColumn = (index + 1) % 7 === 0;
                const isLastRow = index >= calendarDays.length - 7;
                
                const counts = dayCounts[format(date, 'yyyy-MM-dd')];
                const totalCount = counts ? counts.consulta + counts.exame + counts.atividade : 0;
                
                // Generate aria-label for accessibility
                const ariaLabel = `${format(date, 'EEEE, d \'de\' MMMM \'de\' yyyy', { locale: ptBR })}${counts ? ` — Consultas ${counts.consulta}, Exames ${counts.exame}, Atividades ${counts.atividade}` : ''}`;
                
                return (
                  <button
                    key={date.toString()}
                    onClick={() => handleDayClick(date)}
                    role="gridcell"
                    aria-label={ariaLabel}
                    className={`
                      relative p-2 text-sm transition-all duration-200 min-h-[70px] flex flex-col items-start justify-start
                      border-r border-b border-border/20 focus:outline-none focus:ring-2 focus:ring-primary focus:z-10
                      ${isLastColumn ? 'border-r-0' : ''}
                      ${isLastRow ? 'border-b-0' : ''}
                      ${isSelected ? 'border-2 border-destructive bg-background' : 'hover:bg-accent/50'}
                      ${isDayToday && !isSelected ? 'bg-primary/10 ring-2 ring-primary ring-inset' : ''}
                      ${isOutsideMonth ? 'text-muted-foreground opacity-60' : 'text-foreground'}
                      ${!isOutsideMonth && !isSelected && !isDayToday ? 'hover:bg-accent' : ''}
                    `}
                  >
                    {/* Day number */}
                    <span className={`text-sm ${isDayToday ? 'font-bold' : 'font-medium'} mb-1`}>
                      {format(date, 'd')}
                    </span>
                    
                    {/* Category badges */}
                    {getDayBadges(date)}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="bg-[#dad7cd]">
          <CardContent className="p-4 mt-8 bg-[#dad7cd]">
            <p className="text-sm text-muted-foreground mb-3">Pesquise seus compromissos</p>
            <div className="grid grid-cols-4 gap-4 items-end">
              <div className="relative col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar compromissos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Todas categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas categorias</SelectItem>
                  <SelectItem value="consulta">Consultas</SelectItem>
                  <SelectItem value="exame">Exames</SelectItem>
                  <SelectItem value="atividade">Atividades</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Todos status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos status</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedDate && (
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(null)}>
                  Limpar data
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Total de Compromissos ({filteredAppointments.pending.length + filteredAppointments.completed.length})
              {selectedDate && (
                <span className="text-sm font-normal text-muted-foreground">
                  - {format(selectedDate, 'dd/MM/yyyy')}
                </span>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Compromissos do mês de {format(currentDate, 'MMMM', { locale: ptBR })}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {filteredAppointments.pending.length === 0 && filteredAppointments.completed.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum compromisso encontrado</p>
              </div>
            ) : (
              <>
                {/* Pending Appointments */}
                {filteredAppointments.pending.length > 0 && (
                  <Collapsible open={agendadosExpanded} onOpenChange={setAgendadosExpanded}>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Agendados ({filteredAppointments.pending.length})
                      </h3>
                      {agendadosExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground transition-transform group-hover:text-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-hover:text-foreground" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 mt-3">
                      {filteredAppointments.pending.map(renderAppointmentCard)}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Completed Appointments */}
                {filteredAppointments.completed.length > 0 && (
                  <Collapsible open={realizadosExpanded} onOpenChange={setRealizadosExpanded}>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group mb-[40px]">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Realizados ({filteredAppointments.completed.length})
                      </h3>
                      {realizadosExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground transition-transform group-hover:text-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-hover:text-foreground" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 mt-3 opacity-60">
                      {filteredAppointments.completed.map(renderAppointmentCard)}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAppointment ? 'Editar Compromisso' : 'Novo Compromisso'}
            </DialogTitle>
          </DialogHeader>
          
          {/* Category selection buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setSelectedCategory('consulta');
                setFormData(prev => ({ ...prev, tipo: 'consulta' }));
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'consulta'
                  ? "bg-[#344E41] text-white"
                  : "bg-[#DAD7CD] text-[#344E41] hover:bg-[#B8B5A7]"
              }`}
            >
              <User className="w-4 h-4" />
              Consulta
            </button>
            <button
              onClick={() => {
                setSelectedCategory('exame');
                setFormData(prev => ({ ...prev, tipo: 'exame' }));
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'exame'
                  ? "bg-[#344E41] text-white"
                  : "bg-[#DAD7CD] text-[#344E41] hover:bg-[#B8B5A7]"
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              Exame
            </button>
            <button
              onClick={() => {
                setSelectedCategory('atividade');
                setFormData(prev => ({ ...prev, tipo: 'atividade' }));
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'atividade'
                  ? "bg-[#344E41] text-white"
                  : "bg-[#DAD7CD] text-[#344E41] hover:bg-[#B8B5A7]"
              }`}
            >
              <Heart className="w-4 h-4" />
              Atividade
            </button>
          </div>
          
          {/* Form content based on selected category */}
          {selectedCategory === 'consulta' && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="especialidade">Especialidade</Label>
                <Input
                  id="especialidade"
                  value={formData.especialidade || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, especialidade: e.target.value, titulo: e.target.value }))}
                  placeholder="Ex: Cardiologia"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="profissional">Profissional</Label>
                <Input
                  id="profissional"
                  value={formData.medico_profissional || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, medico_profissional: e.target.value }))}
                  placeholder="Nome do médico"
                />
              </div>
            </div>
          )}
          
          {selectedCategory === 'exame' && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_exame">Tipo de Exame</Label>
                <Input
                  id="tipo_exame"
                  value={formData.titulo || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: Hemograma"
                />
              </div>
            </div>
          )}
          
          {selectedCategory === 'atividade' && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_atividade">Tipo de Atividade</Label>
                <Input
                  id="tipo_atividade"
                  value={formData.titulo || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: Caminhada"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duracao">Duração (minutos)</Label>
                <Input
                  id="duracao"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="1440"
                  value={formData.duracao_minutos ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      duracao_minutos: value === '' ? undefined : parseInt(value) 
                    }));
                  }}
                  onBlur={(e) => {
                    // Garante valor mínimo de 1 ao perder foco se estiver vazio
                    if (!e.target.value || parseInt(e.target.value) < 1) {
                      setFormData(prev => ({ ...prev, duracao_minutos: 60 }));
                    }
                  }}
                  placeholder="Ex: 60"
                  className="min-h-[44px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Repetição</Label>
                <Select 
                  value={formData.repeticao || 'none'} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, repeticao: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não se repete</SelectItem>
                    <SelectItem value="weekly">Toda semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.repeticao === 'weekly' && (
                <div className="space-y-2">
                  <Label>Dias da semana</Label>
                  {/* Desktop: 2 colunas */}
                  <div className="hidden md:grid md:grid-cols-2 gap-x-6 gap-y-2">
                    {/* Primeira coluna: Segunda a Quinta */}
                    <div className="space-y-2">
                      {weekdays.slice(0, 4).map(day => (
                        <div key={day.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${day.value}`}
                            checked={formData.dias_semana?.includes(day.value) || false}
                            onCheckedChange={(checked) => {
                              const current = formData.dias_semana || [];
                              if (checked) {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  dias_semana: [...current, day.value] 
                                }));
                              } else {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  dias_semana: current.filter(d => d !== day.value) 
                                }));
                              }
                            }}
                          />
                          <Label htmlFor={`day-${day.value}`} className="text-sm font-normal cursor-pointer">
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {/* Segunda coluna: Sexta a Domingo */}
                    <div className="space-y-2">
                      {weekdays.slice(4, 7).map(day => (
                        <div key={day.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${day.value}`}
                            checked={formData.dias_semana?.includes(day.value) || false}
                            onCheckedChange={(checked) => {
                              const current = formData.dias_semana || [];
                              if (checked) {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  dias_semana: [...current, day.value] 
                                }));
                              } else {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  dias_semana: current.filter(d => d !== day.value) 
                                }));
                              }
                            }}
                          />
                          <Label htmlFor={`day-${day.value}`} className="text-sm font-normal cursor-pointer">
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Mobile: 1 linha horizontal com abreviações */}
                  <div className="flex md:hidden justify-between gap-1">
                    {weekdays.map(day => (
                      <div key={day.value} className="flex flex-col items-center justify-center gap-1 bg-muted/50 px-2 py-1.5 rounded-md min-h-[40px] flex-1">
                        <Checkbox
                          id={`day-mobile-${day.value}`}
                          checked={formData.dias_semana?.includes(day.value) || false}
                          onCheckedChange={(checked) => {
                            const current = formData.dias_semana || [];
                            if (checked) {
                              setFormData(prev => ({ 
                                ...prev, 
                                dias_semana: [...current, day.value] 
                              }));
                            } else {
                              setFormData(prev => ({ 
                                ...prev, 
                                dias_semana: current.filter(d => d !== day.value) 
                              }));
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <Label htmlFor={`day-mobile-${day.value}`} className="text-[10px] font-medium cursor-pointer text-center leading-tight">
                          {day.shortLabel}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Common fields */}
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                value={formData.local_endereco || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, local_endereco: e.target.value }))}
                placeholder="Endereço ou local"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data_hora">Data e Hora</Label>
              <Input
                id="data_hora"
                type="datetime-local"
                value={formData.data_agendamento}
                onChange={(e) => setFormData(prev => ({ ...prev, data_agendamento: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="observacoes_gerais">Observações</Label>
              <Textarea
                id="observacoes_gerais"
                value={formData.observacoes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações gerais"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isCreating || isUpdating} className="flex-1">
              {isCreating || isUpdating ? 'Salvando...' : editingAppointment ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}