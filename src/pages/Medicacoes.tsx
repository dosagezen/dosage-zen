import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { Pill, Clock, Search, Check, Filter, Undo2, ChevronDown, ChevronUp, Trash2, Plus, Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import AddMedicationDialog from "@/components/AddMedicationDialog"
import SwipeableCard from "@/components/SwipeableCard"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useMedications, type Medication } from "@/hooks/useMedications"

// Tipos para sistema de horários
interface HorarioStatus {
  hora: string;
  status: 'pendente' | 'concluido' | 'excluido';
  occurrence_id?: string;
  scheduled_at?: string;
  completed_at?: string;
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
    isCreating,
    isUpdating,
    isDeleting,
    isMarkingNearest
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

      // Processar horários com validação - agora recebemos objetos HorarioStatus
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
          return {
            hora: horario.hora,
            status: horario.status || 'pendente',
            occurrence_id: horario.occurrence_id,
            scheduled_at: horario.scheduled_at,
            completed_at: horario.completed_at
          };
        });
      
      return {
        id: med.id, // Manter como string (UUID)
        nome: med.nome.trim(),
        dosagem: med.dosagem.trim(),
        forma: med.forma || '',
        frequencia: med.frequencia || '',
        horarios: horariosStatus,
        proximaDose: med.proxima ? 
          new Date(med.proxima).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : 
          (horariosStatus.length > 0 ? horariosStatus[0].hora : "-"),
        estoque: typeof med.estoque === 'number' ? med.estoque : 0,
        status: med.ativo ? "ativa" : "inativa",
        proxima: med.proxima,
        isOptimistic: med.isOptimistic,
        data_inicio: med.data_inicio,
        data_fim: med.data_fim,
        horaInicio: horariosStatus.length > 0 ? horariosStatus[0].hora : undefined
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
    // Only consider today's occurrences (those with occurrence_id)
    const todayHorarios = medicacao.horarios.filter(h => h.occurrence_id);
    return todayHorarios.length > 0 && todayHorarios.every(h => h.status === 'concluido' || h.status === 'excluido');
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
  const getNearestScheduledTime = useCallback((horarios: HorarioStatus[], now: Date = new Date()): HorarioStatus | null => {
    const pendingTimes = horarios.filter(h => h.status === 'pendente' && h.hora !== '-');
    
    if (pendingTimes.length === 0) return null;

    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Converter horários para minutos e adicionar informação de distância
    const timesWithDistance = pendingTimes.map(horario => {
      const [hours, minutes] = horario.hora.split(':').map(Number);
      const timeMinutes = hours * 60 + minutes;
      
      let distance;
      if (timeMinutes >= currentTimeMinutes) {
        // Horário futuro no mesmo dia
        distance = timeMinutes - currentTimeMinutes;
      } else {
        // Horário no próximo dia (24h + timeMinutes - currentTimeMinutes)
        distance = (24 * 60) + timeMinutes - currentTimeMinutes;
      }
      
      return { ...horario, timeMinutes, distance };
    });

    // Ordenar por distância (menor distância primeiro)
    timesWithDistance.sort((a, b) => a.distance - b.distance);
    
    // Retornar o horário mais próximo
    const nearest = timesWithDistance[0];
    return {
      hora: nearest.hora,
      status: nearest.status,
      occurrence_id: nearest.occurrence_id,
      scheduled_at: nearest.scheduled_at,
      completed_at: nearest.completed_at
    };
  }, [])

  // Função para marcar dose como concluída (usando horário da vez)
  const markDoseCompleted = useCallback((medicacaoId: string) => {
    markNearestOccurrence({ 
      medicationId: medicacaoId, 
      action: 'concluir' 
    });
  }, [markNearestOccurrence])

  // Função para marcar dose como cancelada/excluída (usando horário da vez)
  const markDoseCanceled = useCallback((medicacaoId: string) => {
    markNearestOccurrence({ 
      medicationId: medicacaoId, 
      action: 'cancelar' 
    });
  }, [markNearestOccurrence])

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
            // Always show optimistic medications in "hoje" for immediate feedback
            if (med.isOptimistic) return true;
            // Only show medications with pending occurrences today (with occurrence_id)
            const hasPendingToday = med.horarios.some(h => h.occurrence_id && h.status === 'pendente');
            return med.status === "ativa" && hasPendingToday;
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

  // Separar medicações concluídas das pendentes com segurança
  const medicacoesPendentes = useMemo(() => {
    return filteredMedicacoes.filter(med => med && !isAllDosesCompleted(med))
  }, [filteredMedicacoes])
  
  const medicacoesConcluidas = useMemo(() => {
    return filteredMedicacoes.filter(med => med && isAllDosesCompleted(med))
  }, [filteredMedicacoes])

  // Calculate counters based on real occurrences
  const counters = useMemo(() => {
    if (!medicacoesList?.length) return { hoje: 0, ativas: 0, todas: 0 };

    const hoje = medicacoesList.filter(med => {
      if (!med || med.removed_from_today) return false;
      // Count optimistic as "hoje"
      if (med.isOptimistic) return true;
      
      // Check if has pending doses today (real occurrences)
      const hasPendingToday = med.horarios?.some(h => h.status === 'pendente' && h.hora !== '-');
      return med.status === "ativa" && hasPendingToday;
    }).length;

    const ativas = medicacoesList.filter(med => med && med.status === "ativa" && !med.removed_from_today).length;
    const todas = medicacoesList.filter(med => med && !med.removed_from_today).length;

    return { hoje, ativas, todas };
  }, [medicacoesList])


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
              {/* Medicações Pendentes */}
              {medicacoesPendentes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Pendentes ({medicacoesPendentes.length})
                  </h3>
                  <div className="grid gap-4">
                    {medicacoesPendentes.map((medicacao) => (
                      <SwipeableCard
                        key={medicacao.id}
                        medicacao={medicacao}
                         onComplete={(id) => markDoseCompleted(id)}
                         onRemove={(id) => markDoseCanceled(id)}
                         onEdit={(med) => handleEditMedication(med)}
                         disabled={isUpdating || isDeleting || isMarkingNearest}
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
                    <Check className="w-5 h-5 text-green-600" />
                     <h3 className="text-lg font-semibold">
                       Finalizadas hoje ({medicacoesConcluidas.length})
                     </h3>
                    {isCompletedExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  
                  {isCompletedExpanded && (
                    <div className="grid gap-4">
                      {medicacoesConcluidas.map((medicacao) => (
                        <Card key={medicacao.id} className="opacity-75">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Pill className="h-5 w-5 text-green-600" />
                                  <h3 className="font-semibold text-lg">{medicacao.nome}</h3>
                                   <Badge variant="outline" className="text-green-600 border-green-600">
                                     Finalizada
                                   </Badge>
                                </div>
                                
                                <div className="space-y-2 text-sm text-muted-foreground">
                                  <p><strong>Dosagem:</strong> {medicacao.dosagem}</p>
                                  <p><strong>Forma:</strong> {medicacao.forma}</p>
                                  <p><strong>Frequência:</strong> {medicacao.frequencia}</p>
                                </div>
                              </div>

                              <div className="text-right">
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
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
          updated_at: ""
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