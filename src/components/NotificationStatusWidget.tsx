import { Bell, BellOff, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationSchedule } from '@/hooks/useNotificationSchedule';

interface NotificationStatusWidgetProps {
  profileId: string;
  userId: string;
  onOpenSettings: () => void;
}

export const NotificationStatusWidget = ({
  profileId,
  userId,
  onOpenSettings
}: NotificationStatusWidgetProps) => {
  const { 
    isSupported, 
    permission, 
    subscribeToPushNotifications,
    isRegistering 
  } = useNotifications();
  
  const { preferences, scheduledNotifications } = useNotificationSchedule(profileId);

  const isEnabled = permission === 'granted' && preferences?.enabled;
  const pendingCount = scheduledNotifications?.length || 0;

  const handleEnable = async () => {
    if (permission === 'granted') {
      onOpenSettings();
    } else {
      await subscribeToPushNotifications(userId, profileId);
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-yellow-900 dark:text-yellow-100">
                Notificações não disponíveis
              </h3>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Seu navegador não suporta notificações push
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isEnabled) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <BellOff className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">
                Notificações desativadas
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Ative para receber lembretes automáticos
              </p>
              <Button
                size="sm"
                onClick={handleEnable}
                disabled={isRegistering}
                className="mt-3"
              >
                {isRegistering ? 'Ativando...' : 'Ativar Notificações'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Bell className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-green-900 dark:text-green-100">
              Notificações ativas 🔔
            </h3>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              {pendingCount > 0 ? (
                <>{pendingCount} lembrete{pendingCount !== 1 ? 's' : ''} agendado{pendingCount !== 1 ? 's' : ''}</>
              ) : (
                'Você receberá lembretes automaticamente'
              )}
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={onOpenSettings}
              className="p-0 h-auto mt-2 text-green-700 dark:text-green-300"
            >
              Configurar →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
