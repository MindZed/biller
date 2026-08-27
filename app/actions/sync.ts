"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "../api/auth/[...nextauth]/route"
import { appendSpendRow } from "../../lib/google/sheets"
import { prisma } from "../../lib/prisma"

export async function syncPendingSpends(spends: any[], budgetId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  const userId = session.user.id
  const results = []

  for (const spend of spends) {
    try {
      // Base logic: append to current user's sheet
      await appendSpendRow(userId, spend, budgetId)

      // Phase 6 logic: Cross-sheet IOU (if friendId is provided)
      if (spend.friendId) {
        // Find friend's active sheet
        const friend = await prisma.user.findUnique({
          where: { userCode: spend.friendId }
        })

        if (friend && friend.activeSheetId) {
          try {
            const splitMode = spend.splitMode || "split_equal"
            const balanceDelta =
              splitMode === "friend_owes_full"
                ? spend.amount
                : splitMode === "i_owe_full"
                  ? -spend.amount
                  : spend.amount / 2

            const reverseNote =
              balanceDelta >= 0
                ? `You owe ${session.user.name || "Friend"}: ${spend.note || ""}`.trim()
                : `${session.user.name || "Friend"} owes you: ${spend.note || ""}`.trim()

            // Append the reverse entry to friend's sheet
            const reverseSpend = {
              ...spend,
              amount: Math.abs(balanceDelta),
              note: reverseNote,
              friendId: session.user.id,
              sheetEntryId: `${spend.id}:mirror:${userId}`
            }
            await appendSpendRow(friend.id, reverseSpend, budgetId)
            
            // Trigger Push Notification to the friend
            if (!spend.resyncOnly) {
              try {
                const { sendPushNotification } = await import("./notifications")
                await sendPushNotification(friend.id, {
                  title: "You were tagged in a bill!",
                  body: `${session.user.name || 'A friend'} tagged you in a ₹${spend.amount} ${spend.category} bill.`
                })
              } catch(e) {}
            }
            
          } catch (err) {
            console.error("Failed to sync to friend's sheet, queuing:", err)
            // Queue for peer sync
            await prisma.peerSyncQueue.create({
              data: {
                targetUserId: friend.id,
                actionType: "LENT",
                payload: spend
              }
            })
          }
        } else if (friend) {
          // Friend exists but hasn't onboarded / no sheet, queue it
          await prisma.peerSyncQueue.create({
            data: {
              targetUserId: friend.id,
              actionType: "LENT",
              payload: spend
            }
          })
        }

        // Update the Balance model
        if (friend && !spend.resyncOnly) {
          const splitMode = spend.splitMode || "split_equal"
          const balanceDelta =
            splitMode === "friend_owes_full"
              ? spend.amount
              : splitMode === "i_owe_full"
                ? -spend.amount
                : spend.amount / 2
          
          // My balance with friend (friend owes me)
          await prisma.balance.upsert({
            where: { userId_friendId: { userId: userId, friendId: friend.id } },
            update: { amount: { increment: balanceDelta } },
            create: { userId: userId, friendId: friend.id, amount: balanceDelta }
          })

          // Friend's balance with me (they owe me, so negative)
          await prisma.balance.upsert({
            where: { userId_friendId: { userId: friend.id, friendId: userId } },
            update: { amount: { decrement: balanceDelta } },
            create: { userId: friend.id, friendId: userId, amount: -balanceDelta }
          })
        }
      }

      results.push({ id: spend.id, status: 'synced' })
    } catch (error) {
      console.error(`Failed to sync spend ${spend.id}`, error)
      results.push({ id: spend.id, status: 'failed' })
    }
  }

  return results
}

export async function createBudget(budgetName: string, budgetType: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  const { createBudgetSheet } = await import("../../lib/google/sheets")
  const result = await createBudgetSheet(session.user.id, budgetName, budgetType)
  
  return result // { sheetId, tabName }
}
