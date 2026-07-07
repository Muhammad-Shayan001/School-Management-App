import { NextResponse } from 'next/server';

/**
 * GET: Expose Firebase configuration synchronously for the service worker.
 * By returning a Javascript file, we can use importScripts() in the service worker
 * to load this configuration synchronously and completely avoid the asynchronous fetch
 * race condition that causes background pushes to fail.
 */
export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || null,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || null,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || null,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || null,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || null,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || null,
  };

  const scriptContent = `self.firebaseConfig = ${JSON.stringify(config)};`;

  return new NextResponse(scriptContent, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
