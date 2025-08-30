import { useState } from "react";
import { Search, UserPlus, Copy, Check } from "lucide-react";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  codigo: string;
  nome: string;
  email: string;
  celular: string;
  papel: string;
}

interface AddCollaboratorDialogProps {
  onSave: (userData: { papel: string; codigo: string; status: string }) => void;
  onCancel: () => void;
}

// Mock de usuários disponíveis para convite
const availableUsers: UserProfile[] = [
  {
    id: "100",
    codigo: "M8K2P7",
    nome: "Carlos Silva",
    email: "carlos@email.com",
    celular: "(81) 95555-5555",
    papel: "disponível"
  },
  {
    id: "101", 
    codigo: "N3Q7R9",
    nome: "Fernanda Costa",
    email: "fernanda@email.com",
    celular: "(81) 94444-4444",
    papel: "disponível"
  },
  {
    id: "102",
    codigo: "L6X1V4",
    nome: "Roberto Nunes",
    email: "roberto@email.com", 
    celular: "(81) 93333-3333",
    papel: "disponível"
  }
];

const AddCollaboratorDialog = ({ onSave, onCancel }: AddCollaboratorDialogProps) => {
  const { toast } = useToast();
  const [codigo, setCodigo] = useState("");
  const [papel, setPapel] = useState<string>("");
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [step, setStep] = useState<"search" | "confirm">("search");
  const [copied, setCopied] = useState(false);

  const searchUser = () => {
    const user = availableUsers.find(u => u.codigo.toUpperCase() === codigo.toUpperCase());
    
    if (user) {
      setFoundUser(user);
      setStep("confirm");
    } else {
      toast({
        title: "Usuário não encontrado",
        description: "Verifique se o código está correto.",
        variant: "destructive"
      });
    }
  };

  const handleConfirm = () => {
    if (!foundUser || !papel) return;

    onSave({
      codigo: foundUser.codigo,
      papel,
      status: "pendente"
    });

    toast({
      title: "Convite enviado",
      description: `Convite enviado para ${foundUser.nome}.`,
    });
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: "Código copiado",
        description: "Código copiado para compartilhar.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o código.",
        variant: "destructive"
      });
    }
  };

  const formatCode = (value: string) => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  };

  const handleCodigoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCodigo(formatCode(e.target.value));
  };

  const handleBack = () => {
    setStep("search");
    setFoundUser(null);
    setPapel("");
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-primary flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          {step === "search" ? "Adicionar Colaborador" : "Confirmar Convite"}
        </DialogTitle>
      </DialogHeader>

      {step === "search" ? (
        <div className="space-y-6">
          {/* Busca por Código */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código do Usuário</Label>
              <div className="flex gap-2">
                <Input
                  id="codigo"
                  value={codigo}
                  onChange={handleCodigoChange}
                  placeholder="Ex: X7M2A9"
                  maxLength={6}
                  className="font-mono tracking-wider"
                />
                <Button 
                  onClick={searchUser}
                  disabled={codigo.length !== 6}
                  className="shrink-0"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Digite o código de 6 caracteres do usuário que deseja convidar.
              </p>
            </div>
          </div>

          {/* Exemplo de códigos disponíveis */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-medium text-sm mb-3">Códigos disponíveis para teste:</h4>
              <div className="space-y-2">
                {availableUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-slate-900 text-white font-mono text-xs">
                        {user.codigo}
                      </Badge>
                      <span className="text-sm">{user.nome}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyCode(user.codigo)}
                    >
                      {copied ? (
                        <Check className="w-3 h-3 text-success" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={onCancel} className="order-2 sm:order-1">
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Usuário Encontrado */}
          {foundUser && (
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 bg-gradient-primary">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                      {foundUser.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{foundUser.nome}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-slate-900 text-white font-mono text-xs">
                        {foundUser.codigo}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-2 space-y-1">
                      <p>{foundUser.email}</p>
                      <p>{foundUser.celular}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seleção de Papel */}
          <div className="space-y-2">
            <Label>Papel do Colaborador</Label>
            <Select value={papel} onValueChange={setPapel}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="acompanhante">Acompanhante</SelectItem>
                <SelectItem value="cuidador">Cuidador</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {papel === "acompanhante" 
                ? "Terá acesso completo para visualizar e gerenciar dados." 
                : papel === "cuidador"
                ? "Poderá apenas visualizar dados e marcar compromissos como concluídos."
                : "Selecione o nível de acesso para este colaborador."
              }
            </p>
          </div>

          {/* Confirmação */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <h4 className="font-medium text-primary mb-2">Confirmação do Convite</h4>
              <p className="text-sm text-muted-foreground">
                Você está convidando <strong>{foundUser?.nome}</strong> ({foundUser?.email}) 
                para ser seu <strong>{papel === "acompanhante" ? "Acompanhante" : "Cuidador"}</strong>.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                O convite será enviado e ficará pendente até que seja aceito.
              </p>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleConfirm}
              disabled={!papel}
              className="bg-primary hover:bg-primary-hover order-1"
            >
              Enviar Convite
            </Button>
            <Button variant="outline" onClick={handleBack} className="order-2">
              Voltar
            </Button>
          </div>
        </div>
      )}
    </DialogContent>
  );
};

export default AddCollaboratorDialog;