import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  profileId: string;
}

export const NotificationPermissionDialog = ({
  open,
  onOpenChange,
  userId,
  profileId
}: NotificationPermissionDialogProps) => {
  const { subscribeToPushNotifications, isRegistering, browserInfo } = useNotifications();
  const [showBrowserHelp, setShowBrowserHelp] = useState(false);

  const handleEnable = async () => {
    const success = await subscribeToPushNotifications(userId, profileId);
    if (success) {
      onOpenChange(false);
    }
  };

  const handleMaybeLater = () => {
    localStorage.setItem('notification-permission-asked', 'true');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">Ativar Notificações?</DialogTitle>
          </div>
          <DialogDescription className="text-base space-y-3 pt-2">
            <p>
              Receba lembretes automáticos sobre:
            </p>
            <ul className="space-y-2 pl-4">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">💊</span>
                <span><strong>Medicações</strong> - 5 minutos antes do horário</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">🩺</span>
                <span><strong>Consultas</strong> - 1 dia e 1 hora antes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">🔬</span>
                <span><strong>Exames</strong> - 1 dia e 2 horas antes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">📅</span>
                <span><strong>Atividades</strong> - 1 hora antes</span>
              </li>
            </ul>

            {!browserInfo.isSupported && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Seu navegador {browserInfo.isSafari ? '(Safari) ' : ''}não suporta notificações push completamente.
                  {browserInfo.isMobile && browserInfo.isSafari && (
                    <> Para habilitar no Safari/iOS, você precisa instalar o app na tela inicial.</>
                  )}
                </p>
                <Button
                  variant="link"
                  className="p-0 h-auto mt-2 text-yellow-800 dark:text-yellow-200"
                  onClick={() => setShowBrowserHelp(!showBrowserHelp)}
                >
                  {showBrowserHelp ? 'Ocultar' : 'Ver'} instruções →
                </Button>
                {showBrowserHelp && (
                  <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                    <p><strong>Chrome/Edge:</strong> Funciona normalmente</p>
                    <p><strong>Firefox:</strong> Funciona normalmente</p>
                    <p><strong>Safari (Mac):</strong> Funciona a partir do macOS Big Sur</p>
                    <p><strong>Safari (iOS):</strong> Adicione à tela inicial primeiro</p>
                  </div>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-4">
          <Button
            onClick={handleEnable}
            disabled={isRegistering || !browserInfo.isSupported}
            className="w-full"
          >
            {isRegistering ? 'Ativando...' : 'Ativar Notificações 🔔'}
          </Button>
          <Button
            variant="ghost"
            onClick={handleMaybeLater}
            className="w-full"
          >
            Agora não
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Você pode alterar isso a qualquer momento nas configurações
        </p>
      </DialogContent>
    </Dialog>
  );
};
