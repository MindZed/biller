"use server"

import webpush from "web-push"
import { prisma } from "../../lib/prisma"

// Configure web-push
webpush.setVapidDetails(
  "mailto:example@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
)

export async function savePushSubscription(userId: string, subscription: any) {
  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to save push subscription", error)
    return { success: false }
  }
}

export async function sendPushNotification(userId: string, payload: { title: string, body: string }) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId }
  })

  const promises = subscriptions.map(sub => 
    webpush.sendNotification({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    }, JSON.stringify(payload)).catch(e => {
      if (e.statusCode === 410) {
        // Subscription expired or unsubscribed, delete it
        return prisma.pushSubscription.delete({ where: { id: sub.id } })
      }
      console.error("Push Error", e)
    })
  )

  await Promise.all(promises)
}
