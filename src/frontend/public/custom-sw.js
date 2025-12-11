self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: data.icon || '/icons/icon-192x192.png',
            badge: data.badge || '/icons/badge-72x72.png',
            vibrate: data.vibrate || [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '2',
                url: data.data?.url || data.url || '/', // Support deep linking from data object or top level
            },
            actions: data.actions || [],
            requireInteraction: data.requireInteraction || false,
        };
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    console.log('Notification click received.');
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    // Open the app/url
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // If window is already open, focus it
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                // Check if the client is focusing on the same origin (simple check)
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus().then(formattedClient => {
                        if (formattedClient) formattedClient.navigate(urlToOpen);
                    });
                }
            }
            // Otherwise open new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
