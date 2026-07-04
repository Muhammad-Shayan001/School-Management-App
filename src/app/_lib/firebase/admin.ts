import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

/**
 * Initializes the Firebase Admin SDK on the server side.
 * Uses the FIREBASE_SERVICE_ACCOUNT_KEY environment variable.
 */
if (!getApps().length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      // Handle potential single/double quote escaping issues in environment variables
      const cleanKey = serviceAccountKey.trim();
      const serviceAccount = JSON.parse(cleanKey);
      
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    } else {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY is missing. Push notifications will be skipped.');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  }
}

// Export the messaging service if initialized, otherwise export null (degrades gracefully)
export const messaging = getApps().length ? getMessaging() : (null as any);
