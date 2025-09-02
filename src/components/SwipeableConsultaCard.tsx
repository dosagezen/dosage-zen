import React, { useState, useCallback } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, MapPin, Clock, Check, Trash2, Edit } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

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

interface SwipeableConsultaCardProps {
  consulta: ConsultaCompleta;
  onComplete: (id: number) => void;
  onRemove: (id: number) => void;
  onEdit?: (consulta: ConsultaCompleta) => void;
}

const SwipeableConsultaCard: React.FC<SwipeableConsultaCardProps> = ({
  consulta,
  onComplete,
  onRemove,
  onEdit
}) => {
  const isMobile = useIsMobile()
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 })
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null)
  const [touchMoved, setTouchMoved] = useState(false)
  const [touchEnded, setTouchEnded] = useState(false)
  const [isHorizontalSwipe, setIsHorizontalSwipe] = useState(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX, y: touch.clientY })
    setDragCurrent({ x: touch.clientX, y: touch.clientY })
    setDragDirection(null)
    setTouchMoved(false)
    setTouchEnded(false)
    setIsHorizontalSwipe(false)
  }, [isMobile])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !isMobile) return
    
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
  }, [isDragging, dragStart, isMobile, isHorizontalSwipe])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || !isMobile || touchEnded) return
    setTouchEnded(true)
    
    if (isHorizontalSwipe && dragDirection) {
      const deltaX = dragCurrent.x - dragStart.x
      const threshold = 100

      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onComplete(consulta.id)
        } else {
          onRemove(consulta.id)
        }
      }
    } else if (!touchMoved && onEdit) {
      // Only trigger edit if there was minimal movement (tap gesture)
      const deltaX = dragCurrent.x - dragStart.x
      const deltaY = dragCurrent.y - dragStart.y
      const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      if (totalMovement < 30) {
        // Add small delay to ensure this is a deliberate tap
        setTimeout(() => {
          if (!isHorizontalSwipe) {
            onEdit(consulta)
          }
        }, 50)
      }
    }

    setIsDragging(false)
    setDragStart({ x: 0, y: 0 })
    setDragCurrent({ x: 0, y: 0 })
    setDragDirection(null)
    setIsHorizontalSwipe(false)
  }, [isDragging, dragCurrent, dragStart, consulta.id, onComplete, onRemove, isMobile, touchEnded, touchMoved, onEdit, isHorizontalSwipe])

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
    const text = isComplete ? 'Concluir' : 'Excluir'
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
    if (!isMobile && onEdit) {
      onEdit(consulta)
    }
  }

  return (
    <div className="relative">
      {getBackgroundOverlay()}
      <Card 
        className={`w-full shadow-card hover:shadow-floating transition-shadow duration-300 relative z-10 ${
          isDragging && isHorizontalSwipe ? 'pointer-events-none' : ''
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
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-[#A3B18A]">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-primary">
                  {consulta.especialidade}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {consulta.profissional}
                </p>
                <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{consulta.local}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-col sm:text-right space-y-2 flex-shrink-0 w-full sm:w-auto sm:ml-4">
              <div className="flex items-center justify-start sm:justify-end text-primary">
                <Clock className="w-4 h-4 mr-1" />
                <span className="font-medium text-sm sm:text-base">
                  {consulta.hora}
                </span>
              </div>
              <div className="flex items-center justify-start sm:justify-end gap-2">
                <Badge 
                  variant={consulta.status === 'confirmado' ? 'default' : 'secondary'}
                  className="text-xs sm:text-sm"
                >
                  {consulta.status === 'agendado' ? 'Agendado' : 
                   consulta.status === 'confirmado' ? 'Confirmado' : 'Concluído'}
                </Badge>
              </div>
              
              {/* Botões para Desktop - ordem: Excluir, Alterar, Concluir */}
              {!isMobile && (
                <div className="flex gap-2 justify-start sm:justify-end mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onRemove(consulta.id)}
                    className="h-8 text-xs hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Excluir
                  </Button>
                  {onEdit && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onEdit(consulta)}
                      className="h-8 text-xs"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Alterar
                    </Button>
                  )}
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => onComplete(consulta.id)}
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

export default SwipeableConsultaCard