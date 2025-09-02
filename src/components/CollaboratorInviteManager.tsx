import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CollaboratorInviteManagerProps {
  onInviteSent?: () => void;
}

interface FoundUser {
  id: string;
  nome: string;
  email: string;
  celular?: string;
  codigo: string;
}

export const CollaboratorInviteManager: React.FC<CollaboratorInviteManagerProps> = ({
  onInviteSent
}) => {
  const [searchCode, setSearchCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<'acompanhante' | 'cuidador'>('acompanhante');
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [currentStep, setCurrentStep] = useState<'search' | 'confirm'>('search');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { profile } = useAuth();

  // Códigos mock para demonstração
  const mockCodes = [
    { code: 'ABC123', name: 'João Silva', email: 'joao@email.com' },
    { code: 'DEF456', name: 'Ana Santos', email: 'ana@email.com' },
    { code: 'GHI789', name: 'Pedro Costa', email: 'pedro@email.com' },
    { code: 'JKL012', name: 'Maria Ferreira', email: 'maria@email.com' },
  ];

  const searchUser = async () => {
    if (!searchCode.trim()) {
      toast({
        title: "Código obrigatório",
        description: "Digite o código do colaborador para buscar.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Buscar usuário real no banco
      const { data: userData, error } = await supabase
        .from('profiles')
        .select('id, nome, email, celular, codigo')
        .eq('codigo', searchCode.toUpperCase())
        .single();

      if (error || !userData) {
        // Usar dados mock se não encontrar no banco
        const mockUser = mockCodes.find(u => u.code === searchCode.toUpperCase());
        if (mockUser) {
          setFoundUser({
            id: 'mock-' + mockUser.code,
            nome: mockUser.name,
            email: mockUser.email,
            codigo: mockUser.code,
          });
          setCurrentStep('confirm');
          toast({
            title: "Usuário encontrado (demo)",
            description: `${mockUser.name} encontrado com sucesso!`,
          });
        } else {
          toast({
            title: "Usuário não encontrado",
            description: "Nenhum usuário encontrado com este código.",
            variant: "destructive"
          });
        }
      } else {
        setFoundUser(userData);
        setCurrentStep('confirm');
        toast({
          title: "Usuário encontrado",
          description: `${userData.nome} encontrado com sucesso!`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Erro ao buscar usuário. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvite = async () => {
    if (!foundUser || !profile) return;

    setIsLoading(true);
    
    try {
      // Criar convite no banco
      const { error } = await supabase
        .from('invitations')
        .insert({
          patient_profile_id: profile.id,
          collaborator_code: foundUser.codigo,
          collaborator_role: selectedRole,
          created_by: profile.user_id,
        });

      if (error) {
        toast({
          title: "Erro ao enviar convite",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Convite enviado!",
        description: `Convite para ${foundUser.nome} enviado com sucesso.`,
      });

      // Reset do formulário
      setSearchCode('');
      setFoundUser(null);
      setCurrentStep('search');
      setSelectedRole('acompanhante');
      
      onInviteSent?.();
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar convite. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({
        title: "Código copiado!",
        description: `Código ${code} copiado para a área de transferência.`,
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o código.",
        variant: "destructive"
      });
    }
  };

  const formatCode = (value: string) => {
    return value.replace(/[^A-Z0-9]/g, '').toUpperCase().slice(0, 6);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchCode(formatCode(e.target.value));
  };

  return (
    <div className="space-y-6">
      {currentStep === 'search' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Convidar Colaborador
            </CardTitle>
            <CardDescription>
              Digite o código único do usuário que deseja convidar como colaborador.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="search-code">Código do Usuário</Label>
                <Input
                  id="search-code"
                  placeholder="Ex: ABC123"
                  value={searchCode}
                  onChange={handleCodeChange}
                  className="uppercase"
                  maxLength={6}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={searchUser}
                  disabled={isLoading || !searchCode.trim()}
                  className="px-4"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Códigos de teste disponíveis */}
            <div className="bg-muted/30 p-4 rounded-lg border">
              <h4 className="text-sm font-medium mb-3">Códigos de teste disponíveis:</h4>
              <div className="grid grid-cols-2 gap-2">
                {mockCodes.map((user) => (
                  <div key={user.code} className="flex items-center justify-between p-2 bg-background rounded border">
                    <div className="text-sm">
                      <div className="font-medium">{user.code}</div>
                      <div className="text-muted-foreground text-xs">{user.name}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyCode(user.code)}
                      className="h-6 w-6 p-0"
                    >
                      {copiedCode === user.code ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'confirm' && foundUser && (
        <Card>
          <CardHeader>
            <CardTitle>Confirmar Convite</CardTitle>
            <CardDescription>
              Revise os dados do colaborador antes de enviar o convite.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dados do usuário encontrado */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Dados do Colaborador:</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Nome:</strong> {foundUser.nome}</div>
                <div><strong>E-mail:</strong> {foundUser.email}</div>
                {foundUser.celular && (
                  <div><strong>Celular:</strong> {foundUser.celular}</div>
                )}
                <div><strong>Código:</strong> 
                  <Badge variant="outline" className="ml-2">{foundUser.codigo}</Badge>
                </div>
              </div>
            </div>

            {/* Seleção do papel */}
            <div className="space-y-2">
              <Label>Papel do Colaborador</Label>
              <Select value={selectedRole} onValueChange={(value: 'acompanhante' | 'cuidador') => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acompanhante">
                    <div className="flex flex-col">
                      <span className="font-medium">Acompanhante</span>
                      <span className="text-xs text-muted-foreground">
                        Familiar ou amigo próximo, pode ser promovido a Gestor
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cuidador">
                    <div className="flex flex-col">
                      <span className="font-medium">Cuidador</span>
                      <span className="text-xs text-muted-foreground">
                        Profissional técnico, acesso somente leitura
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resumo do convite */}
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h4 className="font-medium text-primary mb-2">Resumo do Convite:</h4>
              <p className="text-sm">
                <strong>{foundUser.nome}</strong> será convidado como <strong>{selectedRole}</strong> 
                para colaborar em sua conta. O usuário receberá uma notificação para aceitar o convite.
              </p>
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setCurrentStep('search');
                  setFoundUser(null);
                }}
                disabled={isLoading}
              >
                Voltar
              </Button>
              <Button 
                onClick={sendInvite}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </div>
                ) : (
                  'Enviar Convite'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};