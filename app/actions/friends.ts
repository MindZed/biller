"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "../api/auth/[...nextauth]/route"
import { prisma } from "../../lib/prisma"

export async function addFriend(friendCode: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  const currentUserId = session.user.id

  const friend = await prisma.user.findUnique({
    where: { userCode: friendCode }
  })

  if (!friend) {
    throw new Error("User not found with that code.")
  }

  if (friend.id === currentUserId) {
    throw new Error("You cannot add yourself.")
  }

  // Ensure friendship doesn't already exist
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userAId: currentUserId, userBId: friend.id },
        { userAId: friend.id, userBId: currentUserId }
      ]
    }
  })

  if (existing) {
    throw new Error("Friendship already exists.")
  }

  // Always store ordered by ID to satisfy the unique constraint easily if we wanted
  // But our schema is @@unique([userAId, userBId])
  const friendship = await prisma.friendship.create({
    data: {
      userAId: currentUserId,
      userBId: friend.id,
      status: "ACCEPTED" // Auto-accepting for MVP
    }
  })

  return { success: true, friendName: friend.name }
}

export async function getMyUserCode() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { userCode: true }
  })
  
  return user?.userCode
}

export async function getFriends() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return []

  const currentUserId = session.user.id

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { userAId: currentUserId },
        { userBId: currentUserId }
      ]
    },
    include: {
      userA: true,
      userB: true
    }
  })

  return friendships.map(f => {
    if (f.userAId === currentUserId) return f.userB
    return f.userA
  })
}
