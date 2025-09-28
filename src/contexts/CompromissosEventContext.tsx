import React, { createContext, useContext, useCallback, useState } from 'react';

export interface CompromissosEvent {
  type: 'complete' | 'cancel' | 'undo' | 'restore';
  itemId: string;
  itemType: 'medicacao' | 'consulta' | 'exame' | 'atividade';
  timestamp: number;
}

export interface ConquestsEvent {
  type: 'conquests:updated';
  contextId: string;
  category: string;
  action: string;
  timestamp: number;
}

interface CompromissosEventContextType {
  onCompromissoAtualizado: (event: CompromissosEvent) => void;
  subscribeToUpdates: (callback: (event: CompromissosEvent) => void) => () => void;
  emitConquestsUpdate: (event: ConquestsEvent) => void;
  subscribeToConquestsUpdates: (callback: (event: ConquestsEvent) => void) => () => void;
}

const CompromissosEventContext = createContext<CompromissosEventContextType | undefined>(undefined);

export function CompromissosEventProvider({ children }: { children: React.ReactNode }) {
  const [listeners, setListeners] = useState<Set<(event: CompromissosEvent) => void>>(new Set());
  const [conquestsListeners, setConquestsListeners] = useState<Set<(event: ConquestsEvent) => void>>(new Set());

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

  const emitConquestsUpdate = useCallback((event: ConquestsEvent) => {
    // Notify all conquest listeners
    conquestsListeners.forEach(callback => callback(event));
  }, [conquestsListeners]);

  const subscribeToConquestsUpdates = useCallback((callback: (event: ConquestsEvent) => void) => {
    setConquestsListeners(prev => new Set([...prev, callback]));
    
    // Return unsubscribe function
    return () => {
      setConquestsListeners(prev => {
        const next = new Set(prev);
        next.delete(callback);
        return next;
      });
    };
  }, []);

  return (
    <CompromissosEventContext.Provider value={{ 
      onCompromissoAtualizado, 
      subscribeToUpdates,
      emitConquestsUpdate,
      subscribeToConquestsUpdates
    }}>
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