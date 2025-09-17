import { useState, useMemo } from 'react';
import { Calendar, Search, Plus, User, Stethoscope, Heart, MapPin, Clock, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointments, type Appointment, type CreateAppointmentData } from '@/hooks/useAppointments';
import { useToast } from '@/hooks/use-toast';
import { SwipeableCard } from '@/components/SwipeableCard';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

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

  const { toast } = useToast();
  const { currentContext } = useAuth();
  const { 
    appointments, 
    createAppointment, 
    updateAppointment, 
    deleteAppointment, 
    completeAppointment,
    isCreating,
    isUpdating,
    fetchDayCounts 
  } = useAppointments(undefined, currentContext);

  // Mock day counts for now - would fetch from API
  const dayCounts = useMemo(() => {
    const counts: Record<string, { consultas: number; exames: number; atividades: number }> = {};
    appointments.forEach(apt => {
      const date = format(new Date(apt.data_agendamento), 'yyyy-MM-dd');
      if (!counts[date]) {
        counts[date] = { consultas: 0, exames: 0, atividades: 0 };
      }
      if (apt.status === 'agendado') {
        counts[date][`${apt.tipo}s` as keyof typeof counts[string]]++;
      }
    });
    return counts;
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchesSearch = searchTerm === '' || 
        apt.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.especialidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.medico_profissional?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.local_endereco?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === 'todas' || apt.tipo === categoryFilter;
      const matchesStatus = statusFilter === 'todos' || apt.status === statusFilter;
      const matchesDate = !selectedDate || isSameDay(new Date(apt.data_agendamento), selectedDate);

      return matchesSearch && matchesCategory && matchesStatus && matchesDate;
    });
  }, [appointments, searchTerm, categoryFilter, statusFilter, selectedDate]);

  // Calendar logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDayClick = (date: Date) => {
    setSelectedDate(isSameDay(date, selectedDate || new Date('1900-01-01')) ? null : date);
  };

  const getDayBadges = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const counts = dayCounts[dateStr];
    if (!counts) return null;

    return (
      <div className="flex gap-1 mt-1">
        {counts.consultas > 0 && (
          <Badge variant="outline" className="text-xs p-0 px-1 bg-blue-50">
            {counts.consultas}
          </Badge>
        )}
        {counts.exames > 0 && (
          <Badge variant="outline" className="text-xs p-0 px-1 bg-green-50">
            {counts.exames}
          </Badge>
        )}
        {counts.atividades > 0 && (
          <Badge variant="outline" className="text-xs p-0 px-1 bg-red-50">
            {counts.atividades}
          </Badge>
        )}
      </div>
    );
  };

  const handleAddAppointment = () => {
    setEditingAppointment(null);
    setFormData({
      tipo: selectedCategory,
      titulo: '',
      data_agendamento: selectedDate ? format(selectedDate, "yyyy-MM-dd'T'HH:mm") : '',
      duracao_minutos: 60,
    });
    setShowAddDialog(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setSelectedCategory(appointment.tipo);
    setFormData({
      tipo: appointment.tipo,
      titulo: appointment.titulo,
      especialidade: appointment.especialidade,
      medico_profissional: appointment.medico_profissional,
      local_endereco: appointment.local_endereco,
      data_agendamento: appointment.data_agendamento,
      duracao_minutos: appointment.duracao_minutos,
      observacoes: appointment.observacoes,
      dias_semana: appointment.dias_semana,
      repeticao: appointment.repeticao,
    });
    setShowAddDialog(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingAppointment) {
        await updateAppointment({ id: editingAppointment.id, ...formData });
      } else {
        await createAppointment(formData);
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
  };

  const handleCancel = async (appointment: Appointment) => {
    await deleteAppointment(appointment.id);
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
        onEdit={() => handleEditAppointment(appointment)}
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
                
                {appointment.especialidade && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {appointment.especialidade}
                  </p>
                )}
                
                {appointment.medico_profissional && (
                  <p className="text-sm text-muted-foreground">
                    {appointment.medico_profissional}
                  </p>
                )}
                
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{time} - {date}</span>
                  </div>
                  
                  {appointment.local_endereco && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{appointment.local_endereco}</span>
                    </div>
                  )}
                </div>
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
              Gerencie seus compromissos e agendamentos
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
        <Card>
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
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="py-2 text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              
              {daysInMonth.map(date => {
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isToday = isSameDay(date, new Date());
                
                return (
                  <button
                    key={date.toString()}
                    onClick={() => handleDayClick(date)}
                    className={`
                      p-2 text-sm rounded-lg transition-colors min-h-[60px] flex flex-col items-center justify-start
                      ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}
                      ${isToday ? 'ring-2 ring-primary' : ''}
                      ${!isSameMonth(date, currentDate) ? 'text-muted-foreground' : ''}
                    `}
                  >
                    <span>{format(date, 'd')}</span>
                    {getDayBadges(date)}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar compromissos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
                  <SelectTrigger className="w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas categorias</SelectItem>
                    <SelectItem value="consulta">Consultas</SelectItem>
                    <SelectItem value="exame">Exames</SelectItem>
                    <SelectItem value="atividade">Atividades</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-auto">
                    <SelectValue />
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
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Compromissos ({filteredAppointments.length})
              {selectedDate && (
                <span className="text-sm font-normal text-muted-foreground">
                  - {format(selectedDate, 'dd/MM/yyyy')}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum compromisso encontrado</p>
              </div>
            ) : (
              filteredAppointments.map(renderAppointmentCard)
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
          
          <Tabs value={selectedCategory} onValueChange={(value: any) => {
            setSelectedCategory(value);
            setFormData(prev => ({ ...prev, tipo: value }));
          }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="consulta">Consulta</TabsTrigger>
              <TabsTrigger value="exame">Exame</TabsTrigger>
              <TabsTrigger value="atividade">Atividade</TabsTrigger>
            </TabsList>
            
            <TabsContent value="consulta" className="space-y-4 mt-4">
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
            </TabsContent>
            
            <TabsContent value="exame" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_exame">Tipo de Exame</Label>
                <Input
                  id="tipo_exame"
                  value={formData.titulo || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: Hemograma"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preparos">Preparos</Label>
                <Textarea
                  id="preparos"
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Instruções de preparo"
                  rows={3}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="atividade" className="space-y-4 mt-4">
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
                  value={formData.duracao_minutos || 60}
                  onChange={(e) => setFormData(prev => ({ ...prev, duracao_minutos: parseInt(e.target.value) || 60 }))}
                  placeholder="60"
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
                  <div className="grid grid-cols-2 gap-2">
                    {weekdays.map(day => (
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
                        <Label htmlFor={`day-${day.value}`} className="text-sm">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
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