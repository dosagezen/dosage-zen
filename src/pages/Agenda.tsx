import { useState } from "react";
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Search, User, ChevronLeft, ChevronRight, Pill, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import CompromissosModal from "@/components/CompromissosModal";
const Agenda = () => {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const consultas = [
  // Eventos de Agosto 2025
  {
    id: 1,
    tipo: "consulta",
    especialidade: "Cardiologia",
    medico: "Dr. João Silva",
    local: "Hospital Central",
    data: "2025-08-15",
    dataFormatada: "15/08/2025",
    hora: "09:00",
    observacoes: "Levar resultados de exames anteriores",
    status: "agendado"
  },
  // Eventos do dia 19/08/2025
  {
    id: 8,
    tipo: "consulta",
    especialidade: "Clínica Geral",
    medico: "Dr. Pedro Martins",
    local: "UBS Central",
    data: "2025-08-19",
    dataFormatada: "19/08/2025",
    hora: "08:30",
    observacoes: "Consulta de rotina e renovação de receitas",
    status: "agendado"
  }, {
    id: 9,
    tipo: "consulta",
    especialidade: "Nutricionista",
    medico: "Dra. Carla Ribeiro",
    local: "Clínica Vida Saudável",
    data: "2025-08-19",
    dataFormatada: "19/08/2025",
    hora: "14:00",
    observacoes: "Acompanhamento nutricional mensal",
    status: "confirmado"
  }, {
    id: 10,
    tipo: "exame",
    especialidade: "Laboratório",
    medico: "Lab Diagnóstica",
    local: "Laboratório Diagnóstica",
    data: "2025-08-19",
    dataFormatada: "19/08/2025",
    hora: "07:00",
    observacoes: "Hemograma completo - jejum de 12 horas",
    status: "agendado"
  }, {
    id: 2,
    tipo: "exame",
    especialidade: "Endocrinologia",
    medico: "Dra. Maria Santos",
    local: "Clínica Saúde Plus",
    data: "2025-08-22",
    dataFormatada: "22/08/2025",
    hora: "14:30",
    observacoes: "Jejum de 12 horas",
    status: "agendado"
  }, {
    id: 3,
    tipo: "consulta",
    especialidade: "Oftalmologia",
    medico: "Dr. Carlos Oliveira",
    local: "Centro Médico Visual",
    data: "2025-08-28",
    dataFormatada: "28/08/2025",
    hora: "16:00",
    observacoes: "Avaliação de rotina",
    status: "confirmado"
  },
  // Eventos de Setembro 2025
  {
    id: 4,
    tipo: "consulta",
    especialidade: "Dermatologia",
    medico: "Dra. Ana Costa",
    local: "Clínica DermaCare",
    data: "2025-09-05",
    dataFormatada: "05/09/2025",
    hora: "10:30",
    observacoes: "Consulta para acompanhamento",
    status: "agendado"
  }, {
    id: 5,
    tipo: "exame",
    especialidade: "Radiologia",
    medico: "Dr. Roberto Lima",
    local: "Centro de Diagnóstico",
    data: "2025-09-12",
    dataFormatada: "12/09/2025",
    hora: "08:00",
    observacoes: "Ultrassom abdominal - jejum de 8 horas",
    status: "agendado"
  }, {
    id: 6,
    tipo: "consulta",
    especialidade: "Neurologia",
    medico: "Dr. Fernando Souza",
    local: "Hospital Neurológico",
    data: "2025-09-18",
    dataFormatada: "18/09/2025",
    hora: "15:00",
    observacoes: "Primeira consulta",
    status: "agendado"
  }, {
    id: 7,
    tipo: "exame",
    especialidade: "Laboratório",
    medico: "Lab Central",
    local: "Laboratório Central",
    data: "2025-09-25",
    dataFormatada: "25/09/2025",
    hora: "07:30",
    observacoes: "Exames de sangue - jejum de 12 horas",
    status: "agendado"
  }];

  // Mock de medicações para demonstrar no calendário
  const medicacoes = [
  // Medicações de Agosto
  {
    id: 101,
    tipo: "medicacao",
    nome: "Atorvastatina",
    dosagem: "10 mg",
    data: "2025-08-15",
    dataFormatada: "15/08/2025",
    hora: "08:00",
    observacoes: "Tomar com o café da manhã",
    status: "pendente"
  },
  // Medicações do dia 19/08/2025
  {
    id: 107,
    tipo: "medicacao",
    nome: "Captopril",
    dosagem: "25 mg",
    data: "2025-08-19",
    dataFormatada: "19/08/2025",
    hora: "06:00",
    observacoes: "Tomar em jejum, 30 min antes do café",
    status: "pendente"
  }, {
    id: 108,
    tipo: "medicacao",
    nome: "Sinvastatina",
    dosagem: "20 mg",
    data: "2025-08-19",
    dataFormatada: "19/08/2025",
    hora: "22:00",
    observacoes: "Tomar antes de dormir",
    status: "pendente"
  }, {
    id: 109,
    tipo: "medicacao",
    nome: "Ácido Fólico",
    dosagem: "5 mg",
    data: "2025-08-19",
    dataFormatada: "19/08/2025",
    hora: "12:30",
    observacoes: "Tomar após o almoço",
    status: "pendente"
  }, {
    id: 102,
    tipo: "medicacao",
    nome: "Glifarge XR",
    dosagem: "500 mg",
    data: "2025-08-22",
    dataFormatada: "22/08/2025",
    hora: "12:00",
    observacoes: "Tomar antes do almoço",
    status: "pendente"
  }, {
    id: 103,
    tipo: "medicacao",
    nome: "Omega 3",
    dosagem: "1000 mg",
    data: "2025-08-28",
    dataFormatada: "28/08/2025",
    hora: "20:00",
    observacoes: "Tomar após o jantar",
    status: "pendente"
  },
  // Medicações de Setembro
  {
    id: 104,
    tipo: "medicacao",
    nome: "Vitamina D",
    dosagem: "2000 UI",
    data: "2025-09-05",
    dataFormatada: "05/09/2025",
    hora: "09:00",
    observacoes: "Tomar com leite ou iogurte",
    status: "pendente"
  }, {
    id: 105,
    tipo: "medicacao",
    nome: "Losartana",
    dosagem: "50 mg",
    data: "2025-09-12",
    dataFormatada: "12/09/2025",
    hora: "19:00",
    observacoes: "Tomar sempre no mesmo horário",
    status: "pendente"
  }, {
    id: 106,
    tipo: "medicacao",
    nome: "Complexo B",
    dosagem: "1 comprimido",
    data: "2025-09-18",
    dataFormatada: "18/09/2025",
    hora: "08:30",
    observacoes: "Tomar em jejum",
    status: "pendente"
  }];

  // Combinar todos os compromissos
  const todosCompromissos = [...consultas, ...medicacoes];
  const filteredConsultas = consultas.filter(consulta => consulta.especialidade.toLowerCase().includes(searchTerm.toLowerCase()) || consulta.medico.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredCompromissos = todosCompromissos.filter(item => {
    if (item.tipo === "medicacao") {
      return (item as any).nome.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return (item as any).especialidade?.toLowerCase().includes(searchTerm.toLowerCase()) || (item as any).medico?.toLowerCase().includes(searchTerm.toLowerCase());
  });
  const getStatusColor = (status: string) => {
    switch (status) {
      case "agendado":
        return "default";
      case "confirmado":
        return "default";
      case "cancelado":
        return "destructive";
      default:
        return "secondary";
    }
  };
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "consulta":
        return User;
      case "exame":
        return Stethoscope;
      case "medicacao":
        return Pill;
      default:
        return CalendarIcon;
    }
  };

  // Calendar utilities
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({
    start: monthStart,
    end: monthEnd
  });

  // Add padding days for calendar grid (Monday = 0, Sunday = 6)
  const firstDayOfWeek = (getDay(monthStart) + 6) % 7; // Convert Sunday=0 to Monday=0
  const paddingDays = Array.from({
    length: firstDayOfWeek
  }, (_, i) => new Date(monthStart.getTime() - (firstDayOfWeek - i) * 24 * 60 * 60 * 1000));
  const allCalendarDays = [...paddingDays, ...calendarDays];

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return filteredConsultas.filter(evento => isSameDay(new Date(evento.data), day));
  };

  // Get all compromissos for a specific day
  const getCompromissosForDay = (day: Date) => {
    return filteredCompromissos.filter(compromisso => isSameDay(new Date(compromisso.data), day));
  };

  // Get compromissos by type for a day
  const getCompromissosByType = (day: Date) => {
    const compromissos = getCompromissosForDay(day);
    return {
      medicacoes: compromissos.filter(c => c.tipo === "medicacao"),
      consultas: compromissos.filter(c => c.tipo === "consulta"),
      exames: compromissos.filter(c => c.tipo === "exame")
    };
  };

  // Navigation functions
  const navigateToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  const navigateToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };
  const handleDayClick = (day: Date) => {
    const compromissos = getCompromissosForDay(day);
    if (compromissos.length > 0) {
      setSelectedDay(day);
      setIsDayModalOpen(true);
    }
  };
  return <div className="p-6 space-y-6 bg-gradient-soft min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-primary">Agenda</h1>
          <p className="text-muted-foreground">Gerencie suas consultas e exames</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-soft min-h-[44px]">
              {isMobile ? <Plus className="w-4 h-4" /> : <>
                  <Plus className="w-4 h-4 mr-2" />
                  Agendar
                </>}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-primary">Nova Consulta/ Exame/ Atividade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="especialidade">Especialidade</Label>
                <Input id="especialidade" placeholder="Ex.: Oftalmologia" className="placeholder:text-muted-foreground/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medico">Médico/Profissional</Label>
                <Input id="medico" placeholder="Ex.: Dr. João Silva" className="placeholder:text-muted-foreground/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="local">Local</Label>
                <Input id="local" placeholder="Ex.: Hospital Central" className="placeholder:text-muted-foreground/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input id="data" type="date" placeholder="Ex.: 22/09/2025" className="placeholder:text-muted-foreground/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora">Hora</Label>
                  <Input id="hora" type="time" placeholder="Ex.: 09:30" className="placeholder:text-muted-foreground/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" placeholder="Ex.: Levar resultados de exames anteriores" className="placeholder:text-muted-foreground/50" rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="bg-gradient-primary hover:bg-primary-hover">
                Agendar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros e Busca */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por especialidade ou médico..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendário Mensal */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-primary flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {format(currentDate, "MMMM yyyy", {
              locale: ptBR
            })}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={navigateToPreviousMonth} className="h-8 w-8 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={navigateToNextMonth} className="h-8 w-8 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {/* Week days header */}
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>)}
            
            {/* Calendar days */}
            {allCalendarDays.map((day, index) => {
            const compromissosByType = getCompromissosByType(day);
            const totalCompromissos = getCompromissosForDay(day).length;
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            return <div key={index} onClick={() => handleDayClick(day)} className={`
                    min-h-[80px] p-1 border border-border/20 rounded-md transition-colors cursor-pointer
                    ${isCurrentMonth ? 'bg-card' : 'bg-muted/30'}
                    ${isToday ? 'ring-2 ring-primary/50' : ''}
                    ${totalCompromissos > 0 ? 'hover:bg-accent/20' : 'hover:bg-accent/10'}
                  `}>
                  <div className={`text-sm ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'} ${isToday ? 'font-bold text-primary' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  
                  {/* Indicadores visuais por tipo de compromisso */}
                  {totalCompromissos > 0 && <div className="flex flex-wrap gap-1 mt-1">
                      {/* Ícone de Medicações */}
                      {compromissosByType.medicacoes.length > 0 && <div className="flex items-center gap-1 bg-success/20 text-success px-1 py-0.5 rounded text-xs">
                          <Pill className="w-3 h-3" />
                          <span>{compromissosByType.medicacoes.length}</span>
                        </div>}
                      
                      {/* Ícone de Consultas */}
                      {compromissosByType.consultas.length > 0 && <div className="flex items-center gap-1 bg-primary/20 text-primary px-1 py-0.5 rounded text-xs">
                          <User className="w-3 h-3" />
                          <span>{compromissosByType.consultas.length}</span>
                        </div>}
                      
                      {/* Ícone de Exames */}
                      {compromissosByType.exames.length > 0 && <div className="flex items-center gap-1 bg-accent/30 text-accent-foreground px-1 py-0.5 rounded text-xs">
                          <Stethoscope className="w-3 h-3" />
                          <span>{compromissosByType.exames.length}</span>
                        </div>}
                    </div>}
                </div>;
          })}
          </div>
        </CardContent>
      </Card>

      {/* Event Detail Modal */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2">
              {selectedEvent && <>
                  {getTipoIcon(selectedEvent.tipo) === User ? <User className="w-5 h-5" /> : <CalendarIcon className="w-5 h-5" />}
                  {selectedEvent.especialidade}
                </>}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <p className="font-medium text-primary">
                    {selectedEvent.tipo === "consulta" ? "Consulta" : "Exame"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant={getStatusColor(selectedEvent.status)}>
                      {selectedEvent.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Profissional</Label>
                <p className="font-medium text-primary">{selectedEvent.medico}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Local</Label>
                <p className="font-medium text-primary flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {selectedEvent.local}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Data</Label>
                  <p className="font-medium text-primary flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {selectedEvent.dataFormatada}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Hora</Label>
                  <p className="font-medium text-primary flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {selectedEvent.hora}
                  </p>
                </div>
              </div>
              
              {selectedEvent.observacoes && <div>
                  <Label className="text-muted-foreground">Observações</Label>
                  <p className="font-medium text-primary mt-1 p-3 bg-accent/10 rounded-lg">
                    {selectedEvent.observacoes}
                  </p>
                </div>}
            </div>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEventModalOpen(false)}>
              Fechar
            </Button>
            <Button variant="outline">
              Editar
            </Button>
            <Button variant="outline">
              Remarcar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Day Compromissos Modal */}
      <Dialog open={isDayModalOpen} onOpenChange={setIsDayModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Compromissos de {selectedDay && format(selectedDay, "dd/MM/yyyy", {
              locale: ptBR
            })}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDay && (
            <div className="py-4">
              <div className="space-y-4">
                {getCompromissosForDay(selectedDay).map((compromisso) => {
                  const Icon = getTipoIcon(compromisso.tipo);
                  return (
                    <Card key={compromisso.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 text-primary mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-primary">
                              {compromisso.tipo === "medicacao" ? (compromisso as any).nome : (compromisso as any).especialidade}
                            </h4>
                            <Badge variant={getStatusColor(compromisso.status)}>
                              {compromisso.status}
                            </Badge>
                          </div>
                          
                          {compromisso.tipo === "medicacao" ? (
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>Dosagem: {(compromisso as any).dosagem}</p>
                              <p>Horário: {compromisso.hora}</p>
                              <p>Observações: {compromisso.observacoes}</p>
                            </div>
                          ) : (
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>Profissional: {(compromisso as any).medico}</p>
                              <p>Local: {(compromisso as any).local}</p>
                              <p>Horário: {compromisso.hora}</p>
                              <p>Observações: {compromisso.observacoes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
                
                {getCompromissosForDay(selectedDay).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum compromisso para este dia</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsDayModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {filteredConsultas.length === 0 && <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">
              {searchTerm ? "Nenhuma consulta encontrada" : "Nenhuma consulta agendada"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Tente buscar com outros termos" : "Agende sua primeira consulta para começar"}
            </p>
          </CardContent>
        </Card>}

      {/* Próximos Lembretes */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Próximos Lembretes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
              <span className="text-primary">Consulta de Cardiologia em 3 dias</span>
              <Badge variant="outline">15/05/2025</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
              <span className="text-primary">Exame de Endocrinologia em 10 dias</span>
              <Badge variant="outline">22/05/2025</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default Agenda;