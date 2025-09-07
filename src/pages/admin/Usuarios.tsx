import { useState, useEffect } from "react";
import { Users, UserPlus, Mail, Shield, Eye, Edit, Trash2, Search, Filter, RotateCcw, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { InviteAdminDialog } from "@/components/admin/InviteAdminDialog";
import { EditAdminDialog } from "@/components/admin/EditAdminDialog";
import { RemoveAdminDialog } from "@/components/admin/RemoveAdminDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: string;
  nome: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  is_active: boolean;
  status: 'ativo' | 'pendente' | 'inativo';
  user_id?: string;
  email_confirmed?: boolean;
}

export function Usuarios() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [resendingInvites, setResendingInvites] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    loadAdminUsers();
  }, []);

  const loadAdminUsers = async () => {
    try {
      console.log('🔍 Iniciando carregamento dos usuários admin...');
      
      // Get all admin roles with email confirmation status
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          profile_id,
          is_active,
          email_confirmed,
          created_at,
          profiles!user_roles_profile_id_fkey (
            id,
            nome,
            email,
            avatar_url,
            created_at,
            user_id
          )
        `)
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      console.log('📋 Dados dos roles admin:', { adminRoles, rolesError });

      if (rolesError) throw rolesError;

      const adminUsers: AdminUser[] = [];

      // Process admin roles
      if (adminRoles) {
        for (const item of adminRoles) {
          const profile = item.profiles as any;
          
          if (profile) {
            // Determine status based on email confirmation and role activity
            let status: 'ativo' | 'pendente' | 'inativo';
            if (!item.email_confirmed) {
              status = 'pendente'; // Email not confirmed yet
            } else if (item.is_active) {
              status = 'ativo'; // Email confirmed and role active
            } else {
              status = 'inativo'; // Email confirmed but role inactive
            }

            adminUsers.push({
              id: item.profile_id,
              user_id: item.user_id,
              nome: profile.nome,
              email: profile.email,
              avatar_url: profile.avatar_url,
              created_at: profile.created_at,
              is_active: item.is_active,
              status,
              email_confirmed: item.email_confirmed
            });
          }
        }
      }

      console.log('✅ Usuários admin processados:', adminUsers);
      setUsers(adminUsers);
    } catch (error) {
      console.error('❌ Erro ao carregar usuários admin:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar usuários administradores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteUser = async (user: AdminUser) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('profile_id', user.id)
        .eq('role', 'admin');

      if (error) throw error;

      // Reload users to reflect changes
      await loadAdminUsers();
      toast({
        title: "Sucesso",
        description: "Usuário administrador removido com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      toast({
        title: "Erro",
        description: "Falha ao remover usuário administrador.",
        variant: "destructive",
      });
    }
    setDeletingUser(null);
  };

  const handleResendInvite = async (user: AdminUser) => {
    if (!user.email || !user.nome) return;
    
    setResendingInvites(prev => new Set(prev).add(user.id));
    
    try {
      // For now, we'll use the same invite function instead of a separate resend
      const { data, error } = await supabase.functions.invoke('invite-admin', {
        body: { 
          email: user.email, 
          nome: user.nome 
        }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao reenviar convite');
      }

      toast({
        title: "Sucesso",
        description: data.already_admin ? 
          "Usuário já possui privilégios de admin" : 
          data.promoted_existing ? 
            "Usuário existente promovido a admin" : 
            "Convite enviado com sucesso!",
      });

      // Reload users after invite
      await loadAdminUsers();
    } catch (error: any) {
      console.error('Erro ao reenviar convite:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao reenviar convite.",
        variant: "destructive",
      });
    } finally {
      setResendingInvites(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return (
          <Badge variant="default" className="bg-success/10 text-success border-success/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ativo
          </Badge>
        );
      case 'pendente':
        return (
          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'inativo':
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="w-3 h-3 mr-1" />
            Inativo
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Usuários Administradores</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Gerencie os administradores do sistema</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadAdminUsers}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            onClick={() => setIsInviteDialogOpen(true)}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Convidar Admin
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-xs text-muted-foreground">Total de Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{users.filter(u => u.status === 'ativo').length}</p>
                <p className="text-xs text-muted-foreground">Admins Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{users.filter(u => u.status === 'pendente').length}</p>
                <p className="text-xs text-muted-foreground">Convites Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {!isMobile && (
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table/Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Administradores</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Carregando...</div>
            </div>
          ) : isMobile ? (
            <div className="space-y-4 p-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.nome.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground truncate">{user.nome}</p>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 truncate">{user.email}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(user.status)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {user.status === 'pendente' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendInvite(user)}
                              disabled={resendingInvites.has(user.id)}
                              className="h-8 w-8 p-0"
                              title="Reenviar convite"
                            >
                              <RotateCcw className={`w-4 h-4 ${resendingInvites.has(user.id) ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingUser(user)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {user.nome.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{user.nome}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                              <span className="text-xs text-muted-foreground md:hidden truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {user.status === 'pendente' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendInvite(user)}
                              disabled={resendingInvites.has(user.id)}
                              className="h-8 w-8 p-0"
                              title="Reenviar convite"
                            >
                              <RotateCcw className={`w-4 h-4 ${resendingInvites.has(user.id) ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingUser(user)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Nenhum usuário encontrado." : "Nenhum administrador cadastrado."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <InviteAdminDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onSuccess={loadAdminUsers}
      />

      {editingUser && (
        <EditAdminDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onSuccess={loadAdminUsers}
        />
      )}

      {deletingUser && (
        <RemoveAdminDialog
          open={!!deletingUser}
          onOpenChange={(open) => !open && setDeletingUser(null)}
          onConfirm={() => handleDeleteUser(deletingUser)}
          adminName={deletingUser.nome}
        />
      )}
    </div>
  );
}