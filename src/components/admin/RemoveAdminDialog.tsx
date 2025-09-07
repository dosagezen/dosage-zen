import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RemoveAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  adminName: string;
}

export function RemoveAdminDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  adminName 
}: RemoveAdminDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-left">
                Remover Administrador
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-left">
            Tem certeza que deseja remover <strong>{adminName}</strong> dos administradores? 
            Esta ação irá revogar todos os privilégios administrativos deste usuário.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">O que acontecerá:</p>
            <ul className="space-y-1 text-xs">
              <li>• O usuário perderá acesso ao painel administrativo</li>
              <li>• Todas as permissões de admin serão revogadas</li>
              <li>• A conta do usuário permanecerá ativa como usuário comum</li>
              <li>• Esta ação pode ser revertida posteriormente</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Remover Admin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}