import React, { useState, useCallback } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pill, Clock, Check, Trash2, Edit } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatTime24h } from "@/lib/utils"

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
  removal_reason?: 'completed' | 'excluded';
  data_inicio?: string;
  data_fim?: string;
  horaInicio?: string;
}

interface SwipeableMedicationCardProps {
  medicacao: MedicacaoCompleta;
  onComplete: (id: string) => void;
  onRemove: (id: string) => void;
  onEdit?: (medicacao: MedicacaoCompleta) => void;
  disabled?: boolean;
  isLoading?: boolean;
  isInactive?: boolean;
  origin?: string;
  isProcessing?: boolean;
}

const SwipeableMedicationCard: React.FC<SwipeableMedicationCardProps> = ({
  medicacao,
  onComplete,
  onRemove,
  onEdit,
  disabled = false,
  isLoading = false,
  isInactive = false,
  isProcessing = false
}) => {
  const isMobile = useIsMobile()
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 })
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null)
  const [touchMoved, setTouchMoved] = useState(false)
  const [touchEnded, setTouchEnded] = useState(false)
  const [isHorizontalSwipe, setIsHorizontalSwipe] = useState(false)
  const [startedAt, setStartedAt] = useState(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || disabled) return
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX, y: touch.clientY })
    setDragCurrent({ x: touch.clientX, y: touch.clientY })
    setDragDirection(null)
    setTouchMoved(false)
    setTouchEnded(false)
    setIsHorizontalSwipe(false)
    setStartedAt(Date.now())
  }, [isMobile, disabled])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !isMobile || disabled) return
    
    const touch = e.touches[0]
    setDragCurrent({ x: touch.clientX, y: touch.clientY })
    
    const deltaX = touch.clientX - dragStart.x
    const deltaY = touch.clientY - dragStart.y
    const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // Mark that touch has moved if movement is significant
    if (totalMovement > 10) {
      setTouchMoved(true)
    }
    
    // Only start horizontal swiping if horizontal movement is significant and greater than vertical
    if (!isHorizontalSwipe && Math.abs(deltaX) > 15 && Math.abs(deltaX) > Math.abs(deltaY)) {
      setIsHorizontalSwipe(true)
      e.preventDefault()
    } else if (!isHorizontalSwipe && Math.abs(deltaY) > 15) {
      // Allow vertical scrolling
      return
    }
    
    if (isHorizontalSwipe) {
      e.preventDefault()
      const direction = deltaX > 0 ? 'right' : 'left'
      setDragDirection(Math.abs(deltaX) > 20 ? direction : null)
    }
  }, [isDragging, dragStart, isMobile, isHorizontalSwipe, disabled])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || !isMobile || touchEnded || disabled) return
    setTouchEnded(true)
    
    if (isHorizontalSwipe && dragDirection) {
      const deltaX = dragCurrent.x - dragStart.x
      const threshold = 100

      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onComplete(medicacao.id)
        } else {
          onRemove(medicacao.id)
        }
      }
    } else if (onEdit) {
      // Tap detection: check distance and time, not touchMoved
      const deltaX = dragCurrent.x - dragStart.x
      const deltaY = dragCurrent.y - dragStart.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const duration = Date.now() - startedAt
      
      if (distance <= 16 && duration <= 350 && !isHorizontalSwipe) {
        // Add small delay to ensure this is a deliberate tap
        setTimeout(() => {
          if (!isHorizontalSwipe) {
            onEdit(medicacao)
          }
        }, 50)
      }
    }

    setIsDragging(false)
    setDragStart({ x: 0, y: 0 })
    setDragCurrent({ x: 0, y: 0 })
    setDragDirection(null)
    setIsHorizontalSwipe(false)
  }, [isDragging, dragCurrent, dragStart, medicacao.id, medicacao, onComplete, onRemove, isMobile, touchEnded, touchMoved, onEdit, isHorizontalSwipe, startedAt, disabled])

  const getTransformStyle = () => {
    if (!isDragging || !isHorizontalSwipe) return {}
    
    const deltaX = dragCurrent.x - dragStart.x
    const maxTranslate = 120
    const translate = Math.max(-maxTranslate, Math.min(maxTranslate, deltaX * 0.4))
    
    return {
      transform: `translateX(${translate}px)`,
      transition: 'none'
    }
  }

  const getBackgroundOverlay = () => {
    if (!isDragging || !dragDirection || !isHorizontalSwipe) return null

    const isComplete = dragDirection === 'right'
    const bgColor = isComplete ? 'bg-[#344E41]' : 'bg-[#FF3B30]'
    const text = isComplete ? 'Concluir' : 'Cancelar'
    const deltaX = Math.abs(dragCurrent.x - dragStart.x)
    const opacity = Math.min(1, deltaX / 80)

    return (
      <div 
        className={`absolute inset-0 ${bgColor} rounded-lg flex items-center ${isComplete ? 'justify-start pl-4' : 'justify-end pr-4'} text-white z-0`}
        style={{ opacity }}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="font-bold text-lg sm:text-xl">{text}</span>
          <div className="w-8 h-1 bg-white/60 rounded-full"></div>
        </div>
      </div>
    )
  }

  const handleCardClick = () => {
    if (!isMobile && onEdit && !disabled) {
      onEdit(medicacao)
    }
  }

  // Helper function to get status badge
  const getStatusInfo = () => {
    if (isInactive || medicacao.status === 'inativa') {
      return { variant: 'secondary' as const, text: 'Inativa' }
    }
    
    if (medicacao.removed_from_today) {
      // Check if removed by completion or exclusion
      if (medicacao.removal_reason === 'excluded') {
        return { variant: 'destructive' as const, text: 'Cancelada hoje' }
      } else if (medicacao.removal_reason === 'completed') {
        return { variant: 'default' as const, text: 'Concluída hoje' }
      }
      return { variant: 'default' as const, text: 'Finalizada hoje' }
    }
    
    const validHorarios = medicacao.horarios.filter(h => h.hora !== '-')
    const pendingCount = validHorarios.filter(h => h.status === 'pendente').length
    const completedCount = validHorarios.filter(h => h.status === 'concluido').length
    const excludedCount = validHorarios.filter(h => h.status === 'excluido').length
    const totalCount = validHorarios.length
    
    // All doses finalized
    if (pendingCount === 0 && totalCount > 0) {
      if (excludedCount > 0 && completedCount === 0) {
        return { variant: 'destructive' as const, text: `Cancelada (${excludedCount}/${totalCount})` }
      } else if (completedCount > 0 && excludedCount === 0) {
        return { variant: 'default' as const, text: `Concluída (${completedCount}/${totalCount})` }
      } else if (completedCount > 0 && excludedCount > 0) {
        return { variant: 'secondary' as const, text: `${completedCount} feitos, ${excludedCount} cancelados` }
      }
    }
    
    // Partial completion
    if ((completedCount > 0 || excludedCount > 0) && pendingCount > 0) {
      const finalizadosCount = completedCount + excludedCount
      return { variant: 'secondary' as const, text: `${finalizadosCount}/${totalCount} finalizados` }
    }
    
    return { variant: 'secondary' as const, text: `${totalCount} horário${totalCount > 1 ? 's' : ''}` }
  }

  const statusInfo = getStatusInfo()

  // Helper function to pluralize forma based on estoque
  const getFormaGramatical = (forma: string, estoque: number) => {
    if (estoque === 1) return forma;
    
    // Handle common medication forms with proper plural and gender agreement
    const formas: { [key: string]: string } = {
      'comprimido': 'comprimidos',
      'cápsula': 'cápsulas',
      'capsula': 'cápsulas',
      'pílula': 'pílulas',
      'pilula': 'pílulas',
      'gota': 'gotas',
      'ml': 'ml',
      'mg': 'mg',
      'g': 'g',
      'ampola': 'ampolas',
      'frasco': 'frascos',
      'sachê': 'sachês',
      'sache': 'sachês',
      'adesivo': 'adesivos',
      'supositório': 'supositórios',
      'supositorio': 'supositórios',
      'spray': 'sprays',
      'inalação': 'inalações',
      'inalacao': 'inalações',
      'aplicação': 'aplicações',
      'aplicacao': 'aplicações',
      'dose': 'doses',
      'unidade': 'unidades',
      'pastilha': 'pastilhas',
      'drágea': 'drágeas',
      'dragea': 'drágeas',
      'envelope': 'envelopes',
      'bisnaga': 'bisnagas',
      'tubo': 'tubos',
      'bomba': 'bombas',
      'seringa': 'seringas',
    };
    
    const formaLower = forma.toLowerCase().trim();
    return formas[formaLower] || `${forma}s`;
  }

  return (
    <div className="relative">
      {getBackgroundOverlay()}
      <Card 
        className={`w-full shadow-card hover:shadow-floating transition-shadow duration-300 relative z-10 ${
          isDragging && isHorizontalSwipe ? 'pointer-events-none' : ''
        } ${disabled ? 'opacity-60' : ''} ${isProcessing ? 'opacity-80' : ''}`}
        style={{
          ...getTransformStyle(),
          touchAction: isMobile ? 'pan-y' : 'auto'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
      >
        <CardContent className="p-4 sm:p-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4 sm:gap-0">
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-[#3A5A40]">
                <Pill className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-primary">
                  {medicacao.nome}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {medicacao.dosagem} • {medicacao.estoque} {getFormaGramatical(medicacao.forma, medicacao.estoque)}
                </p>
                <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mt-1">
                  <span>Frequência: {medicacao.frequencia}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-col sm:text-right space-y-2 flex-shrink-0 w-full sm:w-auto sm:ml-4">
              {/* Mostrar todos os horários programados com seus status */}
              <div className="flex flex-col items-start sm:items-end gap-1">
                {medicacao.horarios.filter(h => h.hora !== '-').length > 1 ? (
                  // Múltiplos horários - mostrar horizontalmente
                  <div className="flex flex-wrap gap-1 justify-start sm:justify-end">
                    {medicacao.horarios
                      .filter(h => h.hora !== '-')
                      .sort((a, b) => a.hora.localeCompare(b.hora))
                      .map((horario, index) => (
                        <div key={`${horario.hora}-${index}`} className="flex items-center gap-1 text-xs bg-muted/50 px-2 py-1 rounded">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className={`font-medium ${
                            horario.status === 'concluido' ? 'line-through text-muted-foreground' : 
                            horario.status === 'excluido' ? 'line-through text-destructive' : 'text-primary'
                          }`}>
                            {formatTime24h(horario.hora)}
                          </span>
                          {horario.status === 'concluido' && (
                            <Check className="w-3 h-3 text-green-600" />
                          )}
                          {horario.status === 'excluido' && (
                            <span className="text-destructive text-xs">✗</span>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  // Horário único - mostrar como antes
                  <div className="flex items-center gap-1 text-primary">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium text-sm sm:text-base">
                      {medicacao.proximaDose === "Todos concluídos hoje" ? "Finalizada" : formatTime24h(medicacao.proximaDose)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-start sm:justify-end gap-2">
                <Badge 
                  variant={statusInfo.variant}
                  className="text-xs sm:text-sm"
                >
                  {statusInfo.text}
                </Badge>
              </div>
              
              {/* Botões para Desktop - ordem: Excluir, Alterar, Concluir */}
              {!isMobile && !disabled && (
                <div className="flex gap-2 justify-start sm:justify-end mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(medicacao.id)
                    }}
                    className="h-8 text-xs hover:bg-destructive hover:text-destructive-foreground"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Cancelar
                  </Button>
                  {onEdit && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(medicacao)
                      }}
                      className="h-8 text-xs"
                      disabled={isLoading}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Alterar
                    </Button>
                  )}
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onComplete(medicacao.id)
                    }}
                    className="h-8 text-xs bg-[#588157] hover:bg-[#3A5A40]"
                    disabled={isLoading}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Concluir
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SwipeableMedicationCard