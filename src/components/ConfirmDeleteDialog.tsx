import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  userCode: string;
}

const ConfirmDeleteDialog = ({ open, onOpenChange, onConfirm, userCode }: ConfirmDeleteDialogProps) => {
  const { toast } = useToast();
  const [randomMessage] = useState("CONFIRMAR-XYZ123");
  const [messageInput, setMessageInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  
  const isValid = messageInput === randomMessage && codeInput === userCode;

  useEffect(() => {
    if (open) {
      setMessageInput("");
      setCodeInput("");
      setCopied(false);
      // Auto focus no primeiro campo quando o modal abrir
      setTimeout(() => {
        const messageField = document.getElementById("message-input");
        messageField?.focus();
      }, 100);
    }
  }, [open]);

  const copyRandomMessage = async () => {
    try {
      await navigator.clipboard.writeText(randomMessage);
      setCopied(true);
      toast({
        title: "Mensagem copiada",
        description: "Mensagem copiada para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar a mensagem.",
        variant: "destructive"
      });
    }
  };

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">
            Confirmação Final
          </DialogTitle>
          <DialogDescription className="text-sm">
            Para confirmar a exclusão, copie a mensagem randômica abaixo, 
            cole no campo indicado e insira também seu código de usuário.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Mensagem randômica */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Mensagem randômica
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={randomMessage}
                readOnly
                className="font-mono bg-muted text-center font-bold"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyRandomMessage}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Campo para colar mensagem */}
          <div className="space-y-2">
            <Label htmlFor="message-input" className="text-sm font-medium">
              Cole a mensagem acima
            </Label>
            <Input
              id="message-input"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Cole aqui a mensagem exata"
              className={messageInput && messageInput !== randomMessage ? "border-destructive" : ""}
            />
            {messageInput && messageInput !== randomMessage && (
              <p className="text-xs text-destructive">
                A mensagem deve ser idêntica à mensagem randômica
              </p>
            )}
          </div>

          {/* Campo do código do usuário */}
          <div className="space-y-2">
            <Label htmlFor="code-input" className="text-sm font-medium">
              Seu código de usuário
            </Label>
            <Input
              id="code-input"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="Digite seu código (6 caracteres)"
              maxLength={6}
              className={`font-mono text-center ${codeInput && codeInput !== userCode ? "border-destructive" : ""}`}
            />
            {codeInput && codeInput !== userCode && (
              <p className="text-xs text-destructive">
                Código de usuário incorreto
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid}
            className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-destructive-foreground disabled:bg-muted disabled:text-muted-foreground"
          >
            Excluir Definitivamente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;