self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Reminder'

  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      tag: `${data.entityType}-${data.entityId}`,
      data: { url: data.url || '/' }
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
