'use client';

import React from 'react';
import { useEffect, useRef } from 'react';
import { messaging } from '@/app/_lib/firebase/client';
import { getToken, onMessage } from 'firebase/messaging';
import { useAuthStore } from '@/app/_lib/store/auth-store';
import { useNotificationStore } from '@/app/_lib/store/notification-store';
import { createClient } from '@/app/_lib/supabase/client';
import { toast } from 'sonner';

/**
 * Global handler for all notification delivery channels:
 *  1. Supabase Realtime → instant in-app toast when DB row is inserted (works WITHOUT Firebase)
 *  2. Firebase FCM Web Push → background/foreground browser notifications (needs VAPID key)
 *  3. Android JS Bridge → token handoff from native app WebView
 *
 * Always sets up Supabase Realtime first so in-app notifications work even
 * when Firebase is not configured. FCM is an optional enhancement.
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

    // ── Cleanup refs so we can properly tear down on unmount ────────
    let unsubscribeOnMessage: (() => void) | undefined;
    const supabase = createClient();

    // ── 1. Supabase Realtime subscription ───────────────────────────
    // This fires INSTANTLY when any notification row is inserted for this user.
    // Works completely independently of Firebase - no keys needed.
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('⚡ Realtime notification received:', payload.new);
          const n = payload.new as any;

          // Add to Zustand store → updates bell badge count instantly
          addNotification(n);

          // Show toast popup inside the website
          toast(n.title || 'New Notification', {
            description: (
              <div className="flex flex-col gap-0.5 mt-1">
                {(n.message || '').split('\n').map((line: string, i: number) => (
                  <span key={i} className="text-sm opacity-90">{line}</span>
                ))}
              </div>
            ),
            action: n.link
              ? {
                  label: 'View',
                  onClick: () => { window.location.href = n.link; },
                }
              : undefined,
            duration: 8000,
          });

          // If hosting Android bridge exists, ask native app to show its own popup
          try {
            const bridge = (window as any).AndroidNotificationBridge;
            if (bridge && typeof bridge.showNotification === 'function') {
              bridge.showNotification(n.title || 'Notification', n.message || '', n.link || '');
            }
          } catch (e) {
            console.error('❌ Android bridge showNotification failed:', e);
          }
        }
      )
      .subscribe((status) => {
        console.log(`🔔 Supabase Realtime channel status: ${status}`);
      });

    // ── 2. Android Bidirectional JS Bridge ──────────────────────────
    if (typeof window !== 'undefined') {
      (window as any).onAndroidFcmToken = (token: string) => {
        console.log('📱 Android FCM token received:', token);
        registerTokenWithServer(token, 'android', 'Android App');
      };

      // Handler for native Android app to forward push payloads into the WebView
      // Native code can call `window.onAndroidNotification(JSON.stringify(payload))`
      (window as any).onAndroidNotification = (payload: any) => {
        try {
          const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
          console.log('📱 Android notification forwarded to WebView:', parsed);

          const n = {
            id: parsed.notificationId || Math.random().toString(),
            user_id: user.id,
            title: parsed.title || parsed.notification?.title || 'Notification',
            message: parsed.body || parsed.notification?.body || parsed.message || '',
            type: parsed.type || parsed.data?.type || 'general',
            is_read: false,
            read_status: false,
            link: parsed.data?.link || parsed.link || null,
            created_at: new Date().toISOString(),
          };

          // Add to Zustand store and show in-app toast
          addNotification(n as any);

          toast(n.title, {
            description: (
              <div className="flex flex-col gap-0.5 mt-1">
                {n.message.split('\n').map((line: string, i: number) => (
                  <span key={i} className="text-sm opacity-90">{line}</span>
                ))}
              </div>
            ),
            action: n.link
              ? {
                  label: 'View',
                  onClick: () => { if (n.link) window.location.href = n.link; },
                }
              : undefined,
            duration: 8000,
          });
          // Also notify native bridge if available
          try {
            const bridge = (window as any).AndroidNotificationBridge;
            if (bridge && typeof bridge.showNotification === 'function') {
              bridge.showNotification(n.title || 'Notification', n.message || '', n.link || '');
            }
          } catch (e) {
            console.error('❌ Android bridge showNotification failed:', e);
          }
        } catch (e) {
          console.error('❌ Failed to parse Android notification payload:', e);
        }
      };

      const bridge =
        (window as any).AndroidNotificationBridge ||
        (window as any).AndroidDownloadBridge;

      if (bridge && typeof bridge.getFcmToken === 'function') {
        try {
          const token = bridge.getFcmToken();
          if (token) {
            console.log('📱 Pulled FCM token from Android bridge');
            registerTokenWithServer(token, 'android', 'Android App');
          }
        } catch (err) {
          console.error('❌ Android bridge error:', err);
        }
      }
    }

    // ── 3. Web Push FCM (optional — only if Firebase is configured) ─
    if (messaging) {
      const setupWebPush = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.log('⚠️ Browser notification permission denied');
            return;
          }

          const configParams = new URLSearchParams({
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
          }).toString();

          const swReg = await navigator.serviceWorker.register(
            `/firebase-messaging-sw.js?${configParams}`
          );

          const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
          if (!vapidKey) {
            console.warn('⚠️ NEXT_PUBLIC_FIREBASE_VAPID_KEY missing — web push disabled');
            return;
          }

          const token = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: swReg,
          });

          if (token) {
            console.log('🌐 Web FCM token obtained');
            await registerTokenWithServer(token, 'web', navigator.userAgent);
          }

          // Foreground push listener
          unsubscribeOnMessage = onMessage(messaging, (payload) => {
            console.log('🔔 Foreground FCM push received:', payload);
            const n = {
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

            addNotification(n as any);

            toast(n.title, {
              description: (
                <div className="flex flex-col gap-0.5 mt-1">
                  {n.message.split('\n').map((line: string, i: number) => (
                    <span key={i} className="text-sm opacity-90">{line}</span>
                  ))}
                </div>
              ),
              action: n.link
                ? {
                    label: 'View',
                    onClick: () => { if (n.link) window.location.href = n.link; },
                  }
                : undefined,
              duration: 8000,
            });
            // Also ask native to show a notification when web FCM arrives
            try {
              const bridge = (window as any).AndroidNotificationBridge;
              if (bridge && typeof bridge.showNotification === 'function') {
                bridge.showNotification(n.title || 'Notification', n.message || '', n.link || '');
              }
            } catch (e) {
              console.error('❌ Android bridge showNotification failed:', e);
            }
          });
        } catch (err) {
          console.error('❌ Web push setup error:', err);
        }
      };

      setupWebPush();
    } else {
      console.log('ℹ️ Firebase messaging not configured — using Supabase Realtime only');
    }

    // ── Cleanup on unmount / user change ────────────────────────────
    return () => {
      hasRegisteredRef.current = false;
      if (unsubscribeOnMessage) unsubscribeOnMessage();
      supabase.removeChannel(channel);
    };
  }, [user, addNotification]);

  return null;
}

/** POST the FCM token to our server API so we can send targeted pushes */
async function registerTokenWithServer(
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
      const err = await res.json().catch(() => ({}));
      console.error('❌ Token registration failed:', err);
    } else {
      console.log('✅ FCM token registered with server');
    }
  } catch (err) {
    console.error('❌ Token registration request failed:', err);
  }
}
