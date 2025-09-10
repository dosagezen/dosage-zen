import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Pill, Check, Trash2, Edit } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useNavigate } from "react-router-dom"

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

interface SwipeableCardProps {
  medicacao: MedicacaoCompleta;
  onComplete: (id: number) => void;
  onRemove: (id: number) => void;
  onEdit?: (medicacao: MedicacaoCompleta, origin?: 'medicacoes' | 'compromissos') => void;
  disabled?: boolean;
  origin?: 'medicacoes' | 'compromissos';
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({ 
  medicacao, 
  onComplete, 
  onRemove, 
  onEdit,
  disabled = false,
  origin = 'medicacoes'
}) => {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [dragState, setDragState] = useState({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    isHorizontalSwipe: false,
    touchMoved: false,
    touchEnded: false,
  })
  const [showActionHint, setShowActionHint] = useState<'complete' | 'remove' | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const threshold = 0.3 // 30% da largura do card

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || disabled) return
    
    const touch = e.touches[0]
    setDragState({
      isDragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      isHorizontalSwipe: false,
      touchMoved: false,
      touchEnded: false,
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || disabled || !dragState.isDragging) return
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - dragState.startX
    const deltaY = touch.clientY - dragState.startY
    
    const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // Mark that touch has moved if movement is significant
    if (totalMovement > 10) {
      setDragState(prev => ({ ...prev, touchMoved: true }))
    }
    
    // Aguardar movimento mínimo antes de determinar direção
    if (Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) {
      return
    }
    
    // Determinar direção do movimento uma vez
    if (!dragState.isHorizontalSwipe) {
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.5 // Favorece movimento vertical
      
      setDragState(prev => ({
        ...prev,
        isHorizontalSwipe: isHorizontal,
        currentX: touch.clientX,
        currentY: touch.clientY,
      }))
      
      // Só prevenir default se for claramente horizontal
      if (isHorizontal) {
        e.preventDefault()
      }
      return
    }
    
    // Se é swipe horizontal, continuar com a lógica de swipe
    if (dragState.isHorizontalSwipe) {
      e.preventDefault()
      
      const cardWidth = cardRef.current?.offsetWidth || 0
      const normalizedDelta = Math.max(-cardWidth * 0.5, Math.min(cardWidth * 0.5, deltaX))
      
      setDragState(prev => ({
        ...prev,
        currentX: touch.clientX,
        currentY: touch.clientY,
        deltaX: normalizedDelta,
        deltaY: deltaY,
      }))

      // Mostrar hint baseado na direção
      if (Math.abs(normalizedDelta) > cardWidth * 0.1) {
        if (normalizedDelta > 0) {
          setShowActionHint('complete')
        } else {
          setShowActionHint('remove')
        }
      } else {
        setShowActionHint(null)
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile || disabled || !dragState.isDragging || dragState.touchEnded) return
    
    setDragState(prev => ({ ...prev, touchEnded: true }))
    
    // Só executar ação se foi um swipe horizontal significativo
    if (dragState.isHorizontalSwipe) {
      const cardWidth = cardRef.current?.offsetWidth || 0
      const shouldTriggerAction = Math.abs(dragState.deltaX) > cardWidth * threshold

      if (shouldTriggerAction) {
        if (dragState.deltaX > 0) {
          onComplete(medicacao.id)
        } else {
          onRemove(medicacao.id)
        }
      }
    } else if (!dragState.touchMoved && onEdit) {
      // Só executar tap se não houve movimento significativo
      const totalMovement = Math.abs(dragState.deltaX) + Math.abs(dragState.deltaY)
      if (totalMovement < 30) {
        // Add small delay to ensure this is a deliberate tap
        setTimeout(() => {
          if (!dragState.isHorizontalSwipe) {
            onEdit(medicacao, origin)
          }
        }, 50)
      }
    }

    // Reset state
    setDragState({
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      deltaX: 0,
      deltaY: 0,
      isHorizontalSwipe: false,
      touchMoved: false,
      touchEnded: false,
    })
    setShowActionHint(null)
  }

  const getTransformStyle = () => {
    if (!isMobile || !dragState.isDragging || !dragState.isHorizontalSwipe) return {}
    
    return {
      transform: `translateX(${dragState.deltaX}px)`,
      transition: dragState.isDragging ? 'none' : 'transform 0.3s ease-out',
    }
  }

  const getBackgroundOverlay = () => {
    if (!isMobile || !showActionHint || !dragState.isHorizontalSwipe) return null
    
    const isComplete = showActionHint === 'complete'
    const bgColor = isComplete ? 'bg-[#344E41]' : 'bg-[#FF3B30]'
    const text = isComplete ? 'Concluir' : 'Excluir'
    const delta = Math.abs(dragState.deltaX)
    const opacity = Math.min(1, delta / 100)
    
    return (
      <div 
        className={`absolute inset-0 ${bgColor} rounded-lg flex items-center ${isComplete ? 'justify-start pl-4' : 'justify-end pr-4'} text-white z-0 transition-opacity duration-200`}
        style={{ opacity }}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="font-bold text-lg sm:text-xl">{text}</span>
          <div className="w-8 h-1 bg-white/60 rounded-full"></div>
        </div>
      </div>
    )
  }

  const hasPendingDoses = medicacao.horarios.some(h => h.status === 'pendente' && h.hora !== '-')

  const handleCardClick = () => {
    if (!isMobile && onEdit) {
      onEdit(medicacao, origin)
    }
  }

  return (
    <div className="relative">
      {getBackgroundOverlay()}
      <Card 
        ref={cardRef}
        className={`w-full shadow-card hover:shadow-floating transition-shadow duration-300 relative overflow-hidden ${
          dragState.isDragging && dragState.isHorizontalSwipe ? 'pointer-events-none' : ''
        }`}
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
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-accent">
                <Pill className="w-5 h-5 sm:w-6 sm:h-6 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-primary">
                  {medicacao.nome}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {medicacao.dosagem} • {medicacao.forma}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {medicacao.frequencia}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-col sm:text-right space-y-2 flex-shrink-0 w-full sm:w-auto sm:ml-4">
              <div className="flex items-center justify-start sm:justify-end text-primary">
                <Clock className="w-4 h-4 mr-1" />
                <span className="font-medium text-sm sm:text-base">
                  Próxima: {medicacao.proximaDose}
                </span>
              </div>
              <div className="flex items-center justify-start sm:justify-end">
                <Badge variant="outline" className="text-xs sm:text-sm">
                  {medicacao.status}
                </Badge>
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
                        ${horario.status === 'concluido'
                          ? "bg-[#588157]/20 text-[#588157] opacity-60 line-through"
                          : "bg-accent/20"
                        }
                      `}
                      style={horario.status === 'concluido' ? {
                        textDecoration: 'line-through',
                        textDecorationColor: '#588157',
                        textDecorationThickness: '2px'
                      } : {}}
                      aria-label={
                        horario.status === 'concluido' 
                          ? `Dose das ${horario.hora} registrada` 
                          : `Dose das ${horario.hora} pendente`
                      }
                    >
                      {horario.hora}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Botões para Desktop - ordem: Excluir, Alterar, Concluir */}
              {!isMobile && (
                <div className="flex gap-2 justify-start sm:justify-end mt-2">
                  {hasPendingDoses && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onRemove(medicacao.id); }}
                      className="h-8 text-xs hover:bg-destructive hover:text-destructive-foreground"
                      aria-label={`Excluir medicação ${medicacao.nome}`}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Excluir
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (onEdit) {
                        onEdit(medicacao, origin);
                      }
                    }}
                    className="h-8 text-xs"
                    aria-label={`Alterar medicação ${medicacao.nome}`}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Alterar
                  </Button>
                  {hasPendingDoses && (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onComplete(medicacao.id); }}
                      className="h-8 text-xs bg-[#588157] hover:bg-[#3A5A40]"
                      aria-label={`Marcar dose de ${medicacao.nome} como concluída`}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Concluir
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SwipeableCard