import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { Pill, Clock, Search, Check, Filter, Undo2, ChevronDown, ChevronUp, Trash2, Plus, Loader2, AlertCircle, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import AddMedicationDialog from "@/components/AddMedicationDialog"
import SwipeableMedicationCard from "@/components/SwipeableMedicationCard"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useMedications, type Medication } from "@/hooks/useMedications"
import { formatTime24h, cn } from "@/lib/utils"

// Tipos para sistema de horários
interface HorarioStatus {
  hora: string;
  status: 'pendente' | 'concluido' | 'excluido';
  occurrence_id?: string;
  scheduled_at?: string;
  completed_at?: string;
  onTime?: boolean;
}

interface MedicacaoCompleta {
  id: string;
  nome: string;
  dosagem: string;
  forma: string;
  frequencia: string;
  horarios: HorarioStatus[];
  proximaDose: string;
  estoque: number;
  status: "ativa" | "inativa";
  removed_from_today?: boolean;
  proxima?: string;
  isOptimistic?: boolean; // Flag for optimistic updates
  data_inicio?: string;
  data_fim?: string;
  horaInicio?: string;
  has_today?: boolean;
  has_pending_today?: boolean;
  occurrencesToday?: Array<{
    id: string;
    time: string;
    status: 'pendente' | 'concluido' | 'excluido';
    scheduledAtLocal?: string;
  }>;
}

interface UndoAction {
  medicacaoId: string;
  horario: string;
  timestamp: number;
}

const Medicacoes = () => {
  // ALL HOOKS MUST BE AT THE TOP LEVEL - FIX FOR REACT HOOKS CONDITIONAL RENDERING ISSUE
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [editingMedication, setEditingMedication] = useState<MedicacaoCompleta | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [medicacoesList, setMedicacoesList] = useState<MedicacaoCompleta[]>([])
  const [activeFilter, setActiveFilter] = useState("hoje")
  const [lastUndoAction, setLastUndoAction] = useState<UndoAction | null>(null)
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false)
  const [modalOrigin, setModalOrigin] = useState<string | null>(null)
  
  // Integração com dados reais do Supabase
  const { 
    medications, 
    isLoading, 
    isSuccess,
    error, 
    createMedication, 
    updateMedication, 
    deleteMedication,
    markOccurrence,
    markNearestOccurrence,
    restoreCard,
    isCreating,
    isUpdating,
    isDeleting,
    isMarkingNearest,
    isRestoringCard,
    isFetching
  } = useMedications({
    onCreateSuccess: () => {
      setIsEditDialogOpen(false);
    },
    onUpdateSuccess: () => {
      setIsEditDialogOpen(false);
      setEditingMedication(null);
    },
    onDeleteSuccess: () => {
      setIsEditDialogOpen(false);
      setEditingMedication(null);
    }
  });
  
  // Debug logging for mobile issues
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Medicacoes component mounted', {
        isMobile,
        userAgent: navigator.userAgent,
        windowSize: { width: window.innerWidth, height: window.innerHeight },
        timestamp: new Date().toISOString()
      })
    }
  }, [isMobile])

  // Converter dados do Supabase para formato da interface com validação robusta
  const convertToMedicacaoCompleta = (med: Medication): MedicacaoCompleta | null => {
    try {
      // Validação básica da estrutura do objeto
      if (!med || typeof med !== 'object') {
        console.error('Invalid medication object:', med);
        return null;
      }

      // Validação do ID como string (UUID)
      if (!med.id || typeof med.id !== 'string') {
        console.error('Invalid medication ID:', med.id, 'for medication:', med.nome);
        return null;
      }

      // Validação de campos obrigatórios
      if (!med.nome || typeof med.nome !== 'string') {
        console.error('Invalid medication name:', med.nome, 'for ID:', med.id);
        return null;
      }

      if (!med.dosagem || typeof med.dosagem !== 'string') {
        console.error('Invalid medication dosage:', med.dosagem, 'for:', med.nome);
        return null;
      }

      // Processar horários com validação - garantir que todos os horários sejam incluídos
      const horarios = Array.isArray(med.horarios) ? med.horarios : [];
      const horariosStatus: HorarioStatus[] = horarios
        .filter(horario => {
          // Se for string (formato antigo), converter
          if (typeof horario === 'string') return true;
          // Se for objeto, validar estrutura
          return horario && typeof horario === 'object' && horario.hora;
        })
        .map(horario => {
          if (typeof horario === 'string') {
            return {
              hora: horario,
              status: 'pendente' as const
            };
          }
          // Calcular onTime quando possível com base em scheduled_at e completed_at
          const scheduledAt = horario.scheduled_at ? new Date(horario.scheduled_at).getTime() : undefined;
          const completedAt = horario.completed_at ? new Date(horario.completed_at).getTime() : undefined;
          const deltaMinutes = (scheduledAt !== undefined && completedAt !== undefined)
            ? Math.abs((completedAt - scheduledAt) / (1000 * 60))
            : undefined;
          const onTimeComputed = horario.status === 'concluido' && deltaMinutes !== undefined && deltaMinutes <= 5;
          return {
            hora: horario.hora,
            status: horario.status || 'pendente',
            occurrence_id: horario.occurrence_id,
            scheduled_at: horario.scheduled_at,
            completed_at: horario.completed_at,
            // Preserva onTime vindo do cache local ou calcula a partir das datas
            onTime: horario.onTime ?? onTimeComputed
          };
        })
        .sort((a, b) => a.hora.localeCompare(b.hora)); // Ordenar por horário

      // Calcular próxima dose baseado no primeiro horário pendente
      const proximoHorarioPendente = horariosStatus.find(h => h.status === 'pendente');
      const proximaDoseCalculada = proximoHorarioPendente 
        ? formatTime24h(proximoHorarioPendente.hora)
        : (horariosStatus.length > 0 ? "Todos concluídos hoje" : "-");
      
      return {
        id: med.id, // Manter como string (UUID)
        nome: med.nome.trim(),
        dosagem: med.dosagem.trim(),
        forma: med.forma || '',
        frequencia: med.frequencia || '',
        horarios: horariosStatus,
        proximaDose: med.proxima ? 
          formatTime24h(new Date(med.proxima).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })) : 
          proximaDoseCalculada,
        estoque: typeof med.estoque === 'number' ? med.estoque : 0,
        status: med.ativo ? "ativa" : "inativa",
        proxima: med.proxima,
        isOptimistic: med.isOptimistic,
        data_inicio: med.data_inicio,
        data_fim: med.data_fim,
        horaInicio: horariosStatus.length > 0 ? horariosStatus[0].hora : undefined,
        has_today: (med as any).has_today,
        has_pending_today: (med as any).has_pending_today,
        occurrencesToday: (med as any).occurrencesToday
      };
    } catch (error) {
      console.error('Error converting medication:', error, 'for medication:', med);
      return null;
    }
  };


  // Atualizar lista local quando medicações do backend mudarem com segurança
  const convertedMedications = useMemo(() => {
    // Só processar se os dados estão realmente prontos
    if (!isSuccess || !medications) {
      console.log('Data not ready yet', { isSuccess, medications: !!medications })
      return []
    }
    
    // Verificar se é um array válido
    if (!Array.isArray(medications)) {
      console.log('Medications is not an array', { type: typeof medications, value: medications })
      return []
    }
    
    console.log('Converting medications', { 
      medicationsLength: medications.length,
      isSuccess,
      timestamp: new Date().toISOString()
    })
    
    if (medications.length === 0) {
      console.log('No medications found, returning empty array')
      return []
    }
    
    try {
      const converted = medications
        .filter(med => {
          // Filtrar medicações válidas com logs detalhados
          if (!med || typeof med !== 'object') {
            console.warn('Skipping invalid medication (not object):', med);
            return false;
          }
          if (!med.id) {
            console.warn('Skipping medication without ID:', med);
            return false;
          }
          if (!med.nome) {
            console.warn('Skipping medication without name:', med);
            return false;
          }
          return true;
        })
        .map(convertToMedicacaoCompleta)
        .filter((med): med is MedicacaoCompleta => {
          // Filtrar medicações que falharam na conversão
          if (med === null) {
            console.warn('Medication conversion returned null, filtering out');
            return false;
          }
          return true;
        });
      
      console.log('Successfully converted medications', { 
        originalCount: medications.length,
        validCount: medications.filter(med => med && med.id && med.nome).length,
        convertedCount: converted.length,
        firstMed: converted[0]?.nome || 'N/A',
        skippedCount: medications.length - converted.length
      })
      return converted
    } catch (error) {
      console.error('Critical error converting medications:', error, {
        medicationsType: typeof medications,
        medicationsLength: medications?.length || 0,
        sampleMedication: medications?.[0] || 'N/A'
      })
      return []
    }
  }, [medications, isSuccess])

  useEffect(() => {
    setMedicacoesList(convertedMedications)
  }, [convertedMedications])

  // Detectar parâmetro de URL para abrir modal de edição
  useEffect(() => {
    const editId = searchParams.get('edit')
    const origin = searchParams.get('origin')
    
    if (editId && !isEditDialogOpen) {
      const medicacaoToEdit = medicacoesList.find(m => m.id === editId)
      if (medicacaoToEdit) {
        setEditingMedication(medicacaoToEdit)
        setIsEditDialogOpen(true)
        setModalOrigin(origin || 'medicacoes')
      }
    }
  }, [searchParams, medicacoesList, isEditDialogOpen])

  // Loading state - mais específico para evitar renderização prematura
  if (isLoading || (!isSuccess && !error)) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando medicações...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Erro ao carregar medicações: {error.message}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Função para verificar se uma medicação tem dose hoje
  const isToday = (proximaDose: string) => {
    return !proximaDose.includes("(amanhã)") && proximaDose !== "-"
  }

  // Função para verificar se uma medicação tem todos os horários do dia checados (concluído OU cancelado)
  const isAllDosesCompleted = useCallback((medicacao: MedicacaoCompleta) => {
    const validHorarios = (medicacao.horarios || []).filter(h => h.hora && h.hora !== '-');
    return validHorarios.length > 0 && validHorarios.every(h => h.status === 'concluido');
  }, [])

  // Função para calcular próximo horário pendente
  const calculateNextDose = useCallback((horarios: HorarioStatus[]): string => {
    const pendentes = horarios
      .filter(h => h.status === 'pendente' && h.hora !== '-')
      .sort((a, b) => {
        const timeA = a.hora.split(':').map(Number)
        const timeB = b.hora.split(':').map(Number)
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1])
      })

    if (pendentes.length === 0) {
      return "Todos concluídos hoje"
    }

    return pendentes[0].hora
  }, [])

  // Função para determinar o "horário da vez" baseado no momento atual
  // Segue a estratégia: (a) hoje >= agora, (b) próximos dias, (c) hoje < agora
  const getNearestScheduledTime = useCallback((horarios: HorarioStatus[], now: Date = new Date()): HorarioStatus | null => {
    const pendingTimes = horarios.filter(h => h.status === 'pendente' && h.hora !== '-');
    
    if (pendingTimes.length === 0) return null;

    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    
    // (a) Horários pendentes hoje >= agora
    const todayFuture = pendingTimes.filter(horario => {
      const [hours, minutes] = horario.hora.split(':').map(Number);
      const timeMinutes = hours * 60 + minutes;
      return timeMinutes >= currentTimeMinutes;
    }).sort((a, b) => {
      const timeA = a.hora.split(':').map(Number);
      const timeB = b.hora.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });

    if (todayFuture.length > 0) {
      return todayFuture[0];
    }

    // (c) Fallback: horários pendentes hoje < agora (mais recente)
    const todayPast = pendingTimes.filter(horario => {
      const [hours, minutes] = horario.hora.split(':').map(Number);
      const timeMinutes = hours * 60 + minutes;
      return timeMinutes < currentTimeMinutes;
    }).sort((a, b) => {
      const timeA = a.hora.split(':').map(Number);
      const timeB = b.hora.split(':').map(Number);
      return (timeB[0] * 60 + timeB[1]) - (timeA[0] * 60 + timeA[1]); // Descendente
    });

    if (todayPast.length > 0) {
      return todayPast[0];
    }

    // (b) Se não houver horários hoje, retornar primeiro pendente (próximo dia)
    return pendingTimes[0] || null;
  }, [])

  // Função para marcar dose como concluída (usando horário da vez)
  const markDoseCompleted = useCallback((medicacaoId: string) => {
    console.log('markDoseCompleted called for:', medicacaoId);
    console.log('isMarkingNearest:', isMarkingNearest);
    
    markNearestOccurrence({ 
      medicationId: medicacaoId, 
      action: 'concluir' 
    });
  }, [markNearestOccurrence, isMarkingNearest])

  // Função para marcar dose como cancelada/excluída (usando horário da vez)
  const markDoseCanceled = useCallback((medicacaoId: string) => {
    console.log('markDoseCanceled called for:', medicacaoId);
    console.log('isMarkingNearest:', isMarkingNearest);
    
    markNearestOccurrence({ 
      medicationId: medicacaoId, 
      action: 'cancelar' 
    });
  }, [markNearestOccurrence, isMarkingNearest])

  // Função para desfazer última ação
  const handleUndo = useCallback((undoAction: UndoAction) => {
    // Encontrar a medicação e horário para desfazer
    const medicacao = medicacoesList.find(m => m.id === undoAction.medicacaoId)
    if (!medicacao) return

    const horarioAlterado = medicacao.horarios.find(h => h.hora === undoAction.horario)
    if (!horarioAlterado?.occurrence_id) return

    // Desfazer usando a API do backend
    markOccurrence({ 
      occurrence_id: horarioAlterado.occurrence_id, 
      status: 'pendente' 
    });

    // Limpar undo action e timeout
    setLastUndoAction(null)
    if (undoTimeout) {
      clearTimeout(undoTimeout)
      setUndoTimeout(null)
    }

    toast({
      title: "Ação desfeita",
      description: `Dose de ${undoAction.horario} foi desmarcada`,
    })
  }, [medicacoesList, markOccurrence, undoTimeout])

  // Handler functions for dialog operations  
  const handleEditMedication = useCallback((medicacao: MedicacaoCompleta) => {
    setEditingMedication(medicacao);
    setIsEditDialogOpen(true);
  }, []);

  const handleAddMedication = useCallback((medicationData: any) => {
    createMedication(medicationData);
  }, [createMedication]);

  const handleUpdateMedication = useCallback((medicationData: any) => {
    if (editingMedication) {
      updateMedication({ id: editingMedication.id, ...medicationData });
    }
  }, [editingMedication, updateMedication]);

  const handleDeleteMedication = useCallback((medicationId: string) => {
    deleteMedication(medicationId);
  }, [deleteMedication]);

  // Limpar timeout quando componente desmontar
  useEffect(() => {
    return () => {
      if (undoTimeout) {
        clearTimeout(undoTimeout)
      }
    }
  }, [undoTimeout])

  // Função para aplicar filtros - otimizada com useMemo e segurança
  const filteredMedicacoes = useMemo(() => {
    console.log('Filtering medications', { 
      totalMeds: medicacoesList?.length || 0, 
      activeFilter, 
      searchTerm,
      isMobile 
    })
    
    if (!medicacoesList || !Array.isArray(medicacoesList) || medicacoesList.length === 0) {
      console.log('No valid medicacoesList for filtering, returning empty array')
      return []
    }
    
    let filtered = medicacoesList
    
    try {
      switch (activeFilter) {
        case "hoje":
          filtered = medicacoesList.filter(med => {
            if (!med || med.removed_from_today) return false;
            if (med.isOptimistic) return true; // Optimistic feedback
            // Prefer backend flags, fallback to local inference
            const hasToday = (med as any).has_today ?? ((med.horarios || []).length > 0);
            return med.status === "ativa" && hasToday;
          })
          break
        case "ativas":
          filtered = medicacoesList.filter(med => 
            med && med.status === "ativa" && !med.removed_from_today
          )
          break
        case "concluidas":
          filtered = medicacoesList.filter(med => 
            med && isAllDosesCompleted(med)
          )
          break
        case "todas":
          // Show all medications (active and inactive)
          filtered = medicacoesList.filter(med => med && !med.removed_from_today)
          break
        default:
          filtered = medicacoesList.filter(med => med && !med.removed_from_today)
      }

      // Aplicar filtro de busca com segurança
      if (searchTerm && searchTerm.trim()) {
        filtered = filtered.filter(med => 
          med && med.nome && med.nome.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      console.log('Filtered medications result', { 
        originalCount: medicacoesList.length,
        filteredCount: filtered.length,
        filter: activeFilter
      })

      return filtered.sort((a, b) => {
        // Optimistic medications first for immediate visual feedback
        if (a.isOptimistic && !b.isOptimistic) return -1;
        if (!a.isOptimistic && b.isOptimistic) return 1;
        
        // Medicações pendentes primeiro
        const aCompleted = isAllDosesCompleted(a)
        const bCompleted = isAllDosesCompleted(b)
        
        if (aCompleted !== bCompleted) {
          return aCompleted ? 1 : -1
        }
        
        // Então por ordem alfabética
        return a.nome.localeCompare(b.nome)
      })
    } catch (error) {
      console.error('Erro ao filtrar medicações:', error, {
        medicacoesList: medicacoesList?.length || 0,
        activeFilter,
        searchTerm
      })
      return []
    }
  }, [medicacoesList, activeFilter, searchTerm, isMobile])

  // Separar medicações baseado no filtro ativo
  const medicacoesPendentes = useMemo(() => {
    if (activeFilter === 'ativas') {
      // For "ativas" filter, use medicacoesList directly to match the counter logic
      return medicacoesList.filter(med => med && med.status === "ativa" && !med.removed_from_today);
    }
    
    return filteredMedicacoes.filter(med => {
      if (!med) return false;
      if (activeFilter === 'hoje') {
        return !isAllDosesCompleted(med);
      } else if (activeFilter === 'todas') {
        return med.status === "ativa";
      }
      return med.status === "ativa";
    });
  }, [filteredMedicacoes, activeFilter, medicacoesList])
  
  const medicacoesConcluidas = useMemo(() => {
    if (activeFilter === 'hoje') {
      // Para o filtro "hoje", buscar diretamente na lista completa, não na filtrada
      return medicacoesList.filter(med => {
        if (!med || med.removed_from_today) return false;
        if (med.status !== "ativa") return false;
        
        // Verificar se tem doses hoje (mesmo critério do filtro "hoje")
        const hasToday = (med as any).has_today ?? ((med.horarios || []).length > 0);
        if (!hasToday) return false;
        
        // E se todas as doses de hoje estão completas
        return isAllDosesCompleted(med);
      });
    } else if (activeFilter === 'todas') {
      return filteredMedicacoes.filter(med => med && med.status === "inativa");
    }
    return []; // For "ativas" filter, no completed list
  }, [medicacoesList, filteredMedicacoes, activeFilter, isAllDosesCompleted])

  // Calculate counters based on real occurrences
  const counters = useMemo(() => {
    if (!medicacoesList?.length) return { hoje: 0, ativas: 0, todas: 0 };

    // Para o filtro "hoje", contar apenas medicações programadas (não finalizadas)
    const hoje = medicacoesList.filter(med => {
      if (!med || med.removed_from_today) return false;
      if (med.isOptimistic) return true; // count optimistic
      const hasToday = (med as any).has_today ?? ((med.horarios || []).length > 0);
      const isActive = med.status === "ativa" && hasToday;
      if (!isActive) return false;
      // Só contar se NÃO estiver com todas as doses finalizadas
      return !isAllDosesCompleted(med);
    }).length;

    const ativas = medicacoesList.filter(med => med && med.status === "ativa" && !med.removed_from_today).length;
    const todas = medicacoesList.filter(med => med && !med.removed_from_today).length;

    return { hoje, ativas, todas };
  }, [medicacoesList, isAllDosesCompleted])


  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Medicações</h1>
            <p className="text-muted-foreground">
              Gerencie suas medicações e horários
            </p>
          </div>
          <Button 
            onClick={() => setIsEditDialogOpen(true)} 
            disabled={isCreating}
            className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-soft min-h-[44px]"
            aria-label="Adicionar nova medicação"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isMobile ? (
              <Plus className="w-4 h-4" />
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex-shrink-0 p-4 bg-background/50">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Abas de filtro */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex gap-2 flex-nowrap">
              {[
                { key: "hoje", label: "Hoje", count: counters.hoje },
                { key: "ativas", label: "Ativas", count: counters.ativas },
                { key: "todas", label: "Todas", count: counters.todas }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    activeFilter === filter.key
                      ? "bg-[#344E41] text-white"
                      : "bg-[#DAD7CD] text-[#344E41] hover:bg-[#B8B5A7]"
                  }`}
                >
                  {filter.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    activeFilter === filter.key
                      ? "bg-white/20 text-white"
                      : "bg-[#344E41]/20 text-[#344E41]"
                  }`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Barra de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar medicação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {filteredMedicacoes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {(medications?.length || 0) === 0 ? "Nenhuma medicação cadastrada" : "Nenhuma medicação encontrada"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {(medications?.length || 0) === 0 
                    ? "Comece adicionando sua primeira medicação" 
                    : "Tente ajustar os filtros ou termo de busca"
                  }
                </p>
                {(medications?.length || 0) === 0 && (
                  <Button onClick={() => setIsEditDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Medicação
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {activeFilter === 'todas' ? (
                <>
                  {/* Lista de medicações Ativas */}
                  {medicacoesPendentes.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Ativas ({medicacoesPendentes.length})
                      </h3>
                       <div className="grid gap-4 mb-15">
                        {medicacoesPendentes.map((medicacao) => (
                           <SwipeableMedicationCard
                              key={medicacao.id}
                              medicacao={medicacao}
                               onComplete={(id) => markDoseCompleted(id)}
                               onRemove={(id) => markDoseCanceled(id)}
                               onEdit={(med) => handleEditMedication(med)}
                               disabled={isUpdating || isDeleting || isMarkingNearest}
                               isLoading={isMarkingNearest}
                               isProcessing={isMarkingNearest || isFetching}
                            />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lista de medicações Inativas */}
                  {medicacoesConcluidas.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-destructive" />
                        Inativas ({medicacoesConcluidas.length})
                      </h3>
                       <div className="grid gap-4 mb-15">
                        {medicacoesConcluidas.map((medicacao) => (
                           <SwipeableMedicationCard
                              key={medicacao.id}
                              medicacao={medicacao}
                               onComplete={(id) => markDoseCompleted(id)}
                               onRemove={(id) => markDoseCanceled(id)}
                               onEdit={(med) => handleEditMedication(med)}
                               disabled={isUpdating || isDeleting || isMarkingNearest}
                               isLoading={isMarkingNearest}
                               isInactive={true}
                               isProcessing={isMarkingNearest || isFetching}
                            />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Medicações Pendentes */}
                  {medicacoesPendentes.length > 0 && (
                    <div className="space-y-4">
                       <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          {activeFilter === 'hoje' ? 'Programadas' : 'Ativas'} ({medicacoesPendentes.length})
                        </h3>
                       <div className="grid gap-4 mb-15">
                        {medicacoesPendentes.map((medicacao) => (
                           <SwipeableMedicationCard
                              key={medicacao.id}
                              medicacao={medicacao}
                               onComplete={(id) => markDoseCompleted(id)}
                               onRemove={(id) => markDoseCanceled(id)}
                               onEdit={(med) => handleEditMedication(med)}
                               disabled={isUpdating || isDeleting || isMarkingNearest}
                               isLoading={isMarkingNearest}
                               isProcessing={isMarkingNearest || isFetching}
                           />
                        ))}
                      </div>
                    </div>
                  )}

                   {/* Medicações Concluídas */}
                   {medicacoesConcluidas.length > 0 && (
                     <div className="space-y-4">
                       <Button
                         variant="ghost"
                         onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                         className="flex items-center gap-2 p-0 h-auto"
                       >
                         <Check className="w-5 h-5 text-success" />
                          <h3 className="text-lg font-semibold">
                            Finalizadas hoje ({medicacoesConcluidas.length})
                          </h3>
                         {isCompletedExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                       </Button>
                       
                        {isCompletedExpanded && (
                          <div className="grid gap-4 mb-15">
                            {medicacoesConcluidas.map((medicacao) => (
                              <Card key={medicacao.id} className="opacity-75">
                                 <CardContent className="p-4">
                                   {isMobile ? (
                                     // Layout Mobile
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <Pill className="h-5 w-5 text-success" />
                                          <h3 className="font-semibold text-lg">{medicacao.nome}</h3>
                                        </div>
                                        
                                        <div className="text-sm text-muted-foreground mb-4">
                                          {medicacao.dosagem} • {medicacao.estoque} {medicacao.estoque > 1 ? medicacao.forma + 's' : medicacao.forma} • {medicacao.frequencia}
                                        </div>

                                        {/* Horários do dia */}
                                        <div className="mb-4">
                                          <div className="flex flex-wrap gap-2">
                                            {medicacao.horarios?.map((horario, index) => (
                                              <span
                                                key={index}
                                                className={cn(
                                                  "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full transition-colors",
                                                  horario.status === 'concluido' 
                                                    ? "bg-success/10 text-success line-through" 
                                                    : horario.status === 'excluido'
                                                    ? "bg-destructive/10 text-destructive line-through"
                                                    : "bg-blue-100 text-blue-800"
                                                )}
                                              >
                                                {horario.hora}{(horario.status === 'concluido' && (horario as any).onTime) ? ' —' : ''}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                        
                                        <div className="mb-4">
                                          <Badge variant="outline" className="text-success border-success">
                                            Finalizada
                                          </Badge>
                                        </div>
                                        
                                        {/* Botão Restaurar - Mobile */}
                                        <div className="flex justify-center">
                                          <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => restoreCard(medicacao.id)}
                                            disabled={isRestoringCard}
                                            className="gap-2 w-full"
                                          >
                                            <RotateCcw className="w-3 h-3" />
                                            {isRestoringCard ? 'Restaurando...' : 'Restaurar'}
                                          </Button>
                                        </div>
                                      </div>
                                   ) : (
                                     // Layout Desktop (manter atual)
                                     <div className="flex items-start justify-between">
                                       <div className="flex-1">
                                         <div className="flex items-center gap-2 mb-2">
                                           <Pill className="h-5 w-5 text-success" />
                                           <h3 className="font-semibold text-lg">{medicacao.nome}</h3>
                                            <Badge variant="outline" className="text-success border-success">
                                              Finalizada
                                            </Badge>
                                         </div>
                                         
                                         <div className="space-y-2 text-sm text-muted-foreground">
                                           <p><strong>Dosagem:</strong> {medicacao.dosagem}</p>
                                           <p><strong>Forma:</strong> {medicacao.forma}</p>
                                           <p><strong>Frequência:</strong> {medicacao.frequencia}</p>
                                         </div>

                                         {/* Horários do dia */}
                                         <div className="mt-3">
                                           <div className="flex flex-wrap gap-2">
                                             {medicacao.horarios?.map((horario, index) => (
                                               <span
                                                 key={index}
                                                   className={cn(
                                                     "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full transition-colors",
                                                     horario.status === 'concluido' 
                                                       ? "bg-success/10 text-success line-through" 
                                                       : horario.status === 'excluido'
                                                       ? "bg-destructive/10 text-destructive line-through"
                                                       : "bg-blue-100 text-blue-800"
                                                   )}
                                               >
                                                 {horario.hora}{(horario.status === 'concluido' && (horario as any).onTime) ? ' —' : ''}
                                               </span>
                                             ))}
                                           </div>
                                         </div>
                                       </div>

                                       <div className="text-right">
                                         <Button
                                           variant="outline"
                                           size="sm"
                                           onClick={() => restoreCard(medicacao.id)}
                                           disabled={isRestoringCard}
                                           className="gap-2"
                                         >
                                           <RotateCcw className="w-3 h-3" />
                                           {isRestoringCard ? 'Restaurando...' : 'Restaurar'}
                                         </Button>
                                       </div>
                                     </div>
                                   )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                     </div>
                   )}
                 </>
               )}
             </div>
          )}
        </div>
      </div>

      {/* Modal de Edição */}
      <AddMedicationDialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingMedication(null);
            setModalOrigin(null);
            // Limpar parâmetros de URL ao fechar o diálogo
            setSearchParams(prev => {
              const params = new URLSearchParams(prev)
              params.delete('edit')
              params.delete('origin')
              return params
            })
            // Se veio de outra página, garantir retorno à rota base
            if (modalOrigin && modalOrigin !== 'medicacoes') {
              navigate('/app/medicacoes', { replace: true });
            }
          }
        }}
        medication={editingMedication ? {
          id: editingMedication.id.toString(),
          nome: editingMedication.nome,
          dosagem: editingMedication.dosagem,
          forma: editingMedication.forma,
          frequencia: editingMedication.frequencia,
          horarios: editingMedication.horarios.map(h => h.hora),
          estoque: editingMedication.estoque,
          ativo: editingMedication.status === "ativa",
          patient_profile_id: "",
          created_at: "",
          updated_at: "",
          data_inicio: editingMedication.data_inicio,
          data_fim: editingMedication.data_fim,
          horaInicio: editingMedication.horaInicio
        } : null}
        isEditing={!!editingMedication}
        onDelete={editingMedication ? () => handleDeleteMedication(editingMedication.id.toString()) : undefined}
        onSave={handleAddMedication}
        onUpdate={handleUpdateMedication}
      />
    </div>
  );
}

// Memoize the component for better performance
export default memo(Medicacoes);