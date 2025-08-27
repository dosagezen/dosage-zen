import { useState, useRef, useEffect } from "react";
import { User, Stethoscope, Heart, CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Compromisso {
  id: number;
  tipo?: 'consulta' | 'exame' | 'atividade';
  especialidade?: string;
  medico?: string;
  profissional?: string;
  tipoExame?: string;
  preparos?: string;
  nome?: string;
  tipoAtividade?: string;
  local: string;
  data?: string;
  hora: string;
  duracao?: string;
  observacoes?: string;
  dias?: string[];
  repeticao?: string;
  status: string;
}

interface EditarCompromissoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  compromisso: any | null;  // Aceita qualquer tipo de compromisso
  onSave?: (compromisso: any) => void;
}

const EditarCompromissoDialog = ({ isOpen, onClose, compromisso, onSave }: EditarCompromissoDialogProps) => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<'consulta' | 'exame' | 'atividade'>('consulta');
  
  // Estados específicos para cada categoria
  const [consultaData, setConsultaData] = useState({
    date: undefined as Date | undefined,
    time: "",
    especialidade: "",
    profissional: "",
    local: "",
    observacoes: ""
  });
  
  const [exameData, setExameData] = useState({
    date: undefined as Date | undefined,
    time: "",
    tipoExame: "",
    preparos: "",
    local: "",
    observacoes: ""
  });
  
  const [atividadeData, setAtividadeData] = useState({
    date: undefined as Date | undefined,
    time: "",
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

  // Refs para forçar reset visual dos inputs
  const consultaTimeRef = useRef<HTMLInputElement>(null);
  const exameTimeRef = useRef<HTMLInputElement>(null);
  const atividadeTimeRef = useRef<HTMLInputElement>(null);

  // Estados para forçar recriação dos inputs
  const [inputKeys, setInputKeys] = useState({
    consulta: 'consulta-0',
    exame: 'exame-0', 
    atividade: 'atividade-0'
  });

  // Carregar dados do compromisso quando o dialog abre
  useEffect(() => {
    if (isOpen && compromisso) {
      // Determinar o tipo baseado nas propriedades disponíveis
      let tipo: 'consulta' | 'exame' | 'atividade' = 'consulta';
      if (compromisso.tipoExame || (compromisso.tipo && compromisso.tipo === 'exame')) {
        tipo = 'exame';
      } else if (compromisso.duracao || (compromisso.tipo && compromisso.tipo === 'atividade')) {
        tipo = 'atividade';
      } else if (compromisso.especialidade || compromisso.profissional || (compromisso.tipo && compromisso.tipo === 'consulta')) {
        tipo = 'consulta';
      }
      
      setSelectedCategory(tipo);
      const date = compromisso.data ? new Date(compromisso.data) : new Date();
      
      if (tipo === 'consulta') {
        setConsultaData({
          date,
          time: compromisso.hora,
          especialidade: compromisso.especialidade || '',
          profissional: compromisso.medico || compromisso.profissional || '',
          local: compromisso.local,
          observacoes: compromisso.observacoes || ''
        });
        setTimeFieldTouched(prev => ({ ...prev, consulta: true }));
      } else if (tipo === 'exame') {
        setExameData({
          date,
          time: compromisso.hora,
          tipoExame: compromisso.tipoExame || '',
          preparos: compromisso.preparos || '',
          local: compromisso.local,
          observacoes: compromisso.observacoes || ''
        });
        setTimeFieldTouched(prev => ({ ...prev, exame: true }));
      } else if (tipo === 'atividade') {
        setAtividadeData({
          date,
          time: compromisso.hora,
          tipoAtividade: compromisso.nome || compromisso.tipoAtividade || '',
          local: compromisso.local,
          duracao: compromisso.duracao || '',
          observacoes: compromisso.observacoes || '',
          dias: compromisso.dias || [],
          repeticao: compromisso.repeticao === 'Toda semana' ? 'weekly' : 'none'
        });
        setTimeFieldTouched(prev => ({ ...prev, atividade: true }));
      }
    }
  }, [isOpen, compromisso]);

  // Solução simples para reset do time picker
  const handleTimeChange = (category: 'consulta' | 'exame' | 'atividade', value: string) => {
    if (category === 'consulta') {
      setConsultaData(prev => ({ ...prev, time: value }));
    } else if (category === 'exame') {
      setExameData(prev => ({ ...prev, time: value }));
    } else if (category === 'atividade') {
      setAtividadeData(prev => ({ ...prev, time: value }));
    }
    
    setTimeFieldTouched(prev => ({ ...prev, [category]: value !== "" }));
  };

  // Função para resetar campo de hora específico
  const resetTimeField = (category: 'consulta' | 'exame' | 'atividade') => {
    if (category === 'consulta') {
      setConsultaData(prev => ({ ...prev, time: "" }));
    } else if (category === 'exame') {
      setExameData(prev => ({ ...prev, time: "" }));
    } else if (category === 'atividade') {
      setAtividadeData(prev => ({ ...prev, time: "" }));
    }
    
    setTimeFieldTouched(prev => ({ ...prev, [category]: false }));
    
    // Força recriação do input
    setInputKeys(prev => ({ ...prev, [category]: `${category}-${Date.now()}` }));
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

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset form values when dialog closes
      setConsultaData({
        date: undefined,
        time: "",
        especialidade: "",
        profissional: "",
        local: "",
        observacoes: ""
      });
      setExameData({
        date: undefined,
        time: "",
        tipoExame: "",
        preparos: "",
        local: "",
        observacoes: ""
      });
      setAtividadeData({
        date: undefined,
        time: "",
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

  const handleSave = () => {
    if (!compromisso) return;

    const currentData = getCurrentCategoryData();
    const updatedCompromisso: Compromisso = {
      ...compromisso,
      tipo: selectedCategory,
      data: currentData.date ? format(currentData.date, 'yyyy-MM-dd') : compromisso.data || format(new Date(), 'yyyy-MM-dd'),
      hora: currentData.time,
      local: currentData.local,
      observacoes: currentData.observacoes || '',
    };

    if (selectedCategory === 'consulta') {
      updatedCompromisso.especialidade = consultaData.especialidade;
      updatedCompromisso.profissional = consultaData.profissional;
    } else if (selectedCategory === 'exame') {
      updatedCompromisso.tipoExame = exameData.tipoExame;
      updatedCompromisso.preparos = exameData.preparos;
    } else if (selectedCategory === 'atividade') {
      updatedCompromisso.nome = atividadeData.tipoAtividade;
      updatedCompromisso.duracao = atividadeData.duracao;
      updatedCompromisso.dias = atividadeData.dias;
      updatedCompromisso.repeticao = atividadeData.repeticao === 'weekly' ? 'Toda semana' : 'Não se repete';
    }

    onSave?.(updatedCompromisso);
    
    toast({
      title: "Compromisso atualizado",
      description: "As alterações foram salvas com sucesso.",
    });

    handleDialogClose(false);
  };

  if (!compromisso) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[500px] sm:max-h-[95vh] sm:my-2">
        <DialogHeader className="sm:pt-2">
          <DialogTitle className="text-primary sm:mb-1 sm:mt-0">Editar compromisso</DialogTitle>
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
                    <div className="flex gap-2">
                      <div className={`relative flex-1 time-input-container ${consultaData.time ? 'has-value' : ''}`}>
                            <Input
                             key={inputKeys.consulta}
                             ref={consultaTimeRef}
                             id="hora"
                             type="time"
                             value={consultaData.time}
                             onChange={(e) => handleTimeChange('consulta', e.target.value)}
                             className={`w-full ${!consultaData.time || consultaData.time === ""
                               ? 'text-muted-foreground/50' 
                               : ''}`}
                             style={{
                               WebkitAppearance: 'none',
                               MozAppearance: 'textfield'
                             }}
                           />
                      </div>
                          {consultaData.time && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => resetTimeField('consulta')}
                              className="px-2"
                            >
                              ✕
                            </Button>
                          )}
                    </div>
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
                   <div className="flex gap-2">
                     <div className={`relative flex-1 time-input-container ${exameData.time ? 'has-value' : ''}`}>
                       <Input
                          key={inputKeys.exame}
                          ref={exameTimeRef}
                          type="time"
                          value={exameData.time}
                          onChange={(e) => handleTimeChange('exame', e.target.value)}
                          className={`w-full ${!exameData.time || exameData.time === ""
                            ? 'text-muted-foreground/50' 
                            : ''}`}
                          style={{
                            WebkitAppearance: 'none',
                            MozAppearance: 'textfield'
                          }}
                        />
                     </div>
                        {exameData.time && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => resetTimeField('exame')}
                            className="px-2"
                          >
                            ✕
                          </Button>
                        )}
                    </div>
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
                   <div className="flex gap-2">
                     <div className={`relative flex-1 time-input-container ${atividadeData.time ? 'has-value' : ''}`}>
                       <Input
                          key={inputKeys.atividade}
                          ref={atividadeTimeRef}
                          type="time"
                          value={atividadeData.time}
                          onChange={(e) => handleTimeChange('atividade', e.target.value)}
                          className={`w-full ${!atividadeData.time || atividadeData.time === ""
                            ? 'text-muted-foreground/50' 
                            : ''}`}
                          style={{
                            WebkitAppearance: 'none',
                            MozAppearance: 'textfield'
                          }}
                        />
                     </div>
                        {atividadeData.time && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => resetTimeField('atividade')}
                            className="px-2"
                          >
                            ✕
                          </Button>
                        )}
                    </div>
                   </div>
              </div>

              {/* Dias da semana e Repetição */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Dias da Semana</Label>
                  <div className="space-y-1">
                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map(dia => (
                      <div key={dia} className="flex items-center space-x-2">
                        <Checkbox 
                          id={dia}
                          checked={atividadeData.dias.includes(dia)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setAtividadeData(prev => ({
                                ...prev,
                                dias: [...prev.dias, dia]
                              }));
                            } else {
                              setAtividadeData(prev => ({
                                ...prev,
                                dias: prev.dias.filter(d => d !== dia)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={dia} className="text-sm">{dia}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repeticao">Repetição</Label>
                  <Select 
                    value={atividadeData.repeticao} 
                    onValueChange={(value: 'weekly' | 'none') => updateCurrentCategoryData('repeticao', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
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
                  placeholder="Ex.: Levar resultados / Roupas confortáveis"
                  className="placeholder:text-muted-foreground/50 sm:h-8 sm:py-1" 
                  rows={2} 
                />
              </div>
            </>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end sm:pt-2">
          <Button
            variant="outline"
            onClick={() => handleDialogClose(false)}
            className="min-h-[44px] sm:min-h-[36px] order-2 sm:order-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-soft min-h-[44px] sm:min-h-[36px] order-1 sm:order-2"
          >
            Salvar alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditarCompromissoDialog;