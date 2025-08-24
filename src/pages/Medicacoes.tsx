import { useState, useEffect, useCallback } from "react"
import { Pill, Clock, Search, Check, Filter, Undo2, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import AddMedicationDialog from "@/components/AddMedicationDialog"
import SwipeableCard from "@/components/SwipeableCard"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSearchParams, useNavigate } from "react-router-dom"

// Tipos para sistema de horários
interface HorarioStatus {
  hora: string;
  status: 'pendente' | 'concluido';
  completed_at?: string;
}

interface MedicacaoCompleta {
  id: number;
  nome: string;
  dosagem: string;
  forma: string;
  frequencia: string;
  horarios: HorarioStatus[];
  proximaDose: string;
  estoque: number;
  status: "ativa" | "inativa";
  removed_from_today?: boolean;
}

interface UndoAction {
  medicacaoId: number;
  horario: string;
  timestamp: number;
}

const Medicacoes = () => {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const medicacoes: MedicacaoCompleta[] = [
    // Medicações para hoje (ativas) - 5 medicações
    {
      id: 1,
      nome: "Atorvastatina",
      dosagem: "10 mg",
      forma: "Comprimido",
      frequencia: "1x ao dia",
      horarios: [{ hora: "08:00", status: "pendente" }],
      proximaDose: "08:00",
      estoque: 28,
      status: "ativa"
    },
    {
      id: 2,
      nome: "Metformina XR",
      dosagem: "500 mg",
      forma: "Comprimido",
      frequencia: "2x ao dia",
      horarios: [
        { hora: "08:00", status: "pendente" },
        { hora: "20:00", status: "pendente" }
      ],
      proximaDose: "08:00",
      estoque: 15,
      status: "ativa"
    },
    {
      id: 3,
      nome: "Losartana",
      dosagem: "50 mg",
      forma: "Comprimido",
      frequencia: "1x ao dia",
      horarios: [{ hora: "20:00", status: "pendente" }],
      proximaDose: "20:00",
      estoque: 5,
      status: "ativa"
    },
    {
      id: 4,
      nome: "Vitamina D3",
      dosagem: "2000 UI",
      forma: "Cápsula",
      frequencia: "1x ao dia",
      horarios: [{ hora: "12:00", status: "pendente" }],
      proximaDose: "12:00",
      estoque: 30,
      status: "ativa"
    },
    {
      id: 5,
      nome: "Ácido Acetilsalicílico",
      dosagem: "100 mg",
      forma: "Comprimido",
      frequencia: "1x ao dia",
      horarios: [{ hora: "22:00", status: "pendente" }],
      proximaDose: "22:00",
      estoque: 20,
      status: "ativa"
    },
    // Medicações ativas mas não para hoje - mais 5 para completar 10 ativas
    {
      id: 6,
      nome: "Omeprazol",
      dosagem: "20 mg",
      forma: "Cápsula",
      frequencia: "1x ao dia",
      horarios: [{ hora: "07:00", status: "pendente" }],
      proximaDose: "07:00 (amanhã)",
      estoque: 12,
      status: "ativa"
    },
    {
      id: 7,
      nome: "Sinvastatina",
      dosagem: "40 mg",
      forma: "Comprimido",
      frequencia: "1x ao dia",
      horarios: [{ hora: "21:00", status: "pendente" }],
      proximaDose: "21:00 (amanhã)",
      estoque: 22,
      status: "ativa"
    },
    {
      id: 8,
      nome: "Captopril",
      dosagem: "25 mg",
      forma: "Comprimido",
      frequencia: "3x ao dia",
      horarios: [
        { hora: "06:00", status: "pendente" },
        { hora: "14:00", status: "pendente" },
        { hora: "22:00", status: "pendente" }
      ],
      proximaDose: "06:00 (amanhã)",
      estoque: 18,
      status: "ativa"
    },
    {
      id: 9,
      nome: "Hidroclorotiazida",
      dosagem: "25 mg",
      forma: "Comprimido",
      frequencia: "1x ao dia",
      horarios: [{ hora: "08:00", status: "pendente" }],
      proximaDose: "08:00 (amanhã)",
      estoque: 14,
      status: "ativa"
    },
    {
      id: 10,
      nome: "Levotiroxina",
      dosagem: "50 mcg",
      forma: "Comprimido",
      frequencia: "1x ao dia",
      horarios: [{ hora: "06:00", status: "pendente" }],
      proximaDose: "06:00 (amanhã)",
      estoque: 25,
      status: "ativa"
    },
    // Medicações inativas
    {
      id: 11,
      nome: "Amoxicilina",
      dosagem: "500 mg",
      forma: "Cápsula",
      frequencia: "3x ao dia",
      horarios: [
        { hora: "08:00", status: "pendente" },
        { hora: "16:00", status: "pendente" },
        { hora: "00:00", status: "pendente" }
      ],
      proximaDose: "-",
      estoque: 0,
      status: "inativa"
    },
    {
      id: 12,
      nome: "Ibuprofeno",
      dosagem: "600 mg",
      forma: "Comprimido",
      frequencia: "Conforme necessário",
      horarios: [{ hora: "-", status: "pendente" }],
      proximaDose: "-",
      estoque: 8,
      status: "inativa"
    },
    {
      id: 13,
      nome: "Dipirona",
      dosagem: "500 mg",
      forma: "Comprimido",
      frequencia: "Conforme necessário",
      horarios: [{ hora: "-", status: "pendente" }],
      proximaDose: "-",
      estoque: 10,
      status: "inativa"
    },
    {
      id: 14,
      nome: "Prednisona",
      dosagem: "20 mg",
      forma: "Comprimido",
      frequencia: "1x ao dia",
      horarios: [{ hora: "08:00", status: "pendente" }],
      proximaDose: "-",
      estoque: 3,
      status: "inativa"
    },
    {
      id: 15,
      nome: "Clonazepam",
      dosagem: "2 mg",
      forma: "Comprimido",
      frequencia: "Conforme necessário",
      horarios: [{ hora: "-", status: "pendente" }],
      proximaDose: "-",
      estoque: 5,
      status: "inativa"
    }
  ]

  const [searchTerm, setSearchTerm] = useState("")
  const [editingMedication, setEditingMedication] = useState<MedicacaoCompleta | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [medicacoesList, setMedicacoesList] = useState<MedicacaoCompleta[]>(medicacoes)
  const [activeFilter, setActiveFilter] = useState("hoje")
  const [lastUndoAction, setLastUndoAction] = useState<UndoAction | null>(null)
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false)

  // Detectar parâmetro de URL para abrir modal de edição
  useEffect(() => {
    const editId = searchParams.get('edit')
    const origin = searchParams.get('origin') as 'medicacoes' | 'compromissos' | null
    
    if (editId) {
      const medicacaoToEdit = medicacoesList.find(m => m.id === parseInt(editId))
      if (medicacaoToEdit) {
        setEditingMedication(medicacaoToEdit)
        setIsEditDialogOpen(true)
        
        // Remover os parâmetros da URL mas manter a origem no estado
        const currentState = window.history.state || {}
        window.history.replaceState(
          { ...currentState, origin: origin || 'medicacoes' }, 
          '', 
          window.location.pathname
        )
        setSearchParams(new URLSearchParams())
      }
    }
  }, [searchParams, medicacoesList, setSearchParams])

  // Função para verificar se uma medicação tem dose hoje
  const isToday = (proximaDose: string) => {
    // Simulação: considera "hoje" se não contém "(amanhã)" ou "-"
    return !proximaDose.includes("(amanhã)") && proximaDose !== "-"
  }

  // Função para verificar se uma medicação tem todos os horários concluídos
  const isAllDosesCompleted = useCallback((medicacao: MedicacaoCompleta) => {
    if (medicacao.status === "inativa") return false
    if (!isToday(medicacao.proximaDose)) return false
    
    const horariosDoHoje = medicacao.horarios.filter(h => h.hora !== '-')
    return horariosDoHoje.length > 0 && horariosDoHoje.every(h => h.status === 'concluido')
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

  // Função para marcar dose como concluída
  const markDoseCompleted = useCallback((medicacaoId: number) => {
    const medicacao = medicacoesList.find(m => m.id === medicacaoId)
    if (!medicacao) return

    // Encontrar primeiro horário pendente
    const primeiroHorarioPendente = medicacao.horarios
      .filter(h => h.status === 'pendente' && h.hora !== '-')
      .sort((a, b) => {
        const timeA = a.hora.split(':').map(Number)
        const timeB = b.hora.split(':').map(Number)
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1])
      })[0]

    if (!primeiroHorarioPendente) return

    const horarioMarcado = primeiroHorarioPendente.hora

    // Atualizar medicação
    setMedicacoesList(prev => prev.map(med => {
      if (med.id === medicacaoId) {
        const novosHorarios = med.horarios.map(h => 
          h.hora === horarioMarcado && h.status === 'pendente'
            ? { ...h, status: 'concluido' as const, completed_at: new Date().toISOString() }
            : h
        )
        
        const novaProximaDose = calculateNextDose(novosHorarios)
        
        return {
          ...med,
          horarios: novosHorarios,
          proximaDose: novaProximaDose
        }
      }
      return med
    }))

    // Salvar ação para undo
    const undoAction: UndoAction = {
      medicacaoId,
      horario: horarioMarcado,
      timestamp: Date.now()
    }
    setLastUndoAction(undoAction)

    // Limpar timeout anterior se existir
    if (undoTimeout) {
      clearTimeout(undoTimeout)
    }

    // Configurar novo timeout
    const timeout = setTimeout(() => {
      setLastUndoAction(null)
    }, 5000)
    setUndoTimeout(timeout)

    // Exibir toast com opção de desfazer
    toast({
      title: `Dose de ${horarioMarcado} registrada`,
      description: "A dose foi marcada como concluída.",
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUndo(undoAction)}
          className="bg-[#344E41] text-white border-[#344E41] hover:bg-[#3A5A40]"
        >
          <Undo2 className="w-4 h-4 mr-1" />
          Desfazer
        </Button>
      ),
    })
  }, [medicacoesList, calculateNextDose, undoTimeout])

  // Função para desfazer última ação
  const handleUndo = useCallback((undoAction: UndoAction) => {
    if (undoAction.horario === 'removed') {
      // Desfazer remoção da lista
      setMedicacoesList(prev => prev.map(med => 
        med.id === undoAction.medicacaoId 
          ? { ...med, removed_from_today: false }
          : med
      ))
    } else {
      // Desfazer marcação de dose
      setMedicacoesList(prev => prev.map(med => {
        if (med.id === undoAction.medicacaoId) {
          const novosHorarios = med.horarios.map(h => 
            h.hora === undoAction.horario && h.status === 'concluido'
              ? { ...h, status: 'pendente' as const, completed_at: undefined }
              : h
          )
          
          const novaProximaDose = calculateNextDose(novosHorarios)
          
          return {
            ...med,
            horarios: novosHorarios,
            proximaDose: novaProximaDose
          }
        }
        return med
      }))
    }

    // Limpar undo action e timeout
    setLastUndoAction(null)
    if (undoTimeout) {
      clearTimeout(undoTimeout)
      setUndoTimeout(null)
    }

    const message = undoAction.horario === 'removed' 
      ? "Medicação restaurada para a lista" 
      : `Dose de ${undoAction.horario} foi desmarcada`

    toast({
      title: "Ação desfeita",
      description: message,
    })
  }, [undoTimeout, calculateNextDose])

  // Limpar timeout quando componente desmontar
  useEffect(() => {
    return () => {
      if (undoTimeout) {
        clearTimeout(undoTimeout)
      }
    }
  }, [undoTimeout])

  // Função para extrair e converter horário para comparação
  const getTimeForSorting = (proximaDose: string) => {
    if (proximaDose === "-") return 9999; // Medicações inativas vão para o final
    if (proximaDose.includes("(amanhã)")) return 2400; // Medicações de amanhã vão após as de hoje
    
    // Extrair apenas o horário (formato HH:MM)
    const timeMatch = proximaDose.match(/(\d{2}):(\d{2})/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      return hours * 60 + minutes; // Converter para minutos para facilitar comparação
    }
    
    return 9999; // Fallback para casos não previstos
  }

  // Função para obter o primeiro horário (mais cedo) de uma medicação
  const getEarliestTime = (medicacao: MedicacaoCompleta) => {
    if (medicacao.status === "inativa") return 9999;
    
    // Filtrar horários válidos e ordená-los
    const horariosValidos = medicacao.horarios
      .filter(h => h.hora !== '-')
      .map(h => {
        const timeMatch = h.hora.match(/(\d{2}):(\d{2})/);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          return hours * 60 + minutes;
        }
        return 9999;
      })
      .sort((a, b) => a - b);
    
    return horariosValidos.length > 0 ? horariosValidos[0] : 9999;
  }

  // Aplicar filtro baseado na aba selecionada
  const getFilteredMedicacoes = () => {
    let filtered = medicacoesList
    
    switch (activeFilter) {
      case "hoje":
        filtered = medicacoesList.filter(med => 
          med.status === "ativa" && isToday(med.proximaDose) && !med.removed_from_today
        )
        // Para "hoje", usar a próxima dose (comportamento atual)
        return filtered.sort((a, b) => {
          const timeA = getTimeForSorting(a.proximaDose)
          const timeB = getTimeForSorting(b.proximaDose)
          
          if (timeA === timeB) {
            return a.nome.localeCompare(b.nome)
          }
          
          return timeA - timeB
        })
        
      case "ativas":
        filtered = medicacoesList.filter(med => med.status === "ativa" && !med.removed_from_today)
        // Para "ativas", usar o primeiro horário da medicação
        return filtered.sort((a, b) => {
          const timeA = getEarliestTime(a)
          const timeB = getEarliestTime(b)
          
          if (timeA === timeB) {
            return a.nome.localeCompare(b.nome)
          }
          
          return timeA - timeB
        })
        
      case "todas":
        filtered = medicacoesList.filter(med => !med.removed_from_today)
        // Para "todas", usar o primeiro horário da medicação (ativas vêm antes das inativas)
        return filtered.sort((a, b) => {
          // Medicações ativas vêm antes das inativas
          if (a.status !== b.status) {
            return a.status === "ativa" ? -1 : 1
          }
          
          const timeA = getEarliestTime(a)
          const timeB = getEarliestTime(b)
          
          if (timeA === timeB) {
            return a.nome.localeCompare(b.nome)
          }
          
          return timeA - timeB
        })
        
      default:
        filtered = medicacoesList.filter(med => !med.removed_from_today)
        return filtered.sort((a, b) => {
          const timeA = getEarliestTime(a)
          const timeB = getEarliestTime(b)
          
          if (timeA === timeB) {
            return a.nome.localeCompare(b.nome)
          }
          
          return timeA - timeB
        })
    }
  }

  // Separar medicações em pendentes, concluídas e removidas
  const getSeparatedMedicacoes = () => {
    const allFiltered = getFilteredMedicacoes().filter(med =>
      med.nome.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    // Medicações removidas de hoje (incluindo concluídas que foram removidas)
    const removidas = medicacoesList
      .filter(med => 
        med.removed_from_today && 
        med.nome.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (activeFilter === "hoje" ? isToday(med.proximaDose) : 
         activeFilter === "ativas" ? med.status === "ativa" : true)
      )
    
    const pendentes = allFiltered.filter(med => !isAllDosesCompleted(med))
    const concluidas = allFiltered.filter(med => isAllDosesCompleted(med))
    
    // Combinar concluídas e removidas para a seção "Ver Medicações"
    const paraVerMedicacoes = [...concluidas, ...removidas]
    
    return { pendentes, concluidas: paraVerMedicacoes }
  }

  const { pendentes: filteredMedicacoes, concluidas: completedMedicacoes } = getSeparatedMedicacoes()

  const handleDeleteMedication = (medicationId: number) => {
    setMedicacoesList(prev => prev.filter(med => med.id !== medicationId))
  }

  // Função para remover medicação da lista do dia
  const handleRemoveFromToday = useCallback((medicacaoId: number) => {
    const medicacao = medicacoesList.find(m => m.id === medicacaoId)
    if (!medicacao) return

    setMedicacoesList(prev => prev.map(med => 
      med.id === medicacaoId 
        ? { ...med, removed_from_today: true }
        : med
    ))

    // Salvar ação para undo
    const undoAction: UndoAction = {
      medicacaoId,
      horario: 'removed',
      timestamp: Date.now()
    }
    setLastUndoAction(undoAction)

    // Limpar timeout anterior se existir
    if (undoTimeout) {
      clearTimeout(undoTimeout)
    }

    // Configurar novo timeout
    const timeout = setTimeout(() => {
      setLastUndoAction(null)
    }, 5000)
    setUndoTimeout(timeout)

    // Exibir toast com opção de desfazer
    toast({
      title: "Medicação removida da lista de hoje",
      description: "A medicação foi removida da lista principal.",
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUndo(undoAction)}
          className="bg-[#344E41] text-white border-[#344E41] hover:bg-[#3A5A40]"
        >
          <Undo2 className="w-4 h-4 mr-1" />
          Desfazer
        </Button>
      ),
    })
  }, [medicacoesList, undoTimeout])

  // Função para restaurar medicação da lista concluída
  const handleRestoreMedication = useCallback((medicacaoId: number) => {
    const medicacao = medicacoesList.find(m => m.id === medicacaoId)
    if (!medicacao) return

    // Resetar todos os horários para pendente e limpar flag de remoção
    setMedicacoesList(prev => prev.map(med => {
      if (med.id === medicacaoId) {
        const novosHorarios = med.horarios.map(h => ({
          ...h,
          status: 'pendente' as const,
          completed_at: undefined
        }))
        
        const novaProximaDose = calculateNextDose(novosHorarios)
        
        return {
          ...med,
          horarios: novosHorarios,
          proximaDose: novaProximaDose,
          removed_from_today: false
        }
      }
      return med
    }))

    toast({
      title: "Medicação restaurada",
      description: "A medicação foi restaurada para a lista de pendentes.",
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Undo da restauração: marcar todos horários como concluídos novamente
            setMedicacoesList(prev => prev.map(med => {
              if (med.id === medicacaoId) {
                const novosHorarios = med.horarios.map(h => ({
                  ...h,
                  status: 'concluido' as const,
                  completed_at: new Date().toISOString()
                }))
                
                return {
                  ...med,
                  horarios: novosHorarios,
                  proximaDose: "Todos concluídos hoje"
                }
              }
              return med
            }))
          }}
          className="bg-[#344E41] text-white border-[#344E41] hover:bg-[#3A5A40]"
        >
          <Undo2 className="w-4 h-4 mr-1" />
          Desfazer
        </Button>
      ),
    })
  }, [medicacoesList, calculateNextDose])

  // Debounced function para check
  const debouncedMarkDose = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (medicacaoId: number) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => markDoseCompleted(medicacaoId), 600)
      }
    })(),
    [markDoseCompleted]
  )

  return (
    <div className="p-6 space-y-6 bg-gradient-soft min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Medicações</h1>
          <p className="text-muted-foreground">Gerencie suas medicações e horários</p>
        </div>
        <AddMedicationDialog />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4 mb-4">
        <Filter className="h-5 w-5 text-muted-foreground" aria-label="Filtrar medicações" />
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList className="grid w-full grid-cols-3 h-[36px] items-center p-0 m-0">
            <TabsTrigger 
              value="hoje" 
              className="h-[36px] px-6 border-0 transition-all flex items-center justify-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-primary/10"
              aria-selected={activeFilter === "hoje"}
            >
              Hoje
            </TabsTrigger>
            <TabsTrigger 
              value="ativas" 
              className="h-[36px] px-6 border-0 transition-all flex items-center justify-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-primary/10"
              aria-selected={activeFilter === "ativas"}
            >
              Ativas
            </TabsTrigger>
            <TabsTrigger 
              value="todas" 
              className="h-[36px] px-6 border-0 transition-all flex items-center justify-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-primary/10"
              aria-selected={activeFilter === "todas"}
            >
              Todas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Busca */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar medicações..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contador de medicações */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <p className="text-sm">
          Você tem <span className="text-lg font-bold text-primary">{filteredMedicacoes.length.toString().padStart(2, '0')}</span> medicações listadas.
        </p>
      </div>

      {/* Lista de Medicações */}
      <div className="grid gap-4 w-full">
        {filteredMedicacoes.map((medicacao) => {
          // Para medicações inativas, usar card original
          if (medicacao.status === "inativa") {
            return (
              <Card 
                key={medicacao.id} 
                className="w-full shadow-card hover:shadow-floating transition-shadow duration-300 bg-red-500 border-red-500"
              >
                <CardContent className="p-4 sm:p-6 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4 sm:gap-0">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-red-600">
                        <Pill className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-white">
                          {medicacao.nome}
                        </h3>
                        <p className="text-sm sm:text-base text-red-100">
                          {medicacao.dosagem} • {medicacao.forma}
                        </p>
                        <p className="text-xs sm:text-sm text-red-100">
                          {medicacao.frequencia}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-col sm:text-right space-y-2 flex-shrink-0 w-full sm:w-auto sm:ml-4">
                      <div className="flex items-center justify-start sm:justify-end text-white">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="font-medium text-sm sm:text-base">Próxima: {medicacao.proximaDose}</span>
                      </div>
                      <div className="flex items-center justify-start sm:justify-end">
                        <Badge variant="outline" className="text-xs sm:text-sm bg-red-600 text-white border-red-400">
                          {medicacao.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-red-400/50 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4 sm:gap-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-red-100">
                          Horários programados:
                        </p>
                        <div className="flex gap-1 sm:gap-2 mt-1 flex-wrap">
                          {medicacao.horarios.map((horario, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="relative text-xs sm:text-sm transition-all duration-200 bg-red-600 text-white"
                            >
                              {horario.hora}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto justify-start sm:justify-end sm:ml-4">
                        {!isMobile && (
                          <Button 
                            variant="outline"
                            size="sm"
                            className="text-xs sm:text-sm flex-shrink-0 h-8 sm:h-9 hover:bg-[#3A5A40]/10 hover:border-[#3A5A40] hover:text-[#3A5A40]"
                            onClick={() => handleDeleteMedication(medicacao.id)}
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Excluir
                          </Button>
                        )}
                        <Button 
                          variant="secondary"
                          size="sm"
                          className="text-xs sm:text-sm flex-shrink-0 h-8 sm:h-9 bg-red-600 hover:bg-red-700 text-white border-red-400"
                        onClick={() => {
                          setEditingMedication(medicacao)
                          setIsEditDialogOpen(true)
                          // Armazenar origem quando abrir pela página medicações
                          const currentState = window.history.state || {}
                          window.history.replaceState({ ...currentState, origin: 'medicacoes' }, '', window.location.pathname)
                        }}
                        >
                          Alterar
                        </Button>
                        {!isMobile && medicacao.horarios.some(h => h.status === 'pendente' && h.hora !== '-') && (
                          <button
                            onClick={() => debouncedMarkDose(medicacao.id)}
                            className="
                              w-8 h-8 sm:w-9 sm:h-9 rounded-md border-2 transition-all duration-200 flex items-center justify-center flex-shrink-0
                              bg-transparent border-white/30 text-white/70 
                              hover:border-[#588157] hover:text-[#588157] hover:bg-[#588157]/10
                              active:scale-95 active:bg-[#588157] active:border-[#588157] active:text-white
                            "
                            aria-label="Registrar dose"
                          >
                            <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          }

          // Para medicações ativas, usar SwipeableCard
          return (
            <SwipeableCard
              key={medicacao.id}
              medicacao={medicacao}
              onComplete={markDoseCompleted}
              onRemove={handleRemoveFromToday}
                  onEdit={(med, origin) => {
                    setEditingMedication(med)
                    setIsEditDialogOpen(true)
                    // Armazenar origem quando abrir pela página medicações
                    const currentState = window.history.state || {}
                    window.history.replaceState({ ...currentState, origin: 'medicacoes' }, '', window.location.pathname)
                  }}
            />
          )
        })}
      </div>

      {/* Seção "Ver Medicações" colapsável para medicações concluídas e removidas */}
      {completedMedicacoes.length > 0 && (
        <div className="space-y-4">
          <div 
            className="flex items-center justify-start gap-2 cursor-pointer py-2 hover:bg-accent/10 rounded-lg transition-colors"
            onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
            aria-expanded={isCompletedExpanded}
            aria-label={isCompletedExpanded ? "Colapsar medicações concluídas e removidas" : "Expandir medicações concluídas e removidas"}
          >
            {isCompletedExpanded ? (
              <ChevronUp className="w-5 h-5 text-[#344E41]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#344E41]" />
            )}
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#344E41]">Ver Medicações</h2>
              <Badge variant="secondary" className="bg-[#344E41]/10 text-[#344E41]">
                {completedMedicacoes.length}
              </Badge>
            </div>
          </div>
          
          {isCompletedExpanded && (
            <div className="grid gap-4 w-full">
              {completedMedicacoes.map((medicacao) => {
                const isRemoved = medicacao.removed_from_today
                const isCompleted = isAllDosesCompleted(medicacao)
                
                return (
                  <Card 
                    key={medicacao.id} 
                    className="w-full shadow-card hover:shadow-floating transition-shadow duration-300"
                  >
                    <CardContent className="p-4 sm:p-6 w-full opacity-80">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4 sm:gap-0">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-accent opacity-60">
                            <Pill className="w-5 h-5 sm:w-6 sm:h-6 text-accent-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-primary opacity-85">
                              {medicacao.nome}
                            </h3>
                            <p className="text-sm sm:text-base text-muted-foreground opacity-85">
                              {medicacao.dosagem} • {medicacao.forma}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground opacity-85">
                              {medicacao.frequencia}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-col sm:text-right space-y-2 flex-shrink-0 w-full sm:w-auto sm:ml-4">
                          <div className="flex items-center justify-start sm:justify-end text-muted-foreground/50">
                            <Clock className="w-4 h-4 mr-1" />
                            <span className="font-medium text-sm sm:text-base">
                              {isRemoved ? "Removida da lista" : "Todos concluídos hoje"}
                            </span>
                          </div>
                          <div className="flex items-center justify-start sm:justify-end gap-2">
                            <Badge 
                              variant="outline"
                              className="text-xs sm:text-sm opacity-70"
                            >
                              {medicacao.status}
                            </Badge>
                            {isRemoved && (
                              <Badge 
                                variant="secondary"
                                className="text-xs sm:text-sm bg-orange-100 text-orange-800"
                              >
                                Removida
                              </Badge>
                            )}
                            {isCompleted && (
                              <Badge 
                                variant="secondary"
                                className="text-xs sm:text-sm bg-green-100 text-green-800"
                              >
                                Concluída
                              </Badge>
                             )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-border/50 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4 sm:gap-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Horários programados:
                            </p>
                            <div className="flex gap-1 sm:gap-2 mt-1 flex-wrap">
                              {medicacao.horarios.map((horario, index) => (
                                <Badge 
                                  key={index} 
                                  variant="secondary" 
                                  className={`
                                    relative text-xs sm:text-sm transition-all duration-200
                                    ${isCompleted 
                                      ? "bg-[#588157]/20 text-[#588157] opacity-60 line-through" 
                                      : "bg-orange-100 text-orange-800 opacity-70"
                                    }
                                  `}
                                  style={isCompleted ? {
                                    textDecoration: 'line-through',
                                    textDecorationColor: '#588157',
                                    textDecorationThickness: '2px'
                                  } : undefined}
                                  aria-label={`Dose das ${horario.hora} ${isCompleted ? 'registrada' : 'removida'}`}
                                >
                                  {horario.hora}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto justify-start sm:justify-end sm:ml-4">
                            <Button 
                              variant="outline"
                              size="sm"
                              className="text-xs sm:text-sm flex-shrink-0 h-8 sm:h-9 hover:bg-[#588157]/10 hover:border-[#588157] hover:text-[#588157]"
                              onClick={() => handleRestoreMedication(medicacao.id)}
                            >
                              Restaurar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {filteredMedicacoes.length === 0 && completedMedicacoes.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">
              {searchTerm ? "Nenhuma medicação encontrada" : "Nenhuma medicação cadastrada"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? "Tente buscar com outros termos" 
                : "Adicione sua primeira medicação para começar"
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Edição */}
      <AddMedicationDialog 
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            const origin = window.history.state?.origin
            
            console.log('Fechando modal de edição. Origem:', origin, 'isMobile:', isMobile)
            
            setIsEditDialogOpen(false)
            setEditingMedication(null)
            
            // Controle de retorno baseado na origem
            if (origin === 'compromissos' && isMobile) {
              console.log('Mobile - Voltando para Dashboard e reabrindo CompromissosModal')
              // Para mobile vindo do CompromissosModal, voltar para Dashboard e reabrir modal
              navigate('/', { replace: true })
              setTimeout(() => {
                console.log('Navegando para Dashboard com modal=compromissos')
                navigate('/?modal=compromissos', { replace: true })
              }, 150)
            } else {
              console.log('Permanecendo na página atual (Desktop ou origem medicações)')
            }
            // Se origin === 'medicacoes' ou desktop, permanece na página atual (comportamento padrão)
          }
          setIsEditDialogOpen(open)
        }}
        medication={editingMedication}
        isEditing={true}
        onDelete={handleDeleteMedication}
      />
    </div>
  )
}

export default Medicacoes