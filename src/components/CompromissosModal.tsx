import React, { useState, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Calendar, Clock, Pill, User, Stethoscope, MapPin, ChevronDown, ChevronUp, Undo2, Heart } from "lucide-react"
import SwipeableCard from './SwipeableCard'
import SwipeableConsultaCard from './SwipeableConsultaCard'
import SwipeableExameCard from './SwipeableExameCard'
import SwipeableAtividadeCard from './SwipeableAtividadeCard'

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

interface ConsultaCompleta {
  id: number;
  especialidade: string;
  profissional: string;
  local: string;
  hora: string;
  status: "agendado" | "confirmado" | "concluido_hoje";
  removed_from_today?: boolean;
  removal_reason?: 'completed' | 'excluded';
  completed_at?: string;
}

interface ExameCompleto {
  id: number;
  tipo: string;
  local: string;
  hora: string;
  status: "agendado" | "concluido_hoje";
  removed_from_today?: boolean;
  removal_reason?: 'completed' | 'excluded';
  completed_at?: string;
}

interface AtividadeCompleta {
  id: number;
  tipo: string;
  local: string;
  hora: string;
  duracao: string;
  status: "pendente" | "concluido_hoje";
  removed_from_today?: boolean;
  removal_reason?: 'completed' | 'excluded';
  completed_at?: string;
  dias?: string[];
  repeticao?: string;
}

interface UndoAction {
  itemId: number;
  itemType: 'medicacao' | 'consulta' | 'exame' | 'atividade';
  action: 'complete' | 'remove';
  timestamp: number;
  previousData?: any;
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
    }
  ]

  const initialConsultas: ConsultaCompleta[] = [
    {
      id: 3,
      especialidade: "Cardiologia",
      profissional: "Dr. João Silva",
      local: "Clínica Boa Saúde",
      hora: "09:30",
      status: "agendado"
    },
    {
      id: 4,
      especialidade: "Endocrinologia", 
      profissional: "Dra. Maria Santos",
      local: "Hospital Central",
      hora: "14:00",
      status: "confirmado"
    }
  ]

  const initialExames: ExameCompleto[] = [
    {
      id: 5,
      tipo: "Hemograma",
      local: "Lab Central",
      hora: "07:00",
      status: "agendado"
    },
    {
      id: 6,
      tipo: "Ultrassom Abdominal",
      local: "Centro Diagnóstico",
      hora: "16:30",
      status: "agendado"
    }
  ]

  const initialAtividades: AtividadeCompleta[] = [
    {
      id: 7,
      tipo: "Fisioterapia",
      local: "Clínica Movimento",
      hora: "07:30",
      duracao: "45min",
      status: "pendente",
      dias: ["Seg", "Qua", "Sex"],
      repeticao: "Toda semana"
    },
    {
      id: 8,
      tipo: "Caminhada",
      local: "Parque da Cidade",
      hora: "18:00",
      duracao: "30min",
      status: "pendente",
      dias: ["Dom"],
      repeticao: "Não se repete"
    }
  ]

  const [medicacoesList, setMedicacoesList] = useState<MedicacaoCompleta[]>(initialMedicacoes)
  const [consultasList, setConsultasList] = useState<ConsultaCompleta[]>(initialConsultas)
  const [examesList, setExamesList] = useState<ExameCompleto[]>(initialExames)
  const [atividadesList, setAtividadesList] = useState<AtividadeCompleta[]>(initialAtividades)
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

  // Função genérica para marcar item como concluído
  const handleComplete = useCallback((itemId: number, itemType: 'medicacao' | 'consulta' | 'exame' | 'atividade') => {
    if (itemType === 'medicacao') {
      const medicacao = medicacoesList.find(m => m.id === itemId)
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
        itemId,
        itemType: 'medicacao',
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
        if (med.id === itemId) {
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

      // Exibir toast
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
    } else if (itemType === 'consulta') {
      const consulta = consultasList.find(c => c.id === itemId)
      if (!consulta) return

      const undoAction: UndoAction = {
        itemId,
        itemType: 'consulta',
        action: 'complete',
        timestamp: Date.now(),
        previousData: {
          status: consulta.status,
          removed_from_today: consulta.removed_from_today,
          removal_reason: consulta.removal_reason
        }
      }

      setConsultasList(prev => prev.map(cons => {
        if (cons.id === itemId) {
          return {
            ...cons,
            status: 'concluido_hoje' as const,
            removed_from_today: true,
            removal_reason: 'completed',
            completed_at: new Date().toISOString()
          }
        }
        return cons
      }))

      setLastUndoAction(undoAction)

      toast({
        title: "Consulta concluída",
        description: "A consulta foi marcada como concluída hoje.",
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
    } else if (itemType === 'exame') {
      const exame = examesList.find(e => e.id === itemId)
      if (!exame) return

      const undoAction: UndoAction = {
        itemId,
        itemType: 'exame',
        action: 'complete',
        timestamp: Date.now(),
        previousData: {
          status: exame.status,
          removed_from_today: exame.removed_from_today,
          removal_reason: exame.removal_reason
        }
      }

      setExamesList(prev => prev.map(exam => {
        if (exam.id === itemId) {
          return {
            ...exam,
            status: 'concluido_hoje' as const,
            removed_from_today: true,
            removal_reason: 'completed',
            completed_at: new Date().toISOString()
          }
        }
        return exam
      }))

      setLastUndoAction(undoAction)

      toast({
        title: "Exame concluído",
        description: "O exame foi marcado como concluído hoje.",
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
    } else if (itemType === 'atividade') {
      const atividade = atividadesList.find(a => a.id === itemId)
      if (!atividade) return

      const undoAction: UndoAction = {
        itemId,
        itemType: 'atividade',
        action: 'complete',
        timestamp: Date.now(),
        previousData: {
          status: atividade.status,
          removed_from_today: atividade.removed_from_today,
          removal_reason: atividade.removal_reason
        }
      }

      setAtividadesList(prev => prev.map(ativ => {
        if (ativ.id === itemId) {
          return {
            ...ativ,
            status: 'concluido_hoje' as const,
            removed_from_today: true,
            removal_reason: 'completed',
            completed_at: new Date().toISOString()
          }
        }
        return ativ
      }))

      setLastUndoAction(undoAction)

      toast({
        title: "Atividade concluída",
        description: "A atividade foi marcada como concluída hoje.",
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
    }

    // Configurar timeout para limpar undo
    if (undoTimeout) {
      clearTimeout(undoTimeout)
    }

    const timeout = setTimeout(() => {
      setLastUndoAction(null)
    }, 5000)
    setUndoTimeout(timeout)
  }, [medicacoesList, consultasList, examesList, atividadesList, calculateNextDose, undoTimeout])

  // Função genérica para remover da lista
  const handleRemove = useCallback((itemId: number, itemType: 'medicacao' | 'consulta' | 'exame' | 'atividade') => {
    if (itemType === 'medicacao') {
      const medicacao = medicacoesList.find(m => m.id === itemId)
      if (!medicacao) return

      const undoAction: UndoAction = {
        itemId,
        itemType: 'medicacao',
        action: 'remove',
        timestamp: Date.now(),
        previousData: {
          removed_from_today: medicacao.removed_from_today,
          removal_reason: medicacao.removal_reason
        }
      }

      setMedicacoesList(prev => prev.map(med => {
        if (med.id === itemId) {
          return {
            ...med,
            removed_from_today: true,
            removal_reason: 'excluded'
          }
        }
        return med
      }))

      setLastUndoAction(undoAction)

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
    } else if (itemType === 'consulta') {
      const consulta = consultasList.find(c => c.id === itemId)
      if (!consulta) return

      const undoAction: UndoAction = {
        itemId,
        itemType: 'consulta',
        action: 'remove',
        timestamp: Date.now(),
        previousData: {
          removed_from_today: consulta.removed_from_today,
          removal_reason: consulta.removal_reason
        }
      }

      setConsultasList(prev => prev.map(cons => {
        if (cons.id === itemId) {
          return {
            ...cons,
            removed_from_today: true,
            removal_reason: 'excluded'
          }
        }
        return cons
      }))

      setLastUndoAction(undoAction)

      toast({
        title: "Consulta removida da lista de hoje",
        description: "A consulta foi excluída da lista principal.",
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
    } else if (itemType === 'exame') {
      const exame = examesList.find(e => e.id === itemId)
      if (!exame) return

      const undoAction: UndoAction = {
        itemId,
        itemType: 'exame',
        action: 'remove',
        timestamp: Date.now(),
        previousData: {
          removed_from_today: exame.removed_from_today,
          removal_reason: exame.removal_reason
        }
      }

      setExamesList(prev => prev.map(exam => {
        if (exam.id === itemId) {
          return {
            ...exam,
            removed_from_today: true,
            removal_reason: 'excluded'
          }
        }
        return exam
      }))

      setLastUndoAction(undoAction)

      toast({
        title: "Exame removido da lista de hoje",
        description: "O exame foi excluído da lista principal.",
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
    } else if (itemType === 'atividade') {
      const atividade = atividadesList.find(a => a.id === itemId)
      if (!atividade) return

      const undoAction: UndoAction = {
        itemId,
        itemType: 'atividade',
        action: 'remove',
        timestamp: Date.now(),
        previousData: {
          removed_from_today: atividade.removed_from_today,
          removal_reason: atividade.removal_reason
        }
      }

      setAtividadesList(prev => prev.map(ativ => {
        if (ativ.id === itemId) {
          return {
            ...ativ,
            removed_from_today: true,
            removal_reason: 'excluded'
          }
        }
        return ativ
      }))

      setLastUndoAction(undoAction)

      toast({
        title: "Atividade removida da lista de hoje",
        description: "A atividade foi excluída da lista principal.",
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
    }

    // Configurar timeout para limpar undo
    if (undoTimeout) {
      clearTimeout(undoTimeout)
    }

    const timeout = setTimeout(() => {
      setLastUndoAction(null)
    }, 5000)
    setUndoTimeout(timeout)
  }, [medicacoesList, consultasList, examesList, atividadesList, undoTimeout])

  // Função para desfazer última ação
  const handleUndo = useCallback((undoAction: UndoAction) => {
    if (undoAction.itemType === 'medicacao') {
      setMedicacoesList(prev => prev.map(med => {
        if (med.id === undoAction.itemId && undoAction.previousData) {
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
    } else if (undoAction.itemType === 'consulta') {
      setConsultasList(prev => prev.map(cons => {
        if (cons.id === undoAction.itemId && undoAction.previousData) {
          return {
            ...cons,
            status: undoAction.previousData.status,
            removed_from_today: undoAction.previousData.removed_from_today,
            removal_reason: undoAction.previousData.removal_reason
          }
        }
        return cons
      }))
    } else if (undoAction.itemType === 'exame') {
      setExamesList(prev => prev.map(exam => {
        if (exam.id === undoAction.itemId && undoAction.previousData) {
          return {
            ...exam,
            status: undoAction.previousData.status,
            removed_from_today: undoAction.previousData.removed_from_today,
            removal_reason: undoAction.previousData.removal_reason
          }
        }
        return exam
      }))
    } else if (undoAction.itemType === 'atividade') {
      setAtividadesList(prev => prev.map(ativ => {
        if (ativ.id === undoAction.itemId && undoAction.previousData) {
          return {
            ...ativ,
            status: undoAction.previousData.status,
            removed_from_today: undoAction.previousData.removed_from_today,
            removal_reason: undoAction.previousData.removal_reason
          }
        }
        return ativ
      }))
    }

    // Limpar undo action e timeout
    setLastUndoAction(null)
    if (undoTimeout) {
      clearTimeout(undoTimeout)
      setUndoTimeout(null)
    }

    const typeText = undoAction.itemType === 'medicacao' ? 'medicação' : 
                     undoAction.itemType === 'consulta' ? 'consulta' : 
                     undoAction.itemType === 'exame' ? 'exame' : 'atividade'
    const actionText = undoAction.action === 'complete' ? 'desmarcada' : 'restaurada'
    toast({
      title: "Ação desfeita",
      description: `Operação revertida: ${typeText} ${actionText}.`,
    })
  }, [undoTimeout])

  // Função genérica para restaurar item excluído
  const handleRestore = useCallback((itemId: number, itemType: 'medicacao' | 'consulta' | 'exame' | 'atividade') => {
    if (itemType === 'medicacao') {
      setMedicacoesList(prev => prev.map(med => {
        if (med.id === itemId) {
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
    } else if (itemType === 'consulta') {
      setConsultasList(prev => prev.map(cons => {
        if (cons.id === itemId) {
          return {
            ...cons,
            removed_from_today: false,
            removal_reason: undefined
          }
        }
        return cons
      }))
      toast({
        title: "Consulta restaurada",
        description: "A consulta foi retornada à lista principal.",
      })
    } else if (itemType === 'exame') {
      setExamesList(prev => prev.map(exam => {
        if (exam.id === itemId) {
          return {
            ...exam,
            removed_from_today: false,
            removal_reason: undefined
          }
        }
        return exam
      }))
      toast({
        title: "Exame restaurado",
        description: "O exame foi retornado à lista principal.",
      })
    } else if (itemType === 'atividade') {
      setAtividadesList(prev => prev.map(ativ => {
        if (ativ.id === itemId) {
          return {
            ...ativ,
            removed_from_today: false,
            removal_reason: undefined
          }
        }
        return ativ
      }))
      toast({
        title: "Atividade restaurada",
        description: "A atividade foi retornada à lista principal.",
      })
    }
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

  // Separar todos os itens em principais e removidos
  const medicacoesPrincipais = medicacoesList
    .filter(med => !med.removed_from_today)
    .sort((a, b) => getTimeForSorting(a.proximaDose) - getTimeForSorting(b.proximaDose))

  const consultasPrincipais = consultasList
    .filter(cons => !cons.removed_from_today)
    .sort((a, b) => getTimeForSorting(a.hora) - getTimeForSorting(b.hora))

  const examesPrincipais = examesList
    .filter(exam => !exam.removed_from_today)
    .sort((a, b) => getTimeForSorting(a.hora) - getTimeForSorting(b.hora))

  const atividadesPrincipais = atividadesList
    .filter(ativ => !ativ.removed_from_today)
    .sort((a, b) => getTimeForSorting(a.hora) - getTimeForSorting(b.hora))

  // Itens removidos/concluídos de todas as categorias
  const itensRemovidos = [
    ...medicacoesList.filter(med => med.removed_from_today),
    ...consultasList.filter(cons => cons.removed_from_today),
    ...examesList.filter(exam => exam.removed_from_today),
    ...atividadesList.filter(ativ => ativ.removed_from_today)
  ].sort((a, b) => {
    const timeA = 'proximaDose' in a ? getTimeForSorting(a.proximaDose) : getTimeForSorting(a.hora)
    const timeB = 'proximaDose' in b ? getTimeForSorting(b.proximaDose) : getTimeForSorting(b.hora)
    return timeA - timeB
  })

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
      setConsultasList(initialConsultas)
      setExamesList(initialExames)
      setAtividadesList(initialAtividades)
      setLastUndoAction(null)
      setIsRemovedExpanded(false)
      if (undoTimeout) {
        clearTimeout(undoTimeout)
        setUndoTimeout(null)
      }
    }
  }, [isOpen, undoTimeout])

  const getStatusText = (item: any, itemType: 'medicacao' | 'consulta' | 'exame' | 'atividade') => {
    if (item.removal_reason === 'completed') {
      return 'Concluído hoje'
    } else if (item.removal_reason === 'excluded') {
      return 'Excluído da lista'
    }
    return item.status
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

        <div className="space-y-6 py-4">
          {/* Seção A: Medicações */}
          {medicacoesPrincipais.length > 0 ? (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-semibold text-[#344E41] text-lg">
                <Pill className="w-5 h-5" />
                Medicações ({medicacoesPrincipais.length})
              </h3>
              <div className="space-y-3">
                {medicacoesPrincipais.map((medicacao) => (
                  <SwipeableCard
                    key={medicacao.id}
                    medicacao={medicacao}
                    onComplete={(id) => handleComplete(id, 'medicacao')}
                    onRemove={(id) => handleRemove(id, 'medicacao')}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-semibold text-[#344E41] text-lg">
                <Pill className="w-5 h-5" />
                Medicações (0)
              </h3>
              <div className="text-muted-foreground/60 text-sm italic p-4 bg-muted/20 rounded-lg">
                Ex.: Nenhum item pendente
              </div>
            </div>
          )}

          {/* Seção B: Consultas */}
          {consultasPrincipais.length > 0 ? (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-semibold text-[#344E41] text-lg">
                <User className="w-5 h-5" />
                Consultas ({consultasPrincipais.length})
              </h3>
              <div className="space-y-3">
                {consultasPrincipais.map((consulta) => (
                  <SwipeableConsultaCard
                    key={consulta.id}
                    consulta={consulta}
                    onComplete={handleComplete}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-semibold text-[#344E41] text-lg">
                <User className="w-5 h-5" />
                Consultas (0)
              </h3>
              <div className="text-muted-foreground/60 text-sm italic p-4 bg-muted/20 rounded-lg">
                Ex.: Nenhum item pendente
              </div>
            </div>
          )}

          {/* Seção C: Exames */}
          {examesPrincipais.length > 0 ? (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-semibold text-[#344E41] text-lg">
                <Stethoscope className="w-5 h-5" />
                Exames ({examesPrincipais.length})
              </h3>
              <div className="space-y-3">
                {examesPrincipais.map((exame) => (
                  <SwipeableExameCard
                    key={exame.id}
                    exame={exame}
                    onComplete={handleComplete}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-semibold text-[#344E41] text-lg">
                <Stethoscope className="w-5 h-5" />
                Exames (0)
              </h3>
              <div className="text-muted-foreground/60 text-sm italic p-4 bg-muted/20 rounded-lg">
                Ex.: Nenhum item pendente
              </div>
            </div>
          )}

          {/* Seção D: Atividades */}
          {atividadesPrincipais.length > 0 ? (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-semibold text-[#344E41] text-lg">
                <Heart className="w-5 h-5" />
                Atividades ({atividadesPrincipais.length})
              </h3>
              <div className="space-y-3">
                {atividadesPrincipais.map((atividade) => (
                  <SwipeableAtividadeCard
                    key={atividade.id}
                    atividade={atividade}
                    onComplete={handleComplete}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-semibold text-[#344E41] text-lg">
                <Heart className="w-5 h-5" />
                Atividades (0)
              </h3>
              <div className="text-muted-foreground/60 text-sm italic p-4 bg-muted/20 rounded-lg">
                Ex.: Nenhum item pendente
              </div>
            </div>
          )}

          {/* Seção E: Sublista "Ver itens removidos" */}
          {itensRemovidos.length > 0 && (
            <div className="space-y-4 mt-6 pt-4 border-t border-border/50">
              <div 
                className="flex items-center justify-between cursor-pointer py-2 hover:bg-accent/10 rounded-lg transition-colors"
                onClick={() => setIsRemovedExpanded(!isRemovedExpanded)}
                aria-expanded={isRemovedExpanded}
                aria-label={isRemovedExpanded ? "Colapsar itens removidos" : "Expandir itens removidos"}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#344E41]">Ver itens removidos</h3>
                  <Badge variant="secondary" className="bg-[#344E41]/10 text-[#344E41]">
                    {itensRemovidos.length}
                  </Badge>
                </div>
                {isRemovedExpanded ? (
                  <ChevronUp className="w-5 h-5 text-[#344E41]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#344E41]" />
                )}
              </div>
              
              {isRemovedExpanded && (
                <div className="grid gap-4 w-full">
                  {itensRemovidos.map((item: any) => {
                    const isCompleted = item.removal_reason === 'completed'
                    const itemType = item.horarios ? 'medicacao' : 
                                    item.profissional ? 'consulta' : 
                                    item.duracao ? 'atividade' : 'exame'
                    
                    const getIcon = () => {
                      switch (itemType) {
                        case 'medicacao': return <Pill className="w-5 h-5 sm:w-6 sm:h-6 text-accent-foreground" />
                        case 'consulta': return <User className="w-5 h-5 sm:w-6 sm:h-6 text-accent-foreground" />
                        case 'exame': return <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-accent-foreground" />
                        case 'atividade': return <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-accent-foreground" />
                        default: return <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-accent-foreground" />
                      }
                    }

                    const getTitle = () => {
                      switch (itemType) {
                        case 'medicacao': return item.nome
                        case 'consulta': return item.especialidade
                        case 'exame': return item.tipo
                        case 'atividade': return item.tipo
                        default: return 'Item'
                      }
                    }

                    const getSubtitle = () => {
                      switch (itemType) {
                        case 'medicacao': return `${item.dosagem} • ${item.forma}`
                        case 'consulta': return item.profissional
                        case 'exame': return item.local
                        case 'atividade': return `${item.local} • ${item.duracao}`
                        default: return ''
                      }
                    }
                    
                    return (
                      <Card 
                        key={`${itemType}-${item.id}`} 
                        className="w-full shadow-card hover:shadow-floating transition-shadow duration-300"
                      >
                        <CardContent className="p-4 sm:p-6 w-full opacity-80">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4 sm:gap-0">
                            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-accent opacity-60">
                                {getIcon()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-semibold text-primary opacity-85">
                                  {getTitle()}
                                </h3>
                                <p className="text-sm sm:text-base text-muted-foreground opacity-85">
                                  {getSubtitle()}
                                </p>
                                {itemType === 'medicacao' && (
                                  <p className="text-xs sm:text-sm text-muted-foreground opacity-85">
                                    {item.frequencia}
                                  </p>
                                )}
                                {itemType === 'consulta' && (
                                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground opacity-85 mt-1">
                                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span>{item.local}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-col sm:text-right space-y-2 flex-shrink-0 w-full sm:w-auto sm:ml-4">
                              <div className="flex items-center justify-start sm:justify-end text-muted-foreground/50">
                                <Clock className="w-4 h-4 mr-1" />
                                <span className="font-medium text-sm sm:text-base">
                                  {getStatusText(item, itemType as any)}
                                </span>
                              </div>
                              <div className="flex items-center justify-start sm:justify-end gap-2">
                                {item.removal_reason === 'excluded' && (
                                  <Badge 
                                    variant="secondary"
                                    className="text-xs sm:text-sm bg-orange-100 text-orange-800"
                                  >
                                    Excluído
                                  </Badge>
                                )}
                                {isCompleted && (
                                  <Badge 
                                    variant="secondary"
                                    className="text-xs sm:text-sm bg-green-100 text-green-800"
                                  >
                                    Concluído
                                  </Badge>
                                )}
                              </div>
                              {(item.removal_reason === 'excluded' || item.removal_reason === 'completed') && (
                                <div className="flex justify-start sm:justify-end mt-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleRestore(item.id, itemType as any)}
                                    className="h-8 text-xs bg-[#344E41] text-white border-[#344E41] hover:bg-[#3A5A40]"
                                  >
                                    <Undo2 className="w-3 h-3 mr-1" />
                                    Restaurar
                                  </Button>
                                </div>
                              )}
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

          {/* Caso não haja compromissos */}
          {medicacoesPrincipais.length === 0 && consultasPrincipais.length === 0 && examesPrincipais.length === 0 && atividadesPrincipais.length === 0 && itensRemovidos.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-primary mb-2">
                Nenhum compromisso para hoje
              </h3>
              <p className="text-muted-foreground">
                Você não tem compromissos programados para hoje.
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