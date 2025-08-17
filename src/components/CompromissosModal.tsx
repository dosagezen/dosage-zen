import React, { useState, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Calendar, Clock, Pill, User, Stethoscope, MapPin, ChevronDown, ChevronUp, Undo2 } from "lucide-react"
import SwipeableCard from './SwipeableCard'

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
  removal_reason?: 'completed' | 'excluded';
}

interface UndoAction {
  medicacaoId: number;
  action: 'complete' | 'remove';
  timestamp: number;
  previousData?: Partial<MedicacaoCompleta>;
}

interface CompromissosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CompromissosModal: React.FC<CompromissosModalProps> = ({ isOpen, onClose }) => {
  // Dados mockados expandidos para o modal
  const initialMedicacoes: MedicacaoCompleta[] = [
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
      nome: "Metformina",
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
      nome: "Vitamina D",
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
      nome: "Ômega 3",
      dosagem: "1000 mg",
      forma: "Cápsula",
      frequencia: "1x ao dia",
      horarios: [{ hora: "19:00", status: "pendente" }],
      proximaDose: "19:00",
      estoque: 20,
      status: "ativa"
    }
  ]

  const [medicacoesList, setMedicacoesList] = useState<MedicacaoCompleta[]>(initialMedicacoes)
  const [lastUndoAction, setLastUndoAction] = useState<UndoAction | null>(null)
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isRemovedExpanded, setIsRemovedExpanded] = useState(false)

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

  // Função para verificar se uma medicação tem todos os horários concluídos
  const isAllDosesCompleted = useCallback((medicacao: MedicacaoCompleta) => {
    if (medicacao.status === "inativa") return false
    
    const horariosDoHoje = medicacao.horarios.filter(h => h.hora !== '-')
    return horariosDoHoje.length > 0 && horariosDoHoje.every(h => h.status === 'concluido')
  }, [])

  // Função para marcar dose como concluída
  const handleComplete = useCallback((medicacaoId: number) => {
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

    // Salvar estado anterior para undo
    const undoAction: UndoAction = {
      medicacaoId,
      action: 'complete',
      timestamp: Date.now(),
      previousData: {
        horarios: [...medicacao.horarios],
        proximaDose: medicacao.proximaDose,
        removed_from_today: medicacao.removed_from_today,
        removal_reason: medicacao.removal_reason
      }
    }

    // Atualizar medicação
    setMedicacoesList(prev => prev.map(med => {
      if (med.id === medicacaoId) {
        const novosHorarios = med.horarios.map(h => 
          h.hora === horarioMarcado && h.status === 'pendente'
            ? { ...h, status: 'concluido' as const, completed_at: new Date().toISOString() }
            : h
        )
        
        const novaProximaDose = calculateNextDose(novosHorarios)
        const allCompleted = novosHorarios.filter(h => h.hora !== '-').every(h => h.status === 'concluido')
        
        return {
          ...med,
          horarios: novosHorarios,
          proximaDose: novaProximaDose,
          removed_from_today: allCompleted,
          removal_reason: allCompleted ? 'completed' : undefined
        }
      }
      return med
    }))

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

  // Função para remover da lista
  const handleRemove = useCallback((medicacaoId: number) => {
    const medicacao = medicacoesList.find(m => m.id === medicacaoId)
    if (!medicacao) return

    // Salvar estado anterior para undo
    const undoAction: UndoAction = {
      medicacaoId,
      action: 'remove',
      timestamp: Date.now(),
      previousData: {
        removed_from_today: medicacao.removed_from_today,
        removal_reason: medicacao.removal_reason
      }
    }

    // Marcar como removida da lista
    setMedicacoesList(prev => prev.map(med => {
      if (med.id === medicacaoId) {
        return {
          ...med,
          removed_from_today: true,
          removal_reason: 'excluded'
        }
      }
      return med
    }))

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
      description: "A medicação foi excluída da lista principal.",
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

  // Função para desfazer última ação
  const handleUndo = useCallback((undoAction: UndoAction) => {
    setMedicacoesList(prev => prev.map(med => {
      if (med.id === undoAction.medicacaoId && undoAction.previousData) {
        if (undoAction.action === 'complete') {
          return {
            ...med,
            horarios: undoAction.previousData.horarios || med.horarios,
            proximaDose: undoAction.previousData.proximaDose || med.proximaDose,
            removed_from_today: undoAction.previousData.removed_from_today,
            removal_reason: undoAction.previousData.removal_reason
          }
        } else if (undoAction.action === 'remove') {
          return {
            ...med,
            removed_from_today: undoAction.previousData.removed_from_today,
            removal_reason: undoAction.previousData.removal_reason
          }
        }
      }
      return med
    }))

    // Limpar undo action e timeout
    setLastUndoAction(null)
    if (undoTimeout) {
      clearTimeout(undoTimeout)
      setUndoTimeout(null)
    }

    const actionText = undoAction.action === 'complete' ? 'dose desmarcada' : 'medicação restaurada'
    toast({
      title: "Ação desfeita",
      description: `Operação revertida: ${actionText}.`,
    })
  }, [undoTimeout])

  // Função para restaurar medicação excluída
  const handleRestore = useCallback((medicacaoId: number) => {
    setMedicacoesList(prev => prev.map(med => {
      if (med.id === medicacaoId) {
        return {
          ...med,
          removed_from_today: false,
          removal_reason: undefined
        }
      }
      return med
    }))

    toast({
      title: "Medicação restaurada",
      description: "A medicação foi retornada à lista principal.",
    })
  }, [])

  // Função para extrair e converter horário para comparação
  const getTimeForSorting = (proximaDose: string) => {
    if (proximaDose === "-" || proximaDose === "Todos concluídos hoje") return 9999
    
    const timeMatch = proximaDose.match(/(\d{2}):(\d{2})/)
    if (timeMatch) {
      const hours = parseInt(timeMatch[1])
      const minutes = parseInt(timeMatch[2])
      return hours * 60 + minutes
    }
    
    return 9999
  }

  // Separar medicações em principais e removidas
  const medicacoesPrincipais = medicacoesList
    .filter(med => !med.removed_from_today)
    .sort((a, b) => getTimeForSorting(a.proximaDose) - getTimeForSorting(b.proximaDose))

  const medicacoesRemovidas = medicacoesList
    .filter(med => med.removed_from_today)
    .sort((a, b) => getTimeForSorting(a.proximaDose) - getTimeForSorting(b.proximaDose))

  // Limpar timeout quando componente desmontar
  useEffect(() => {
    return () => {
      if (undoTimeout) {
        clearTimeout(undoTimeout)
      }
    }
  }, [undoTimeout])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMedicacoesList(initialMedicacoes)
      setLastUndoAction(null)
      setIsRemovedExpanded(false)
      if (undoTimeout) {
        clearTimeout(undoTimeout)
        setUndoTimeout(null)
      }
    }
  }, [isOpen, undoTimeout])

  const getStatusText = (medicacao: MedicacaoCompleta) => {
    if (medicacao.removal_reason === 'completed') {
      return 'Concluída hoje'
    } else if (medicacao.removal_reason === 'excluded') {
      return 'Excluída da lista'
    }
    return medicacao.status
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Compromissos do dia
          </DialogTitle>
          <p className="text-muted-foreground text-sm text-left">14 de agosto de 2025</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Lista Principal - Medicações Pendentes */}
          {medicacoesPrincipais.length > 0 && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-semibold text-[#344E41] text-lg">
                <Pill className="w-5 h-5" />
                Medicações do dia ({medicacoesPrincipais.length})
              </h3>
              <div className="space-y-3">
                {medicacoesPrincipais.map((medicacao) => (
                  <SwipeableCard
                    key={medicacao.id}
                    medicacao={medicacao}
                    onComplete={handleComplete}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sub-lista "Ver medicações removidas" */}
          {medicacoesRemovidas.length > 0 && (
            <div className="space-y-4 mt-6 pt-4 border-t border-border/50">
              <div 
                className="flex items-center justify-start gap-2 cursor-pointer py-2 hover:bg-accent/10 rounded-lg transition-colors"
                onClick={() => setIsRemovedExpanded(!isRemovedExpanded)}
                aria-expanded={isRemovedExpanded}
                aria-label={isRemovedExpanded ? "Colapsar medicações removidas" : "Expandir medicações removidas"}
              >
                {isRemovedExpanded ? (
                  <ChevronUp className="w-5 h-5 text-[#344E41]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#344E41]" />
                )}
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#344E41]">Ver medicações concluídas</h3>
                  <Badge variant="secondary" className="bg-[#344E41]/10 text-[#344E41]">
                    {medicacoesRemovidas.length}
                  </Badge>
                </div>
              </div>
              
              {isRemovedExpanded && (
                <div className="space-y-3">
                  {medicacoesRemovidas.map((medicacao) => (
                    <div key={medicacao.id} className="relative">
                      <SwipeableCard
                        medicacao={medicacao}
                        onComplete={handleComplete}
                        onRemove={handleRemove}
                        disabled={true}
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                        <Badge 
                          variant="secondary" 
                          className="bg-muted/80 text-muted-foreground text-xs"
                        >
                          {getStatusText(medicacao)}
                        </Badge>
                        {medicacao.removal_reason === 'excluded' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-6 px-2 bg-background/90 hover:bg-[#588157]/10 hover:border-[#588157] hover:text-[#588157]"
                            onClick={() => handleRestore(medicacao.id)}
                          >
                            Restaurar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Caso não haja medicações */}
          {medicacoesPrincipais.length === 0 && medicacoesRemovidas.length === 0 && (
            <div className="text-center py-8">
              <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-primary mb-2">
                Nenhuma medicação para hoje
              </h3>
              <p className="text-muted-foreground">
                Você não tem medicações programadas para hoje.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-border/50">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CompromissosModal