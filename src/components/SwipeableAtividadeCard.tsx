import React, { useState, useCallback } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Clock, Check, Trash2, Edit } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

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

interface SwipeableAtividadeCardProps {
  atividade: AtividadeCompleta;
  onComplete: (id: number, type: 'atividade') => void;
  onRemove: (id: number, type: 'atividade') => void;
  onEdit?: (id: number) => void;
}

const SwipeableAtividadeCard: React.FC<SwipeableAtividadeCardProps> = ({
  atividade,
  onComplete,
  onRemove,
  onEdit
}) => {
  const isMobile = useIsMobile()
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const [dragCurrent, setDragCurrent] = useState(0)
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return
    setIsDragging(true)
    setDragStart(e.touches[0].clientX)
    setDragCurrent(e.touches[0].clientX)
  }, [isMobile])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !isMobile) return
    
    const current = e.touches[0].clientX
    setDragCurrent(current)
    
    const delta = current - dragStart
    const direction = delta > 0 ? 'right' : 'left'
    setDragDirection(Math.abs(delta) > 20 ? direction : null)
  }, [isDragging, dragStart, isMobile])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || !isMobile) return
    
    const delta = dragCurrent - dragStart
    const threshold = 100

    if (Math.abs(delta) > threshold) {
      if (delta > 0) {
        // Swipe direita - concluir
        onComplete(atividade.id, 'atividade')
      } else {
        // Swipe esquerda - remover
        onRemove(atividade.id, 'atividade')
      }
    }

    setIsDragging(false)
    setDragStart(0)
    setDragCurrent(0)
    setDragDirection(null)
  }, [isDragging, dragCurrent, dragStart, atividade.id, onComplete, onRemove, isMobile])

  const getTransformStyle = () => {
    if (!isDragging) return {}
    
    const delta = dragCurrent - dragStart
    const maxTranslate = 120
    const translate = Math.max(-maxTranslate, Math.min(maxTranslate, delta * 0.4))
    
    return {
      transform: `translateX(${translate}px)`,
      transition: 'none'
    }
  }

  const getBackgroundOverlay = () => {
    if (!isDragging || !dragDirection) return null

    const isComplete = dragDirection === 'right'
    const bgColor = isComplete ? 'bg-[#344E41]' : 'bg-[#FF3B30]'
    const text = isComplete ? 'Concluir' : 'Excluir'
    const delta = Math.abs(dragCurrent - dragStart)
    const opacity = Math.min(1, delta / 80)

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

  return (
    <div className="relative">
      {getBackgroundOverlay()}
      <Card 
        className="w-full shadow-card hover:shadow-floating transition-shadow duration-300 relative z-10"
        style={getTransformStyle()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardContent className="p-4 sm:p-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4 sm:gap-0">
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-[#588157]">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-primary">
                  {atividade.tipo}
                </h3>
                <div className="flex items-center gap-1 text-sm sm:text-base text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{atividade.local}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-col sm:text-right space-y-2 flex-shrink-0 w-full sm:w-auto sm:ml-4">
              <div className="flex items-center justify-start sm:justify-end text-primary">
                <Clock className="w-4 h-4 mr-1" />
                <span className="font-medium text-sm sm:text-base">
                  {atividade.hora} ({atividade.duracao})
                </span>
              </div>
              
              {/* Chips dos dias da semana */}
              {atividade.dias && atividade.dias.length > 0 && (
                <div className="flex items-center justify-start sm:justify-end gap-1 flex-wrap">
                  {atividade.dias.map((dia, index) => (
                    <Badge 
                      key={dia} 
                      variant="outline" 
                      className="text-xs px-2 py-0.5 border-[#344E41] text-[#344E41]"
                    >
                      {dia}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-start sm:justify-end gap-2 flex-wrap">
                <Badge 
                  variant={atividade.status === 'pendente' ? 'secondary' : 'default'}
                  className="text-xs sm:text-sm"
                >
                  {atividade.status === 'pendente' ? 'Pendente' : 'Concluído'}
                </Badge>
                
                {/* Badge de repetição */}
                {atividade.repeticao && (
                  <Badge 
                    variant="outline"
                    className={`text-xs ${atividade.repeticao === 'Toda semana' 
                      ? 'border-[#588157] text-[#588157]' 
                      : 'border-muted-foreground text-muted-foreground'
                    }`}
                  >
                    {atividade.repeticao === 'Toda semana' ? 'Repetição semanal' : 'Próxima ocorrência'}
                  </Badge>
                )}
              </div>
              
              {/* Botões para Desktop */}
              {!isMobile && (
                <div className="flex gap-2 justify-start sm:justify-end mt-2">
                  {onEdit && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onEdit(atividade.id)}
                      className="h-8 text-xs"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onRemove(atividade.id, 'atividade')}
                    className="h-8 text-xs hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Excluir
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => onComplete(atividade.id, 'atividade')}
                    className="h-8 text-xs bg-[#588157] hover:bg-[#3A5A40]"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Concluir
                  </Button>
                </div>
              )}
              
              {/* Botão Edit para Mobile */}
              {isMobile && onEdit && (
                <div className="flex justify-start sm:justify-end mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEdit(atividade.id)}
                    className="h-8 text-xs"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
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

export default SwipeableAtividadeCard