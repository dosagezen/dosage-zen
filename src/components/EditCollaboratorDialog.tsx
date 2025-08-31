import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Phone, Hash } from "lucide-react";

interface UserProfile {
  id: string;
  codigo: string;
  nome: string;
  email: string;
  celular: string;
  papel: string;
  status: string;
  created_at: string;
  owner_user_id?: string;
}

interface EditCollaboratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  collaborator: UserProfile | null;
  onSave: (collaboratorId: string, newRole: string) => void;
}

export const EditCollaboratorDialog: React.FC<EditCollaboratorDialogProps> = ({
  isOpen,
  onClose,
  collaborator,
  onSave
}) => {
  const [selectedRole, setSelectedRole] = useState<string>("");

  useEffect(() => {
    if (collaborator) {
      setSelectedRole(collaborator.papel);
    }
  }, [collaborator]);

  const handleSave = () => {
    if (collaborator && selectedRole) {
      onSave(collaborator.id, selectedRole);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedRole("");
    onClose();
  };

  if (!collaborator) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Colaborador</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Colaborador (Read-only) */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Informações do Colaborador
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Nome</Label>
                    <p className="text-sm font-medium">{collaborator.nome}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="text-sm font-medium">{collaborator.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Celular</Label>
                    <p className="text-sm font-medium">{collaborator.celular}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Código</Label>
                    <p className="text-sm font-medium font-mono">{collaborator.codigo}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Papel do Colaborador (Editável) */}
          <div className="space-y-2">
            <Label htmlFor="role">Papel do Colaborador</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="acompanhante">Acompanhante</SelectItem>
                <SelectItem value="cuidador">Cuidador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!selectedRole}
              className="bg-primary hover:bg-primary-hover"
            >
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};