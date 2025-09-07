import { useState } from "react";
import { UserPlus, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InviteAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InviteAdminDialog({ open, onOpenChange, onSuccess }: InviteAdminDialogProps) {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Chamar edge function para convidar admin
      const { data, error } = await supabase.functions.invoke('invite-admin', {
        body: { email, nome }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido');
      }

      toast({
        title: "Sucesso",
        description: "Convite enviado. Usuário adicionado como Pendente.",
      });

      setEmail("");
      setNome("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao convidar admin:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar convite.",
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
              <UserPlus className="w-4 h-4 text-primary-foreground" />
            </div>
            Convidar Administrador
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
              placeholder="Digite o email do novo administrador"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">O que acontecerá:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Uma conta será criada automaticamente</li>
                  <li>• O usuário receberá um email de confirmação</li>
                  <li>• Privilégios de administrador serão atribuídos</li>
                  <li>• Acesso imediato ao painel admin</li>
                </ul>
              </div>
            </div>
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
              {loading ? "Convidando..." : "Convidar Admin"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}