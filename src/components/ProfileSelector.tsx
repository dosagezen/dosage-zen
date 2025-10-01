import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { User, Heart, Shield } from 'lucide-react';
interface ProfileSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}
const profileOptions = [{
  value: 'paciente',
  label: 'Paciente',
  description: 'Perfil principal com acesso completo (requer assinatura)',
  icon: User,
  color: 'text-primary'
}, {
  value: 'acompanhante',
  label: 'Acompanhante',
  description: 'Familiar ou amigo próximo',
  icon: Heart,
  color: 'text-accent'
}, {
  value: 'cuidador',
  label: 'Cuidador',
  description: 'Profissional técnico especializado',
  icon: Shield,
  color: 'text-secondary'
}];
export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  return <div className="space-y-3">
      <Label htmlFor="profile-select" className="text-sm font-medium">
        Perfil Inicial
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="profile-select" className="w-full py-2">
          <SelectValue placeholder="Selecione seu perfil" />
        </SelectTrigger>
        <SelectContent>
          {profileOptions.map(option => {
          const IconComponent = option.icon;
          return <SelectItem key={option.value} value={option.value}>
                <div className="flex items-start gap-3 py-2 w-full">
                  <IconComponent className={`w-5 h-5 ${option.color} mt-0.5`} />
                  <div className="flex flex-col text-left">
                    <span className="font-medium text-left">{option.label}</span>
                    <span className="text-xs text-muted-foreground text-left">
                      {option.description}
                    </span>
                  </div>
                </div>
              </SelectItem>;
        })}
        </SelectContent>
      </Select>
      
      {value === 'paciente' && <div className="bg-primary/10 border border-primary/20 rounded-md p-3">
          <p className="text-sm text-primary font-medium">
            💰 Perfil Principal
          </p>
          <p className="text-xs text-muted-foreground mt-1">O perfil "Paciente" é o perfil principal do sistema e requer assinatura paga mensalmente. Você será direcionado para o checkout após criar sua conta. </p>
        </div>}
      
      {value && value !== 'paciente' && <div className="bg-muted/50 border border-border rounded-md p-3">
          <p className="text-sm text-foreground font-medium">
            ✨ Perfil Colaborador
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Este perfil permite colaborar com pacientes que o convidarem.
            Não requer assinatura própria.
          </p>
        </div>}
    </div>;
};