import { useState } from "react";
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Search, User, ChevronLeft, ChevronRight, Pill, Stethoscope, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
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
  const [selectedCategory, setSelectedCategory] = useState<'consulta' | 'exame' | 'atividade'>('consulta');
  
  // Estados específicos para cada categoria
  const [consultaData, setConsultaData] = useState({
    date: undefined as Date | undefined,
    time: "00:00",
    especialidade: "",
    profissional: "",
    local: "",
    observacoes: ""
  });
  const [exameData, setExameData] = useState({
    date: undefined as Date | undefined,
    time: "00:00",
    tipoExame: "",
    preparos: "",
    local: "",
    observacoes: ""
  });
  const [atividadeData, setAtividadeData] = useState({
    date: undefined as Date | undefined,
    time: "00:00",
    tipoAtividade: "",
    local: "",
    duracao: "",
    observacoes: "",
    dias: [] as string[],
    repeticao: 'none' as 'weekly' | 'none'
  });

  // Estados para rastrear se os campos de hora foram tocados pelo usuário
  const [timeFieldTouched, setTimeFieldTouched] = useState({
    consulta: false,
    exame: false,
    atividade: false
  });

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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    }
  ];

  // Mock de atividades para demonstrar no calendário
  const atividades = [
    {
      id: 301,
      tipo: "atividade",
      nome: "Fisioterapia",
      local: "Clínica Movimento",
      data: "2025-08-19",
      dataFormatada: "19/08/2025",
      hora: "07:30",
      duracao: "45min",
      observacoes: "Exercícios para fortalecimento",
      status: "pendente",
      dias: ["Seg", "Qua", "Sex"],
      repeticao: "Toda semana"
    },
    {
      id: 302,
      tipo: "atividade",
      nome: "Caminhada",
      local: "Parque da Cidade",
      data: "2025-08-19",
      dataFormatada: "19/08/2025",
      hora: "18:00",
      duracao: "30min",
      observacoes: "Atividade ao ar livre",
      status: "pendente",
      dias: ["Dom"],
      repeticao: "Não se repete"
    },
    {
      id: 303,
      tipo: "atividade",
      nome: "Pilates",
      local: "Studio Equilíbrio",
      data: "2025-08-20",
      dataFormatada: "20/08/2025",
      hora: "08:00",
      duracao: "50min",
      observacoes: "Aula com foco no core",
      status: "pendente",
      dias: ["Ter", "Qui"],
      repeticao: "Toda semana"
    },
    // Novos exemplos mockados com recorrência
    {
      id: 304,
      tipo: "atividade",
      nome: "Fisioterapia",
      local: "Clínica Movimento",
      data: "2025-08-21",
      dataFormatada: "21/08/2025",
      hora: "07:30",
      duracao: "45min",
      observacoes: "Exercícios para fortalecimento",
      status: "pendente",
      dias: ["Seg", "Qua", "Sex"],
      repeticao: "Toda semana"
    },
    {
      id: 305,
      tipo: "atividade",
      nome: "Fisioterapia",
      local: "Clínica Movimento",
      data: "2025-08-23",
      dataFormatada: "23/08/2025",
      hora: "07:30",
      duracao: "45min",
      observacoes: "Exercícios para fortalecimento",
      status: "pendente",
      dias: ["Seg", "Qua", "Sex"],
      repeticao: "Toda semana"
    },
    {
      id: 306,
      tipo: "atividade",
      nome: "Pilates",
      local: "Studio Equilíbrio",
      data: "2025-08-22",
      dataFormatada: "22/08/2025",
      hora: "08:00",
      duracao: "50min",
      observacoes: "Aula com foco no core",
      status: "pendente",
      dias: ["Ter", "Qui"],
      repeticao: "Toda semana"
    }
  ];

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
    },
    {
      id: 108,
      tipo: "medicacao",
      nome: "Sinvastatina",
      dosagem: "20 mg",
      data: "2025-08-19",
      dataFormatada: "19/08/2025",
      hora: "22:00",
      observacoes: "Tomar antes de dormir",
      status: "pendente"
    },
    {
      id: 109,
      tipo: "medicacao",
      nome: "Ácido Fólico",
      dosagem: "5 mg",
      data: "2025-08-19",
      dataFormatada: "19/08/2025",
      hora: "12:30",
      observacoes: "Tomar após o almoço",
      status: "pendente"
    },
    {
      id: 102,
      tipo: "medicacao",
      nome: "Glifarge XR",
      dosagem: "500 mg",
      data: "2025-08-22",
      dataFormatada: "22/08/2025",
      hora: "12:00",
      observacoes: "Tomar antes do almoço",
      status: "pendente"
    },
    {
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
    },
    {
      id: 105,
      tipo: "medicacao",
      nome: "Losartana",
      dosagem: "50 mg",
      data: "2025-09-12",
      dataFormatada: "12/09/2025",
      hora: "19:00",
      observacoes: "Tomar sempre no mesmo horário",
      status: "pendente"
    },
    {
      id: 106,
      tipo: "medicacao",
      nome: "Complexo B",
      dosagem: "1 comprimido",
      data: "2025-09-18",
      dataFormatada: "18/09/2025",
      hora: "08:30",
      observacoes: "Tomar em jejum",
      status: "pendente"
    }
  ];

  // Combinar todos os compromissos
  const todosCompromissos = [...consultas, ...medicacoes, ...atividades];
  const filteredConsultas = consultas.filter(consulta => 
    consulta.especialidade.toLowerCase().includes(searchTerm.toLowerCase()) || 
    consulta.medico.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredCompromissos = todosCompromissos.filter(item => {
    if (item.tipo === "medicacao") {
      return (item as any).nome.toLowerCase().includes(searchTerm.toLowerCase());
    } else if (item.tipo === "atividade") {
      return (item as any).nome.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return (item as any).especialidade?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (item as any).medico?.toLowerCase().includes(searchTerm.toLowerCase());
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
      case "atividade":
        return Heart;
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

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // Reset form values when dialog closes - cada categoria mantém seus próprios dados
      setConsultaData({
        date: undefined,
        time: "00:00",
        especialidade: "",
        profissional: "",
        local: "",
        observacoes: ""
      });
      setExameData({
        date: undefined,
        time: "00:00",
        tipoExame: "",
        preparos: "",
        local: "",
        observacoes: ""
      });
      setAtividadeData({
        date: undefined,
        time: "00:00",
        tipoAtividade: "",
        local: "",
        duracao: "",
        observacoes: "",
        dias: [],
        repeticao: 'none'
      });
      setTimeFieldTouched({
        consulta: false,
        exame: false,
        atividade: false
      });
    }
  };

  // Função para obter dados da categoria atual
  const getCurrentCategoryData = () => {
    switch (selectedCategory) {
      case 'consulta': return consultaData;
      case 'exame': return exameData;
      case 'atividade': return atividadeData;
      default: return consultaData;
    }
  };

  // Função para atualizar dados da categoria atual
  const updateCurrentCategoryData = (field: string, value: any) => {
    switch (selectedCategory) {
      case 'consulta':
        setConsultaData(prev => ({ ...prev, [field]: value }));
        if (field === 'time') {
          setTimeFieldTouched(prev => ({ ...prev, consulta: true }));
        }
        break;
      case 'exame':
        setExameData(prev => ({ ...prev, [field]: value }));
        if (field === 'time') {
          setTimeFieldTouched(prev => ({ ...prev, exame: true }));
        }
        break;
      case 'atividade':
        setAtividadeData(prev => ({ ...prev, [field]: value }));
        if (field === 'time') {
          setTimeFieldTouched(prev => ({ ...prev, atividade: true }));
        }
        break;
    }
  };

  // Função para redefinir dados da categoria atual
  const resetCurrentCategoryData = () => {
    console.log('Reset button clicked for category:', selectedCategory);
    console.log('Current timeFieldTouched before reset:', timeFieldTouched);
    
    switch (selectedCategory) {
      case 'consulta':
        setConsultaData({
          date: undefined,
          time: "00:00",
          especialidade: "",
          profissional: "",
          local: "",
          observacoes: ""
        });
        setTimeFieldTouched(prev => ({ ...prev, consulta: false }));
        console.log('Reset consulta data');
        break;
      case 'exame':
        setExameData({
          date: undefined,
          time: "00:00",
          tipoExame: "",
          preparos: "",
          local: "",
          observacoes: ""
        });
        setTimeFieldTouched(prev => ({ ...prev, exame: false }));
        console.log('Reset exame data');
        break;
      case 'atividade':
        setAtividadeData({
          date: undefined,
          time: "00:00",
          tipoAtividade: "",
          local: "",
          duracao: "",
          observacoes: "",
          dias: [],
          repeticao: 'none'
        });
        setTimeFieldTouched(prev => ({ ...prev, atividade: false }));
        console.log('Reset atividade data');
        break;
    }
  };

  // Get compromissos by type for a day
  const getCompromissosByType = (day: Date) => {
    const compromissos = getCompromissosForDay(day);
    return {
      medicacoes: compromissos.filter(c => c.tipo === "medicacao"),
      consultas: compromissos.filter(c => c.tipo === "consulta"),
      exames: compromissos.filter(c => c.tipo === "exame"),
      atividades: compromissos.filter(c => c.tipo === "atividade")
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

  return (
    <div className="p-6 space-y-6 bg-gradient-soft min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-primary">Agenda</h1>
          <p className="text-muted-foreground">Gerencie suas consultas e exames</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-soft min-h-[44px]">
              {isMobile ? (
                <Plus className="w-4 h-4" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Agendar
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] sm:max-h-[95vh] sm:my-2">
            <DialogHeader className="sm:pt-2">
              <DialogTitle className="text-primary sm:mb-1 sm:mt-0">Adicionar compromisso</DialogTitle>
            </DialogHeader>
            
            {/* Botões de categoria em estilo chip */}
            <div className="pt-1 pb-1 sm:-mt-1">
              <div role="radiogroup" aria-labelledby="category-label" className="flex gap-2 flex-wrap">
                <span id="category-label" className="sr-only">Selecione o tipo de compromisso</span>
                
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value="consulta"
                    checked={selectedCategory === 'consulta'}
                    onChange={() => setSelectedCategory('consulta')}
                    className="sr-only"
                    aria-checked={selectedCategory === 'consulta'}
                  />
                  <div className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-full sm:min-h-[32px] min-h-[44px] text-xs sm:text-xs text-sm font-medium transition-colors
                    ${selectedCategory === 'consulta' 
                      ? 'bg-[#344E41] text-white' 
                      : 'bg-[#DAD7CD] text-[#344E41] hover:bg-[#DAD7CD]/80'
                    }
                  `}>
                    <User className="w-4 h-4" />
                    Consulta
                  </div>
                </label>
                
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value="exame"
                    checked={selectedCategory === 'exame'}
                    onChange={() => setSelectedCategory('exame')}
                    className="sr-only"
                    aria-checked={selectedCategory === 'exame'}
                  />
                  <div className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-full sm:min-h-[32px] min-h-[44px] text-xs sm:text-xs text-sm font-medium transition-colors
                    ${selectedCategory === 'exame' 
                      ? 'bg-[#344E41] text-white' 
                      : 'bg-[#DAD7CD] text-[#344E41] hover:bg-[#DAD7CD]/80'
                    }
                  `}>
                    <Stethoscope className="w-4 h-4" />
                    Exame
                  </div>
                </label>
                
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value="atividade"
                    checked={selectedCategory === 'atividade'}
                    onChange={() => setSelectedCategory('atividade')}
                    className="sr-only"
                    aria-checked={selectedCategory === 'atividade'}
                  />
                  <div className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-full sm:min-h-[32px] min-h-[44px] text-xs sm:text-xs text-sm font-medium transition-colors
                    ${selectedCategory === 'atividade' 
                      ? 'bg-[#344E41] text-white' 
                      : 'bg-[#DAD7CD] text-[#344E41] hover:bg-[#DAD7CD]/80'
                    }
                  `}>
                    <Heart className="w-4 h-4" />
                    Atividade
                  </div>
                </label>
              </div>
            </div>
            
            <div className="space-y-3 py-2 sm:pt-0">
              {/* FORMULÁRIO PARA CONSULTAS */}
              {selectedCategory === 'consulta' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="especialidade">Especialidade</Label>
                    <Input 
                      id="especialidade"
                      value={consultaData.especialidade}
                      onChange={(e) => updateCurrentCategoryData('especialidade', e.target.value)}
                      placeholder="Ex.: Cardiologia"
                      className="h-10 font-normal placeholder:text-muted-foreground/50" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profissional">Profissional</Label>
                    <Input 
                      id="profissional"
                      value={consultaData.profissional}
                      onChange={(e) => updateCurrentCategoryData('profissional', e.target.value)}
                      placeholder="Ex.: Dr. João Silva"
                      className="h-10 font-normal placeholder:text-muted-foreground/50" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="local">Local</Label>
                    <Input 
                      id="local"
                      value={consultaData.local}
                      onChange={(e) => updateCurrentCategoryData('local', e.target.value)}
                      placeholder="Ex.: Clínica Boa Saúde"
                      className="h-10 font-normal placeholder:text-muted-foreground/50" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="data">Data</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                             className={cn(
                               "w-full justify-start text-left font-normal h-10 text-base md:text-sm",
                               !consultaData.date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {consultaData.date ? format(consultaData.date, "dd/MM/yy", { locale: ptBR }) : <span className="text-muted-foreground/50 font-normal text-base md:text-sm">20/08/25</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={consultaData.date}
                            onSelect={(date) => updateCurrentCategoryData('date', date)}
                            initialFocus
                            locale={ptBR}
                            weekStartsOn={1}
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                     <div className="space-y-2">
                       <Label htmlFor="hora">Hora</Label>
                           <Input
                            id="hora"
                            type="time"
                            value={consultaData.time}
                            onChange={(e) => {
                              const value = e.target.value;
                              updateCurrentCategoryData('time', value);
                              setTimeFieldTouched(prev => ({ ...prev, consulta: value !== "00:00" }));
                            }}
                             onInput={(e) => {
                               // Captura evento quando usuário clica em "Redefinir" no time picker
                               const value = (e.target as HTMLInputElement).value;
                               console.log('onInput triggered - value:', value);
                               console.log('consultaData.time before:', consultaData.time);
                               if (value === "00:00") {
                                 console.log('Redefinir detectado! Resetando...');
                                 // Força atualização do estado e visual do campo
                                 setConsultaData(prev => ({ ...prev, time: "00:00" }));
                                 setTimeFieldTouched(prev => ({ ...prev, consulta: false }));
                               }
                             }}
                            className={`w-full ${consultaData.time === "00:00" && !timeFieldTouched.consulta 
                              ? 'text-muted-foreground/50' 
                              : ''}`}
                            placeholder="Selecionar horário"
                            style={{
                              WebkitAppearance: 'none',
                              MozAppearance: 'textfield'
                            }}
                          />
                     </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea 
                      id="observacoes"
                      value={consultaData.observacoes}
                      onChange={(e) => updateCurrentCategoryData('observacoes', e.target.value)}
                      placeholder="Ex.: Levar resultados / Roupas confortáveis"
                      className="placeholder:text-muted-foreground/50 sm:h-8 sm:py-1" 
                      rows={2} 
                    />
                  </div>
                </>
              )}

              {/* FORMULÁRIO PARA EXAMES */}
              {selectedCategory === 'exame' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tipoExame">Tipo de Exame</Label>
                    <Input 
                      id="tipoExame"
                      value={exameData.tipoExame}
                      onChange={(e) => updateCurrentCategoryData('tipoExame', e.target.value)}
                      placeholder="Ex.: Hemograma"
                      className="h-10 font-normal placeholder:text-muted-foreground/50" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preparos">Preparos</Label>
                    <Input 
                      id="preparos"
                      value={exameData.preparos}
                      onChange={(e) => updateCurrentCategoryData('preparos', e.target.value)}
                      placeholder="Ex.: Jejum 8h"
                      className="h-10 font-normal placeholder:text-muted-foreground/50" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="local">Local</Label>
                    <Input 
                      id="local"
                      value={exameData.local}
                      onChange={(e) => updateCurrentCategoryData('local', e.target.value)}
                      placeholder="Ex.: Clínica Boa Saúde"
                      className="h-10 font-normal placeholder:text-muted-foreground/50" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="data">Data</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                             className={cn(
                               "w-full justify-start text-left font-normal h-10 text-base md:text-sm",
                               !exameData.date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {exameData.date ? format(exameData.date, "dd/MM/yy", { locale: ptBR }) : <span className="text-muted-foreground/50 font-normal text-base md:text-sm">20/08/25</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={exameData.date}
                            onSelect={(date) => updateCurrentCategoryData('date', date)}
                            initialFocus
                            locale={ptBR}
                            weekStartsOn={1}
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hora">Hora</Label>
                          <Input
                            id="hora"
                            type="time"
                            value={exameData.time}
                            onChange={(e) => {
                              const value = e.target.value;
                              updateCurrentCategoryData('time', value);
                              setTimeFieldTouched(prev => ({ ...prev, exame: value !== "00:00" }));
                            }}
                            onInput={(e) => {
                              // Captura evento quando usuário clica em "Redefinir" no time picker
                              const value = (e.target as HTMLInputElement).value;
                              if (value === "00:00") {
                                // Força atualização do estado e visual do campo
                                setExameData(prev => ({ ...prev, time: "00:00" }));
                                setTimeFieldTouched(prev => ({ ...prev, exame: false }));
                              }
                            }}
                           className={`w-full ${exameData.time === "00:00" && !timeFieldTouched.exame 
                             ? 'text-muted-foreground/50' 
                             : ''}`}
                           placeholder="Selecionar horário"
                           style={{
                             WebkitAppearance: 'none',
                             MozAppearance: 'textfield'
                           }}
                         />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea 
                      id="observacoes"
                      value={exameData.observacoes}
                      onChange={(e) => updateCurrentCategoryData('observacoes', e.target.value)}
                      placeholder="Ex.: Levar resultados / Roupas confortáveis"
                      className="placeholder:text-muted-foreground/50 sm:h-8 sm:py-1" 
                      rows={2} 
                    />
                  </div>
                </>
              )}

              {/* FORMULÁRIO PARA ATIVIDADES */}
              {selectedCategory === 'atividade' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tipoAtividade">Tipo de Atividade</Label>
                    <Input 
                      id="tipoAtividade"
                      value={atividadeData.tipoAtividade}
                      onChange={(e) => updateCurrentCategoryData('tipoAtividade', e.target.value)}
                      placeholder="Ex.: Fisioterapia / Pilates / Caminhada"
                      className="h-10 font-normal placeholder:text-muted-foreground/50" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="local">Local</Label>
                      <Input 
                        id="local"
                        value={atividadeData.local}
                        onChange={(e) => updateCurrentCategoryData('local', e.target.value)}
                        placeholder="Ex.: Clínica Boa Saúde"
                        className="h-10 font-normal placeholder:text-muted-foreground/50" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duracao">Duração</Label>
                      <Input 
                        id="duracao"
                        value={atividadeData.duracao}
                        onChange={(e) => updateCurrentCategoryData('duracao', e.target.value)}
                        placeholder="Ex.: 45 min"
                        className="h-10 font-normal placeholder:text-muted-foreground/50" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="data">Data</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                             className={cn(
                               "w-full justify-start text-left font-normal h-10 text-base md:text-sm",
                               !atividadeData.date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {atividadeData.date ? format(atividadeData.date, "dd/MM/yy", { locale: ptBR }) : <span className="text-muted-foreground/50 font-normal text-base md:text-sm">20/08/25</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={atividadeData.date}
                            onSelect={(date) => updateCurrentCategoryData('date', date)}
                            initialFocus
                            locale={ptBR}
                            weekStartsOn={1}
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hora">Hora</Label>
                         <Input
                           id="hora"
                           type="time"
                           value={atividadeData.time}
                           onChange={(e) => {
                             const value = e.target.value;
                             updateCurrentCategoryData('time', value);
                             setTimeFieldTouched(prev => ({ ...prev, atividade: value !== "00:00" }));
                           }}
                            onInput={(e) => {
                              // Captura evento quando usuário clica em "Redefinir" no time picker
                              const value = (e.target as HTMLInputElement).value;
                              if (value === "00:00") {
                                // Força atualização do estado e visual do campo
                                setAtividadeData(prev => ({ ...prev, time: "00:00" }));
                                setTimeFieldTouched(prev => ({ ...prev, atividade: false }));
                              }
                            }}
                           className={`w-full ${atividadeData.time === "00:00" && !timeFieldTouched.atividade 
                             ? 'text-muted-foreground/50' 
                             : ''}`}
                           placeholder="Selecionar horário"
                           style={{
                             WebkitAppearance: 'none',
                             MozAppearance: 'textfield'
                           }}
                         />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Dias da semana</Label>
                      <div role="group" aria-labelledby="dias-semana-label" className="space-y-2">
                        <div className="flex justify-between gap-1">
                          {[
                            { short: 'Seg', full: 'Segunda' },
                            { short: 'Ter', full: 'Terça' },
                            { short: 'Qua', full: 'Quarta' },
                            { short: 'Qui', full: 'Quinta' },
                            { short: 'Sex', full: 'Sexta' },
                            { short: 'Sáb', full: 'Sábado' },
                            { short: 'Dom', full: 'Domingo' }
                          ].map((day) => (
                            <label key={day.short} className="flex flex-col items-center space-y-1 cursor-pointer min-h-[44px] sm:min-h-[32px]">
                              <span className="text-xs text-foreground font-medium">{day.short}</span>
                              <Checkbox 
                                checked={atividadeData.dias.includes(day.short)}
                                onCheckedChange={(checked) => {
                                  const newDias = checked 
                                    ? [...atividadeData.dias, day.short]
                                    : atividadeData.dias.filter(d => d !== day.short);
                                  updateCurrentCategoryData('dias', newDias);
                                }}
                                className="data-[state=checked]:bg-[#344E41] data-[state=checked]:border-[#344E41]"
                              />
                            </label>
                          ))}
                        </div>
                        {atividadeData.repeticao === 'weekly' && atividadeData.dias.length === 0 && (
                          <p className="text-xs text-destructive" role="alert" aria-live="polite">
                            Selecione ao menos um dia
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="repeticao">Repetição</Label>
                      <Select 
                        value={atividadeData.repeticao} 
                        onValueChange={(value: 'weekly' | 'none') => updateCurrentCategoryData('repeticao', value)}
                      >
                        <SelectTrigger className="min-h-[44px] sm:min-h-[32px]">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border shadow-lg z-50">
                          <SelectItem value="weekly">Toda semana</SelectItem>
                          <SelectItem value="none">Não se repete</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea 
                      id="observacoes"
                      value={atividadeData.observacoes}
                      onChange={(e) => updateCurrentCategoryData('observacoes', e.target.value)}
                      placeholder="Ex.: Roupas confortáveis"
                      className="placeholder:text-muted-foreground/50 sm:h-8 sm:py-1" 
                      rows={2} 
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-between sm:pb-2 sm:pt-0">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleDialogClose(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="bg-gradient-primary hover:bg-primary-hover"
                  disabled={selectedCategory === 'atividade' && atividadeData.repeticao === 'weekly' && atividadeData.dias.length === 0}
                >
                  Salvar
                </Button>
              </div>
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
              <Input 
                placeholder="Buscar por especialidade ou médico..." 
                className="pl-10" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
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
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
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
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {allCalendarDays.map((day, index) => {
              const compromissosByType = getCompromissosByType(day);
              const totalCompromissos = getCompromissosForDay(day).length;
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div 
                  key={index} 
                  onClick={() => handleDayClick(day)} 
                  className={`
                    min-h-[80px] p-1 border border-border/20 rounded-md transition-colors cursor-pointer
                    ${isCurrentMonth ? 'bg-card' : 'bg-muted/30'}
                    ${isToday ? 'ring-2 ring-primary/50' : ''}
                    ${totalCompromissos > 0 ? 'hover:bg-accent/20' : 'hover:bg-accent/10'}
                  `}
                >
                  <div className={`text-sm ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'} ${isToday ? 'font-bold text-primary' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  
                  {/* Indicadores visuais por tipo de compromisso */}
                  {totalCompromissos > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {/* Ícone de Medicações */}
                      {compromissosByType.medicacoes.length > 0 && (
                        <div className="flex items-center gap-1 bg-success/20 text-success px-1 py-0.5 rounded text-xs">
                          <Pill className="w-3 h-3" />
                          <span>{compromissosByType.medicacoes.length}</span>
                        </div>
                      )}
                      
                      {/* Ícone de Consultas */}
                      {compromissosByType.consultas.length > 0 && (
                        <div className="flex items-center gap-1 bg-primary/20 text-primary px-1 py-0.5 rounded text-xs">
                          <User className="w-3 h-3" />
                          <span>{compromissosByType.consultas.length}</span>
                        </div>
                      )}
                      
                      {/* Ícone de Exames */}
                      {compromissosByType.exames.length > 0 && (
                        <div className="flex items-center gap-1 bg-accent/30 text-accent-foreground px-1 py-0.5 rounded text-xs">
                          <Stethoscope className="w-3 h-3" />
                          <span>{compromissosByType.exames.length}</span>
                        </div>
                      )}
                      
                      {/* Ícone de Atividades */}
                      {compromissosByType.atividades.length > 0 && (
                        <div className="flex items-center gap-1 bg-success/30 text-success px-1 py-0.5 rounded text-xs">
                          <Heart className="w-3 h-3" />
                          <span>{compromissosByType.atividades.length}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Compromissos do Dia */}
      <CompromissosModal isOpen={isDayModalOpen} onClose={() => setIsDayModalOpen(false)} />
    </div>
  );
};

export default Agenda;