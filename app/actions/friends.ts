"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "../api/auth/[...nextauth]/route"
import { prisma } from "../../lib/prisma"
import { Prisma } from "@prisma/client"

type AddFriendResult = {
  success: boolean
  friendName?: string | null
  error?: string
}

export async function addFriend(friendCode: string): Promise<AddFriendResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  const currentUserId = session.user.id
  const normalizedCode = friendCode.trim()

  if (!normalizedCode || normalizedCode.length < 6) {
    return { success: false, error: "Please enter a valid friend code." }
  }

  const friend = await prisma.user.findFirst({
    where: {
      userCode: {
        equals: normalizedCode,
        mode: "insensitive"
      }
    }
  })

  if (!friend) {
    return { success: false, error: "User not found with that code." }
  }

  if (friend.id === currentUserId) {
    return { success: false, error: "You cannot add yourself." }
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
    return { success: false, error: "Friendship already exists." }
  }

  try {
    await prisma.friendship.create({
      data: {
        userAId: currentUserId,
        userBId: friend.id,
        status: "ACCEPTED" // Auto-accepting for MVP
      }
    })
    return { success: true, friendName: friend.name }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { success: false, error: "Friendship already exists." }
    }
    console.error("Failed to add friend:", error)
    return { success: false, error: "Failed to add friend. Please try again." }
  }
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
