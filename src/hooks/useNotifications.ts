import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  registerServiceWorker,
  requestNotificationPermission,
  getNotificationPermission,
  isPushNotificationSupported,
  getBrowserInfo,
  urlBase64ToUint8Array
} from '@/lib/notifications/service-worker-utils';

// VAPID Public Key - Generate and configure in Supabase Secrets
const VAPID_PUBLIC_KEY = 'BPXjIBPYd8N-n_QfxXt0Z8V5wY0ZJWqQVqF3hR_xR8X5wY0ZJWqQVqF3hR_xR8X5wY0ZJWqQVqF3hR_xR8X5wY0';

interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const useNotifications = () => {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isRegistering, setIsRegistering] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const browserInfo = getBrowserInfo();

  useEffect(() => {
    setIsSupported(isPushNotificationSupported());
    setPermission(getNotificationPermission());
  }, []);

  const savePushSubscription = async (
    sub: PushSubscription,
    userId: string,
    profileId: string
  ): Promise<boolean> => {
    try {
      const subJSON = sub.toJSON();
      const endpoint = subJSON.endpoint;
      const p256dh = subJSON.keys?.p256dh || '';
      const auth = subJSON.keys?.auth || '';

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          profile_id: profileId,
          endpoint,
          p256dh,
          auth,
          is_active: true
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) throw error;

      console.log('Push subscription saved to database');
      return true;
    } catch (error) {
      console.error('Error saving push subscription:', error);
      return false;
    }
  };

  const subscribeToPushNotifications = async (
    userId: string,
    profileId: string
  ): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: 'Não suportado',
        description: 'Seu navegador não suporta notificações push',
        variant: 'destructive'
      });
      return false;
    }

    setIsRegistering(true);

    try {
      // Request permission
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        toast({
          title: 'Permissão negada',
          description: 'Você precisa permitir notificações para receber lembretes',
          variant: 'destructive'
        });
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        throw new Error('Falha ao registrar Service Worker');
      }

      // Subscribe to push with VAPID key
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      setSubscription(sub);

      // Save to database
      const saved = await savePushSubscription(sub, userId, profileId);

      if (saved) {
        toast({
          title: 'Notificações ativadas! 🔔',
          description: 'Você receberá lembretes sobre medicações e compromissos'
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: 'Erro ao ativar notificações',
        description: 'Ocorreu um erro. Tente novamente mais tarde.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsRegistering(false);
    }
  };

  const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('user_id', user.id);
      }

      toast({
        title: 'Notificações desativadas',
        description: 'Você não receberá mais notificações push'
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  };

  const checkExistingSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
        return sub;
      }
      return null;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return null;
    }
  }, []);

  return {
    isSupported,
    permission,
    isRegistering,
    subscription,
    browserInfo,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    checkExistingSubscription
  };
};
