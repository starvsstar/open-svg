import { db } from "@/lib/db"

export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.users.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password_hash: true,
        avatar_url: true,
        role: true,
        status: true,
      }
    })
    return user
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export const getUserById = async (id: string) => {
  try {
    const user = await db.users.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
        role: true,
        status: true,
      }
    })
    return user
  } catch (error) {
    console.error("Error fetching user by id:", error)
    return null
  }
} 
