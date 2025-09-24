import React, { createContext, useContext, useCallback, useState } from 'react';

export interface CompromissosEvent {
  type: 'complete' | 'cancel' | 'undo' | 'restore';
  itemId: string;
  itemType: 'medicacao' | 'consulta' | 'exame' | 'atividade';
  timestamp: number;
}

interface CompromissosEventContextType {
  onCompromissoAtualizado: (event: CompromissosEvent) => void;
  subscribeToUpdates: (callback: (event: CompromissosEvent) => void) => () => void;
}

const CompromissosEventContext = createContext<CompromissosEventContextType | undefined>(undefined);

export function CompromissosEventProvider({ children }: { children: React.ReactNode }) {
  const [listeners, setListeners] = useState<Set<(event: CompromissosEvent) => void>>(new Set());

  const onCompromissoAtualizado = useCallback((event: CompromissosEvent) => {
    // Notify all listeners
    listeners.forEach(callback => callback(event));
  }, [listeners]);

  const subscribeToUpdates = useCallback((callback: (event: CompromissosEvent) => void) => {
    setListeners(prev => new Set([...prev, callback]));
    
    // Return unsubscribe function
    return () => {
      setListeners(prev => {
        const next = new Set(prev);
        next.delete(callback);
        return next;
      });
    };
  }, []);

  return (
    <CompromissosEventContext.Provider value={{ onCompromissoAtualizado, subscribeToUpdates }}>
      {children}
    </CompromissosEventContext.Provider>
  );
}

export function useCompromissosEvents() {
  const context = useContext(CompromissosEventContext);
  if (!context) {
    throw new Error('useCompromissosEvents must be used within CompromissosEventProvider');
  }
  return context;
}