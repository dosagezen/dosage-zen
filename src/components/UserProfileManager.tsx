import { useState } from "react";
import { Plus, MoreVertical, Edit, Shield, ShieldCheck, UserCheck, Settings as SettingsIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { UserProfileForm } from "./UserProfileForm";
import { useToast } from "@/hooks/use-toast";

export type UserRole = "paciente" | "acompanhante" | "cuidador" | "admin";
export type UserStatus = "ativo" | "inativo";

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  celular: string;
  papel: UserRole;
  status: UserStatus;
  created_at: string;
  owner_user_id?: string;
}

// Dados mockados
const mockUsers: UserProfile[] = [
  {
    id: "1",
    nome: "Maria Oliveira",
    email: "maria@email.com",
    celular: "(81) 98888-8888",
    papel: "paciente",
    status: "ativo",
    created_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "2", 
    nome: "João Santos",
    email: "joao@email.com",
    celular: "(81) 99999-9999",
    papel: "acompanhante",
    status: "ativo",
    created_at: "2024-01-20T14:30:00Z",
    owner_user_id: "1"
  },
  {
    id: "3",
    nome: "Ana Nery",
    email: "ana@clinica.com", 
    celular: "(81) 97777-7777",
    papel: "cuidador",
    status: "ativo",
    created_at: "2024-02-01T09:15:00Z",
    owner_user_id: "1"
  },
  {
    id: "4",
    nome: "Equipe Admin",
    email: "admin@sistema.com",
    celular: "(81) 96666-6666", 
    papel: "admin",
    status: "ativo",
    created_at: "2024-01-01T08:00:00Z"
  }
];

const roleIcons = {
  paciente: UserCheck,
  acompanhante: Shield,
  cuidador: ShieldCheck,
  admin: SettingsIcon
};

const roleLabels = {
  paciente: "Paciente",
  acompanhante: "Acompanhante", 
  cuidador: "Cuidador",
  admin: "Admin"
};

const roleColors = {
  paciente: "bg-primary text-primary-foreground",
  acompanhante: "bg-accent text-accent-foreground",
  cuidador: "bg-success text-success-foreground",
  admin: "bg-muted text-muted-foreground"
};

export const UserProfileManager = () => {
  const [users, setUsers] = useState<UserProfile[]>(mockUsers);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  const currentUser = users.find(u => u.papel === "paciente"); // Simula usuário logado

  const canManageUser = (user: UserProfile) => {
    if (!currentUser) return false;
    if (currentUser.papel === "paciente") {
      return user.papel === "acompanhante" || user.papel === "cuidador" || user.id === currentUser.id;
    }
    return false;
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === "ativo" ? "inativo" : "ativo" as UserStatus }
        : user
    ));
    
    const user = users.find(u => u.id === userId);
    const newStatus = user?.status === "ativo" ? "inativo" : "ativo";
    
    toast({
      title: "Status atualizado",
      description: `Usuário ${newStatus === "ativo" ? "ativado" : "inativado"} com sucesso.`,
    });
  };

  const handleRemoveUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (user.papel === "paciente") {
      toast({
        title: "Erro",
        description: "Não é possível remover o perfil principal do paciente.",
        variant: "destructive"
      });
      return;
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    toast({
      title: "Usuário removido",
      description: `${user.nome} foi removido com sucesso.`,
    });
  };

  const handleSaveUser = (userData: Omit<UserProfile, 'id' | 'created_at'>) => {
    if (editingUser) {
      // Editar usuário existente
      setUsers(prev => prev.map(user => 
        user.id === editingUser.id 
          ? { ...user, ...userData }
          : user
      ));
      toast({
        title: "Usuário atualizado",
        description: "Perfil atualizado com sucesso.",
      });
    } else {
      // Criar novo usuário
      const newUser: UserProfile = {
        ...userData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        owner_user_id: currentUser?.id
      };
      setUsers(prev => [...prev, newUser]);
      toast({
        title: "Usuário criado",
        description: "Novo perfil criado com sucesso.",
      });
    }
    
    setEditingUser(null);
    setIsCreateDialogOpen(false);
  };

  const canCreateProfiles = currentUser?.papel === "paciente";

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-primary">Perfis de Usuário</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie os usuários com acesso ao sistema
              </p>
            </div>
            {canCreateProfiles && (
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-primary hover:bg-primary-hover w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Perfil
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Usuários */}
      <div className="grid gap-4">
        {users.map((user) => {
          const RoleIcon = roleIcons[user.papel];
          const canManage = canManageUser(user);
          
          return (
            <Card key={user.id} className="shadow-card hover:shadow-floating transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <Avatar className="w-12 h-12 bg-gradient-primary">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                      {user.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-1">
                      <h3 className="font-semibold text-foreground truncate mb-1">
                        {user.nome}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={`${roleColors[user.papel]} text-xs shrink-0 w-fit`}
                        >
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {roleLabels[user.papel]}
                        </Badge>
                        <Badge 
                          variant={user.status === "ativo" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {user.status === "ativo" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="truncate">{user.email}</p>
                      <p className="truncate">{user.celular}</p>
                    </div>
                  </div>

                  {/* Ações */}
                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                          onClick={() => setEditingUser(user)}
                          className="cursor-pointer"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleStatus(user.id)}
                          className="cursor-pointer"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          {user.status === "ativo" ? "Inativar" : "Ativar"}
                        </DropdownMenuItem>
                        {user.papel !== "paciente" && (
                          <DropdownMenuItem 
                            onClick={() => handleRemoveUser(user.id)}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Informações sobre Permissões */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg text-primary">Permissões por Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                <span className="font-medium">Paciente</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• CRUD completo de medicações e agendas</li>
                <li>• Gestão de Acompanhantes e Cuidadores</li>
                <li>• Acesso total ao plano de assinatura</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                <span className="font-medium">Acompanhante</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Acesso igual ao Paciente</li>
                <li>• Gestão completa dos dados</li>
                <li>• Acesso ao plano de assinatura</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-success" />
                <span className="font-medium">Cuidador</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Apenas registrar conclusões</li>
                <li>• Não pode criar/editar/excluir</li>
                <li>• Sem acesso ao plano</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Admin</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Configurações do sistema</li>
                <li>• Relatórios técnicos</li>
                <li>• Sem acesso a dados pessoais</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diálogos */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <UserProfileForm 
          onSave={handleSaveUser}
          onCancel={() => setIsCreateDialogOpen(false)}
        />
      </Dialog>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <UserProfileForm 
          user={editingUser}
          onSave={handleSaveUser}
          onCancel={() => setEditingUser(null)}
        />
      </Dialog>
    </div>
  );
};