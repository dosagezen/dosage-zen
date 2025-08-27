import React, { useState, useCallback } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Stethoscope, MapPin, Clock, Check, Trash2, Edit } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

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

interface SwipeableExameCardProps {
  exame: ExameCompleto;
  onComplete: (itemId: number) => void;
  onRemove: (itemId: number) => void;
  onEdit?: (exame: ExameCompleto) => void;
}

const SwipeableExameCard: React.FC<SwipeableExameCardProps> = ({
  exame,
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
        onComplete(exame.id)
      } else {
        onRemove(exame.id)
      }
    }

    setIsDragging(false)
    setDragStart(0)
    setDragCurrent(0)
    setDragDirection(null)
  }, [isDragging, dragCurrent, dragStart, exame.id, onComplete, onRemove, isMobile])

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

  const handleCardClick = () => {
    if (isMobile && onEdit && !isDragging) {
      onEdit(exame)
    }
  }

  return (
    <div className="relative">
      {getBackgroundOverlay()}
      <Card 
        className={`w-full shadow-card hover:shadow-floating transition-shadow duration-300 relative z-10 ${isMobile && onEdit ? "cursor-pointer" : ""}`}
        style={getTransformStyle()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
      >
        <CardContent className="p-4 sm:p-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4 sm:gap-0">
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-[#588157]">
                <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-primary">
                  {exame.tipo}
                </h3>
                <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{exame.local}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-col sm:text-right space-y-2 flex-shrink-0 w-full sm:w-auto sm:ml-4">
              <div className="flex items-center justify-start sm:justify-end text-primary">
                <Clock className="w-4 h-4 mr-1" />
                <span className="font-medium text-sm sm:text-base">
                  {exame.hora}
                </span>
              </div>
              <div className="flex items-center justify-start sm:justify-end gap-2">
                <Badge 
                  variant={exame.status === 'agendado' ? 'secondary' : 'default'}
                  className="text-xs sm:text-sm"
                >
                  {exame.status === 'agendado' ? 'Agendado' : 'Concluído'}
                </Badge>
              </div>
              
              {/* Botões para Desktop - ordem: Excluir, Alterar, Concluir */}
              {!isMobile && (
                <div className="flex gap-2 justify-start sm:justify-end mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onRemove(exame.id)}
                    className="h-8 text-xs hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Excluir
                  </Button>
                  {onEdit && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onEdit(exame)}
                      className="h-8 text-xs"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Alterar
                    </Button>
                  )}
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => onComplete(exame.id)}
                    className="h-8 text-xs bg-[#588157] hover:bg-[#3A5A40]"
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

export default SwipeableExameCard