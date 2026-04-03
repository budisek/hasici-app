// Service Worker — zpracovává push notifikace na pozadí
// Musí být v kořenovém adresáři veřejných souborů

self.addEventListener('push', (event) => {
  // Zpracujeme příchozí push zprávu
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Nová událost', body: event.data.text() };
    }
  }

  const title = data.title || 'Hasiči Vysočina';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'hasici',          // zabrání duplicitním notifikacím
    renotify: true,                      // i stejný tag znovu zavibruje
    data: data.data || {},
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Zobrazit' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Po kliknutí otevřeme aplikaci (nebo ji přeneseme do popředí)
  const udalostId = event.notification.data?.udalostId;
  const url = udalostId ? `/?udalost=${udalostId}` : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // Pokud je aplikace již otevřená, přepneme na ni
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Jinak otevřeme nové okno
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
