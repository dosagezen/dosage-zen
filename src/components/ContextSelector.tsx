import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Heart, Shield, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ContextOption {
  id: string;
  name: string;
  role: string;
  isGestor: boolean;
  isPaciente: boolean;
}

export const ContextSelector: React.FC = () => {
  const { profile, userRoles, currentContext, switchContext } = useAuth();

  if (!profile || userRoles.length <= 1) {
    return null; // Não mostrar se só tem um contexto
  }

  // Construir opções de contexto baseado nos roles do usuário
  const contextOptions: ContextOption[] = userRoles.map(role => {
    const isPaciente = role.role === 'paciente';
    const contextId = role.context_patient_id || profile.id;
    
    return {
      id: contextId,
      name: isPaciente ? profile.nome : `${profile.nome} (${role.role})`,
      role: role.role,
      isGestor: profile.is_gestor,
      isPaciente,
    };
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'paciente': return <User className="w-4 h-4" />;
      case 'acompanhante': return <Heart className="w-4 h-4" />;
      case 'cuidador': return <Shield className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'paciente': return 'text-primary';
      case 'acompanhante': return 'text-accent';
      case 'cuidador': return 'text-secondary';
      default: return 'text-muted-foreground';
    }
  };

  const currentOption = contextOptions.find(opt => opt.id === currentContext);

  return (
    <div className="flex items-center gap-2 min-w-0 flex-shrink">
      <span className="text-sm text-muted-foreground hidden sm:inline">Atuando como:</span>
      <Select value={currentContext || ''} onValueChange={switchContext}>
        <SelectTrigger className="w-[140px] sm:w-auto sm:min-w-[200px] max-w-[60vw] min-w-0">
          <SelectValue>
            {currentOption && (
              <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                <span className={`${getRoleColor(currentOption.role)} flex-shrink-0`}>
                  {getRoleIcon(currentOption.role)}
                </span>
                <span className="font-medium truncate">{currentOption.name}</span>
                {currentOption.isGestor && (
                  <Badge variant="secondary" className="text-xs flex-shrink-0 hidden sm:flex">
                    <Crown className="w-3 h-3 mr-1" />
                    Gestor
                  </Badge>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {contextOptions.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              <div className="flex items-center gap-3 py-1">
                <span className={getRoleColor(option.role)}>
                  {getRoleIcon(option.role)}
                </span>
                <div className="flex flex-col">
                  <span className="font-medium">{option.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {option.role}
                  </span>
                </div>
                {option.isGestor && (
                  <Badge variant="secondary" className="text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Gestor
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};