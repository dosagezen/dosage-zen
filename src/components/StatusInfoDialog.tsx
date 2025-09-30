import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";

interface StatusInfoDialogProps {
  type: 'concluidos' | 'pendentes' | 'atrasados' | 'cancelados';
  isOpen: boolean;
  onClose: () => void;
}

export const StatusInfoDialog = ({ type, isOpen, onClose }: StatusInfoDialogProps) => {
  const statusConfig = {
    concluidos: {
      title: "Atividades Concluídas",
      description: "São todas as medicações, consultas, exames e atividades que foram marcadas como realizadas no prazo. Essas são suas conquistas!",
      icon: CheckCircle2,
      iconColor: "text-green-500",
      iconBg: "bg-green-50"
    },
    pendentes: {
      title: "Atividades Pendentes",
      description: "São as medicações, consultas, exames e atividades agendadas que ainda estão dentro do prazo para serem realizadas.",
      icon: Clock,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-50"
    },
    atrasados: {
      title: "Atividades Atrasadas",
      description: "São as medicações, consultas, exames e atividades que passaram do horário ou data prevista e ainda não foram realizadas.",
      icon: AlertCircle,
      iconColor: "text-pink-500",
      iconBg: "bg-pink-50"
    },
    cancelados: {
      title: "Atividades Canceladas",
      description: "São as medicações, consultas, exames e atividades que foram canceladas ou removidas da sua agenda.",
      icon: XCircle,
      iconColor: "text-gray-500",
      iconBg: "bg-gray-50"
    }
  };

  const config = statusConfig[type];
  const Icon = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-full ${config.iconBg}`}>
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <DialogTitle className="text-lg">{config.title}</DialogTitle>
          </div>
          <DialogDescription className="text-base leading-relaxed pt-2">
            {config.description}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
