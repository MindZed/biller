"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { savePushSubscription } from "../app/actions/notifications"

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushManager() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "authenticated" && "serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then(async (registration) => {
        try {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string),
          })
          
          if (session?.user?.id) {
            await savePushSubscription(session.user.id, JSON.parse(JSON.stringify(subscription)))
          }
        } catch (error) {
          console.error("Failed to subscribe to push notifications", error)
        }
      })
    }
  }, [status, session])

  return null
}
