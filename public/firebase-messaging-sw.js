// ═══════════════════════════════════════════════════════════════════════════════
// Firebase Cloud Messaging Service Worker
// ═══════════════════════════════════════════════════════════════════════════════

// Import Firebase scripts from CDN
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Parse Firebase client credentials from the Service Worker URL parameters
const urlParams = new URLSearchParams(self.location.search);
const config = {
  apiKey: urlParams.get('apiKey'),
  projectId: urlParams.get('projectId'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId'),
};

if (config.apiKey && config.projectId) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  // Implement background message listener
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'Skolic Notification';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: payload.data?.icon || '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        link: payload.data?.link || '/',
      },
      tag: 'skolic-notification',
      renotify: true,
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.warn('[firebase-messaging-sw.js] Firebase API Key is not provided in URL parameters.');
}

// Handle notification click action (Opens app and redirects user to the targeted page)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.link || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open in the origin, navigate and focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => client.navigate(targetUrl));
        }
      }
      // Otherwise, open a new browser tab/window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
