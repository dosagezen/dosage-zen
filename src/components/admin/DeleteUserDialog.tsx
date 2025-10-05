import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeleteUser } from "@/hooks/useDeleteUser";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteUserDialog({ 
  open, 
  onOpenChange,
  onSuccess
}: DeleteUserDialogProps) {
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const { deleteUserByEmail, isDeleting } = useDeleteUser();

  const isEmailValid = email.trim() !== "" && 
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
  
  const isConfirmationMatch = confirmEmail === email;
  const canDelete = isEmailValid && isConfirmationMatch && !isDeleting;

  const handleDelete = async () => {
    if (!canDelete) return;

    const success = await deleteUserByEmail(email);
    
    if (success) {
      setEmail("");
      setConfirmEmail("");
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setEmail("");
      setConfirmEmail("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-left">
                Remover Usuário Permanentemente
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-left">
            Esta ação é <strong>irreversível</strong> e removerá completamente o usuário e todos os seus dados do sistema.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-destructive/5 p-4 rounded-lg border border-destructive/20">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2 text-destructive">⚠️ O que será removido:</p>
              <ul className="space-y-1 text-xs">
                <li>• Conta de autenticação do usuário</li>
                <li>• Perfil e informações pessoais</li>
                <li>• Todas as medicações e ocorrências</li>
                <li>• Consultas, exames e atividades</li>
                <li>• Colaborações e convites</li>
                <li>• Preferências de notificação</li>
                <li>• Todos os dados relacionados</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email do usuário</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isDeleting}
              className={!isEmailValid && email !== "" ? "border-destructive" : ""}
            />
            {!isEmailValid && email !== "" && (
              <p className="text-xs text-destructive">Email inválido</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmEmail">
              Digite o email novamente para confirmar
            </Label>
            <Input
              id="confirmEmail"
              type="email"
              placeholder="usuario@exemplo.com"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              disabled={isDeleting}
              className={!isConfirmationMatch && confirmEmail !== "" ? "border-destructive" : ""}
            />
            {!isConfirmationMatch && confirmEmail !== "" && (
              <p className="text-xs text-destructive">Os emails não coincidem</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete}
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Removendo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Remover Usuário
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
