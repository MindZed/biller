/// <reference lib="webworker" />
export type {}
declare let self: ServiceWorkerGlobalScope

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title || "Cost Ledger"
  
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "You have a new notification.",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      vibrate: [100, 50, 100],
      data: data.url ? { url: data.url } : undefined,
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  if (event.notification.data?.url) {
    event.waitUntil(self.clients.openWindow(event.notification.data.url))
  } else {
    event.waitUntil(self.clients.openWindow("/"))
  }
})
