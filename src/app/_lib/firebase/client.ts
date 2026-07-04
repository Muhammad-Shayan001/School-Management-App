import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Verify if configuration keys exist
const isFirebaseConfigured = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID
);

let app: any = null;
let messaging: any = null;

if (typeof window !== 'undefined') {
  if (isFirebaseConfigured) {
    try {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      
      // Verify serviceWorker and PushManager support (prevent crashes in unsupported browsers)
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        messaging = getMessaging(app);
      } else {
        console.warn('⚠️ Push notifications are not supported in this browser.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Firebase client App:', error);
    }
  } else {
    // Only log once in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Firebase Client config environment variables are missing. Browser push notifications will be disabled.');
    }
  }
}

export { app, messaging };
