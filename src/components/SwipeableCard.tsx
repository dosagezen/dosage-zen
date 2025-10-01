import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeComplete?: () => void;
  onSwipeCancel?: () => void;
  onEdit?: () => void;
  disabled?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeComplete,
  onSwipeCancel,
  onEdit,
  disabled = false
}) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startX;
    
    // Limit the drag distance
    const maxDrag = 120;
    const limitedDelta = Math.max(-maxDrag, Math.min(maxDrag, deltaX));
    setDragX(limitedDelta);

    // Prevent scrolling when swiping horizontally
    if (Math.abs(deltaX) > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || disabled) return;
    
    const threshold = 60;
    
    if (dragX > threshold && onSwipeComplete) {
      // Swipe right - complete
      onSwipeComplete();
      toast({
        title: "Concluído",
        description: "Compromisso marcado como concluído",
      });
    } else if (dragX < -threshold && onSwipeCancel) {
      // Swipe left - cancel
      onSwipeCancel();
      toast({
        title: "Cancelado",
        description: "Compromisso cancelado",
        variant: "destructive",
      });
    } else if (Math.abs(dragX) < 10 && onEdit) {
      // Tap - edit
      onEdit();
    }
    
    setDragX(0);
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isMobile) return;
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled || isMobile) return;
    
    const currentX = e.clientX;
    const deltaX = currentX - startX;
    
    const maxDrag = 120;
    const limitedDelta = Math.max(-maxDrag, Math.min(maxDrag, deltaX));
    setDragX(limitedDelta);
  };

  const handleMouseUp = () => {
    if (!isDragging || disabled || isMobile) return;
    handleTouchEnd();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Desabilitar clique para editar no desktop, pois agora temos botões explícitos
    // Mantém apenas para mobile
    if (disabled || !isMobile || isDragging) return;
    
    // Only trigger edit on mobile tap
    if (onEdit && !isDragging) {
      onEdit();
    }
  };

  const getTransformStyle = () => {
    return {
      transform: `translateX(${dragX}px)`,
      transition: isDragging ? 'none' : 'transform 0.3s ease-out',
    };
  };

  const getBackgroundOverlay = () => {
    if (Math.abs(dragX) < 20) return null;
    
    const isComplete = dragX > 0;
    const opacity = Math.min(Math.abs(dragX) / 60, 1);
    
    return (
      <div 
        className={`absolute inset-0 flex items-center ${
          isComplete ? 'justify-start pl-4 bg-green-100' : 'justify-end pr-4 bg-red-100'
        }`}
        style={{ opacity }}
      >
        <div className={`flex items-center gap-2 ${
          isComplete ? 'text-green-600' : 'text-red-600'
        }`}>
          {isComplete ? (
            <>
              <Check className="w-5 h-5" />
              <span className="font-medium">Concluir</span>
            </>
          ) : (
            <>
              <X className="w-5 h-5" />
              <span className="font-medium">Cancelar</span>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {getBackgroundOverlay()}
      
      <div
        ref={cardRef}
        style={getTransformStyle()}
        className={`relative ${!disabled && isMobile ? 'touch-pan-y' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCardClick}
      >
        {children}
        
        {/* Desktop action buttons */}
        {!isMobile && !disabled && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onSwipeCancel && (
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwipeCancel();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            {onSwipeComplete && (
              <Button
                size="sm"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwipeComplete();
                }}
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};