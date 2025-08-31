import { useState } from "react";
import { Plus, MoreVertical, Edit, Shield, ShieldCheck, UserCheck, Settings as SettingsIcon, Crown, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { UserProfileForm } from "./UserProfileForm";
import AddCollaboratorDialog from "./AddCollaboratorDialog";
import { useToast } from "@/hooks/use-toast";

export type UserRole = "paciente" | "acompanhante" | "cuidador" | "admin";
export type UserStatus = "ativo" | "inativo" | "pendente";

export interface UserProfile {
  id: string;
  codigo: string;
  nome: string;
  email: string;
  celular: string;
  papel: UserRole;
  status: UserStatus;
  created_at: string;
  owner_user_id?: string;
  isGestor?: boolean;
}

// Função para gerar código único alfanumérico de 6 dígitos
const generateUniqueCode = (existingCodes: string[]): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  
  do {
    code = Array.from({ length: 6 }, () => 
      characters.charAt(Math.floor(Math.random() * characters.length))
    ).join('');
  } while (existingCodes.includes(code));
  
  return code;
};

// Dados mockados
const mockUsers: UserProfile[] = [
  {
    id: "1",
    codigo: "X7M2A9",
    nome: "Maria Oliveira",
    email: "maria@email.com",
    celular: "(81) 98888-8888",
    papel: "paciente",
    status: "ativo",
    created_at: "2024-01-15T10:00:00Z",
    isGestor: true
  },
  {
    id: "2", 
    codigo: "R4C1Z8",
    nome: "João Santos",
    email: "joao@email.com",
    celular: "(81) 99999-9999",
    papel: "acompanhante",
    status: "ativo",
    created_at: "2024-01-20T14:30:00Z",
    owner_user_id: "1",
    isGestor: false
  },
  {
    id: "3",
    codigo: "K3P9Q2",
    nome: "Ana Nery",
    email: "ana@clinica.com", 
    celular: "(81) 97777-7777",
    papel: "cuidador",
    status: "ativo",
    created_at: "2024-02-01T09:15:00Z",
    owner_user_id: "1",
    isGestor: false
  },
  {
    id: "4",
    codigo: "T6B8D5",
    nome: "Equipe Admin",
    email: "admin@sistema.com",
    celular: "(81) 96666-6666", 
    papel: "admin",
    status: "ativo",
    created_at: "2024-01-01T08:00:00Z",
    isGestor: false
  },
  {
    id: "5",
    codigo: "M8K2P7",
    nome: "Carlos Silva",
    email: "carlos@email.com",
    celular: "(81) 95555-5555",
    papel: "acompanhante",
    status: "pendente",
    created_at: "2024-08-30T12:00:00Z",
    owner_user_id: "1",
    isGestor: false
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
  const [isAddCollaboratorOpen, setIsAddCollaboratorOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  const currentUser = users.find(u => u.papel === "paciente" || u.isGestor); // Simula usuário logado

  const canManageUser = (user: UserProfile) => {
    if (!currentUser) return false;
    
    // Gestor tem poder total
    if (currentUser.isGestor) {
      return true;
    }
    
    // Paciente pode gerenciar acompanhantes e cuidadores
    if (currentUser.papel === "paciente") {
      return user.papel === "acompanhante" || user.papel === "cuidador" || user.id === currentUser.id;
    }
    
    return false;
  };

  const canPromoteToGestor = (user: UserProfile) => {
    if (!currentUser?.isGestor) return false;
    return (user.papel === "paciente" || user.papel === "acompanhante") && !user.isGestor;
  };

  const hasGestor = users.some(u => u.isGestor && u.papel === "paciente");

  const searchUserByCode = (codigo: string) => {
    // Simula busca por código em base de usuários externa
    const availableUsers = [
      { codigo: "M8K2P7", nome: "Carlos Silva", email: "carlos@email.com", celular: "(81) 95555-5555" }
    ];
    
    return availableUsers.find(u => u.codigo.toUpperCase() === codigo.toUpperCase());
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

  const handlePromoteToGestor = (userId: string) => {
    if (!canPromoteToGestor(users.find(u => u.id === userId)!)) return;

    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        return { ...user, isGestor: !user.isGestor };
      }
      // Se promovendo alguém a gestor, remover gestor atual (só pode ter 1)
      if (user.isGestor && user.papel === "paciente" && userId !== user.id) {
        return { ...user, isGestor: false };
      }
      return user;
    }));

    const user = users.find(u => u.id === userId);
    const action = user?.isGestor ? "removido" : "promovido";
    
    toast({
      title: `Gestor ${action}`,
      description: `${user?.nome} foi ${action} ${action === "promovido" ? "a" : "de"} gestor.`,
    });
  };

  const handleSaveUser = (userData: Omit<UserProfile, 'id' | 'created_at' | 'codigo'>) => {
    if (editingUser) {
      // Editar usuário existente (mantém o código existente)
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
      // Criar novo usuário (gera código automaticamente)
      const existingCodes = users.map(u => u.codigo);
      const newCode = generateUniqueCode(existingCodes);
      
      const newUser: UserProfile = {
        ...userData,
        id: Date.now().toString(),
        codigo: newCode,
        created_at: new Date().toISOString(),
        owner_user_id: currentUser?.id,
        isGestor: false
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

  const handleAddCollaborator = (data: { papel: string; codigo: string; status: string }) => {
    const foundUser = searchUserByCode(data.codigo);
    
    if (foundUser) {
      const existingCodes = users.map(u => u.codigo);
      const newCode = data.codigo; // Usar código do usuário encontrado
      
      const newUser: UserProfile = {
        id: Date.now().toString(),
        codigo: newCode,
        nome: foundUser.nome,
        email: foundUser.email,
        celular: foundUser.celular,
        papel: data.papel as UserRole,
        status: data.status as UserStatus,
        created_at: new Date().toISOString(),
        owner_user_id: currentUser?.id,
        isGestor: false
      };
      
      setUsers(prev => [...prev, newUser]);
    }
    
    setIsAddCollaboratorOpen(false);
  };

  const canCreateCollaborators = currentUser?.isGestor || currentUser?.papel === "paciente";

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-primary">Colaboradores</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie os colaboradores que têm acesso ao sistema
              </p>
            </div>
            {canCreateCollaborators && (
              <Button 
                onClick={() => setIsAddCollaboratorOpen(true)}
                className="bg-primary hover:bg-primary-hover w-full sm:w-auto"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Colaborador
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
                       {/* Linha com Código, Papel e Status */}
                       <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                         <Badge 
                           className="bg-slate-900 text-white font-semibold text-xs"
                           aria-label="Código do usuário"
                           aria-readonly="true"
                         >
                           {user.codigo}
                         </Badge>
                         <div className="flex items-center gap-1">
                           <Badge 
                             className={`${roleColors[user.papel]} text-xs shrink-0 w-fit`}
                           >
                             {roleLabels[user.papel]}
                           </Badge>
                           {user.isGestor && (
                             <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-semibold">
                               Gestor
                             </Badge>
                           )}
                         </div>
                         <Badge 
                           className={`text-xs ${
                             user.status === "ativo" 
                               ? "bg-status-active text-status-active-foreground" 
                               : user.status === "pendente"
                               ? "bg-amber-100 text-amber-800"
                               : "bg-status-inactive text-status-inactive-foreground"
                           }`}
                         >
                           {user.status === "ativo" ? "Ativo" : user.status === "pendente" ? "Pendente" : "Inativo"}
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
                       <DropdownMenuContent align="end" className="w-56">
                         <DropdownMenuItem 
                           onClick={() => setEditingUser(user)}
                           className="cursor-pointer"
                         >
                           <Edit className="w-4 h-4 mr-2" />
                           Editar
                         </DropdownMenuItem>
                         
                         {canPromoteToGestor(user) && (
                           <DropdownMenuItem 
                             onClick={() => handlePromoteToGestor(user.id)}
                             className="cursor-pointer"
                           >
                             <Crown className="w-4 h-4 mr-2" />
                             {user.isGestor ? "Remover Gestor" : "Promover a Gestor"}
                           </DropdownMenuItem>
                         )}
                         
                         {user.status !== "pendente" && (
                           <DropdownMenuItem 
                             onClick={() => handleToggleStatus(user.id)}
                             className="cursor-pointer"
                           >
                             <Shield className="w-4 h-4 mr-2" />
                             {user.status === "ativo" ? "Inativar" : "Ativar"}
                           </DropdownMenuItem>
                         )}
                         
                         {user.papel !== "paciente" && (
                           <>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem 
                               onClick={() => handleRemoveUser(user.id)}
                               className="cursor-pointer text-destructive focus:text-destructive"
                             >
                               <Shield className="w-4 h-4 mr-2" />
                               Remover
                             </DropdownMenuItem>
                           </>
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
                 <Crown className="w-4 h-4 text-amber-500" />
               </div>
               <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                 <li>• Referência principal de saúde</li>
                 <li>• Pode ser promovido a Gestor</li>
                 <li>• Como Gestor: poder total sobre a conta</li>
               </ul>
             </div>

             <div className="space-y-3">
               <div className="flex items-center gap-2">
                 <Shield className="w-4 h-4 text-accent" />
                 <span className="font-medium">Acompanhante</span>
                 <Crown className="w-4 h-4 text-amber-500" />
               </div>
               <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                 <li>• Colaborador próximo</li>
                 <li>• Pode ser promovido a Gestor</li>
                 <li>• Como Gestor: acesso completo exceto promover outros</li>
               </ul>
             </div>

             <div className="space-y-3">
               <div className="flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-success" />
                 <span className="font-medium">Cuidador</span>
               </div>
               <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                 <li>• Colaborador técnico</li>
                 <li>• Só visualiza e marca compromissos concluídos</li>
                 <li>• Não pode ser promovido a Gestor</li>
               </ul>
             </div>

             <div className="space-y-3">
               <div className="flex items-center gap-2">
                 <SettingsIcon className="w-4 h-4 text-muted-foreground" />
                 <span className="font-medium">Admin</span>
               </div>
               <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                 <li>• Configurações técnicas do sistema</li>
                 <li>• Sem acesso a dados pessoais</li>
                 <li>• Não pode gerenciar usuários</li>
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

      <Dialog open={isAddCollaboratorOpen} onOpenChange={setIsAddCollaboratorOpen}>
        <AddCollaboratorDialog 
          onSave={handleAddCollaborator}
          onCancel={() => setIsAddCollaboratorOpen(false)}
        />
      </Dialog>
    </div>
  );
};