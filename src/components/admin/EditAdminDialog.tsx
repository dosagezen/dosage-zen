import { useState, useEffect } from "react";
import { Edit, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdminUser {
  id: string;
  nome: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  is_active: boolean;
}

interface EditAdminDialogProps {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditAdminDialog({ user, open, onOpenChange, onSuccess }: EditAdminDialogProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setNome(user.nome);
      setEmail(user.email);
      setIsActive(user.is_active);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Atualizar o perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome,
          email
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Atualizar o status do role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({
          is_active: isActive
        })
        .eq('profile_id', user.id)
        .eq('role', 'admin');

      if (roleError) throw roleError;

      toast({
        title: "Sucesso",
        description: "Administrador atualizado com sucesso!",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao atualizar admin:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar administrador.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Edit className="w-4 h-4 text-primary-foreground" />
            </div>
            Editar Administrador
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              type="text"
              placeholder="Digite o nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Digite o email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Status do Administrador</p>
                <p className="text-sm text-muted-foreground">
                  {isActive ? "Ativo - Pode acessar o painel admin" : "Inativo - Sem acesso ao painel"}
                </p>
              </div>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}