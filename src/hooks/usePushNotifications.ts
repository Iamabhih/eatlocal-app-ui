import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PushNotificationOptions {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  onNotificationReceived?: (notification: any) => void;
}

export function usePushNotifications(options: PushNotificationOptions = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if push notifications are supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check existing subscription
  useEffect(() => {
    if (!isSupported) return;

    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        setSubscription(sub);
      });
    });
  }, [isSupported]);

  // Request permission and subscribe
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in this browser',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        options.onPermissionGranted?.();
        await subscribeToPush();
        return true;
      } else {
        options.onPermissionDenied?.();
        toast({
          title: 'Notifications Blocked',
          description: 'You can enable notifications in your browser settings',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, options, toast]);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from environment
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        console.warn('VAPID public key not configured');
        // Still create a subscription without VAPID for demo purposes
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
        });
        setSubscription(sub);
        await saveSubscriptionToServer(sub);
        return sub;
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      setSubscription(sub);
      await saveSubscriptionToServer(sub);

      toast({
        title: 'Notifications Enabled',
        description: 'You will receive order updates and promotions',
      });

      return sub;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: 'Subscription Failed',
        description: 'Failed to enable notifications',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Remove subscription from server
      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id);
      }

      toast({
        title: 'Notifications Disabled',
        description: 'You will no longer receive push notifications',
      });
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  }, [subscription, user, toast]);

  // Save subscription to server
  const saveSubscriptionToServer = async (sub: PushSubscription) => {
    if (!user) return;

    try {
      const subscriptionData = sub.toJSON();

      await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionData.endpoint,
          p256dh: subscriptionData.keys?.p256dh,
          auth: subscriptionData.keys?.auth,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  // Send a local notification (for testing)
  const sendLocalNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      toast({
        title: 'Permission Required',
        description: 'Please enable notifications first',
        variant: 'destructive',
      });
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options,
    });
  }, [permission, toast]);

  return {
    permission,
    subscription,
    isSupported,
    isLoading,
    isSubscribed: !!subscription,
    requestPermission,
    unsubscribe,
    sendLocalNotification,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
