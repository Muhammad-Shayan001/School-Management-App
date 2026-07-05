'use client';

import { useEffect, useRef } from 'react';
import { messaging } from '@/app/_lib/firebase/client';
import { getToken, onMessage } from 'firebase/messaging';
import { useAuthStore } from '@/app/_lib/store/auth-store';
import { useNotificationStore } from '@/app/_lib/store/notification-store';
import { createClient } from '@/app/_lib/supabase/client';
import { toast } from 'sonner';

/**
 * Global component that handles FCM token generation, registration,
 * background/foreground notification integration, and the Android JS bridge.
 */
export default function FcmHandler() {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const hasRegisteredRef = useRef(false);

  useEffect(() => {
    if (!user) {
      hasRegisteredRef.current = false;
      return;
    }

    if (hasRegisteredRef.current) return;
    hasRegisteredRef.current = true;

    // 1. Android Bidirectional Javascript Bridge
    if (typeof window !== 'undefined') {
      // Callback for Android App to send new token
      (window as any).onAndroidFcmToken = (token: string) => {
        console.log('📱 Received FCM token from Android App callback:', token);
        registerTokenOnServer(token, 'android', 'Android App Device');
      };

      // Pull token from Android App if bridge exists
      const bridge = (window as any).AndroidNotificationBridge || (window as any).AndroidDownloadBridge;
      if (bridge && typeof bridge.getFcmToken === 'function') {
        try {
          const token = bridge.getFcmToken();
          if (token) {
            console.log('📱 Pulled FCM token from Android App Bridge:', token);
            registerTokenOnServer(token, 'android', 'Android App Device');
          }
        } catch (err) {
          console.error('❌ Failed to pull token from Android App Bridge:', err);
        }
      }
    }

    // Supabase Realtime Fallback (Instantly triggers toasts when DB updates, even if FCM is missing)
    const supabase = createClient();
    const realtimeSubscription = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('⚡ Supabase Realtime Notification Received:', payload);
          const newNotification = payload.new;
          addNotification(newNotification as any);
          
          toast(newNotification.title, {
            description: (
              <div className="flex flex-col gap-1 mt-1">
                {newNotification.message.split('\n').map((line: string, i: number) => (
                  <span key={i} className="text-sm opacity-90">{line}</span>
                ))}
              </div>
            ),
            action: newNotification.link
              ? { label: 'View', onClick: () => { window.location.href = newNotification.link; } }
              : undefined,
            duration: 7000,
          });
        }
      )
      .subscribe();

    // 2. Standard Web Browser FCM Registration
    if (!messaging) return;

    let unsubscribeOnMessage: (() => void) | undefined;

    const setupFCM = async () => {
      try {
        // Request browser permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('⚠️ Browser notification permission denied.');
          return;
        }

        // Register the background service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        
        // Retrieve browser push registration token
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (token) {
          console.log('🌐 Web FCM registration token:', token);
          await registerTokenOnServer(token, 'web', navigator.userAgent);
        }

        // Setup listener for foreground notifications
        unsubscribeOnMessage = onMessage(messaging, (payload) => {
          console.log('🔔 Foreground push notification received:', payload);

          const newNotification = {
            id: payload.data?.notificationId || Math.random().toString(),
            user_id: user.id,
            title: payload.notification?.title || 'Notification',
            message: payload.notification?.body || '',
            type: payload.data?.type || 'general',
            is_read: false,
            read_status: false,
            link: payload.data?.link || null,
            created_at: new Date().toISOString(),
          };

          // Append to client Zustan store to dynamically refresh unread badge and dropdown list
          addNotification(newNotification as any);

          // Trigger Sonner toast with action button
          toast(newNotification.title, {
            description: (
              <div className="flex flex-col gap-1 mt-1">
                {newNotification.message.split('\n').map((line: string, i: number) => (
                  <span key={i} className="text-sm opacity-90">{line}</span>
                ))}
              </div>
            ),
            action: newNotification.link
              ? {
                  label: 'View',
                  onClick: () => {
                    if (newNotification.link) {
                      window.location.href = newNotification.link;
                    }
                  },
                }
              : undefined,
            duration: 7000,
          });
        });
      } catch (err) {
        console.error('❌ Error initializing browser FCM:', err);
      }
    };

    setupFCM();

    return () => {
      if (unsubscribeOnMessage) {
        unsubscribeOnMessage();
      }
      supabase.removeChannel(realtimeSubscription);
    };
  }, [user, addNotification]);

  // Server API call to store token in public.fcm_tokens
  async function registerTokenOnServer(
    token: string,
    deviceType: 'web' | 'android' | 'ios',
    deviceName: string
  ) {
    try {
      const res = await fetch('/api/notifications/register-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, deviceType, deviceName }),
      });
      if (!res.ok) {
        console.error('❌ Server registration response error:', res.statusText);
      }
    } catch (err) {
      console.error('❌ Failed to register FCM token with server API:', err);
    }
  }

  return null;
}
