
import { Prisma } from "@prisma/client";
import prisma from "../config/database";

export async function createOrGetChat(
  userAId: string,
  userBId: string
) {
  // 1. Prevent chatting with yourself
  if (userAId === userBId) {
    throw new Error("Users must be different");
  }

  // 2. Check whether both users exist
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: [userAId, userBId],
      },
    },
    select: {
      id: true,
    },
  });

  if (users.length !== 2) {
    throw new Error("Users not found");
  }

  // 3. Generate canonical chat key
  const sortedIds = [userAId, userBId].sort();
  const directKey = sortedIds.join("_");

  // 4. Check existing chat
  const existingChat = await prisma.chat.findUnique({
    where: {
      directKey,
    },
    include: {
      members: true,
    },
  });

  if (existingChat) {
    return {
      chat: existingChat,
      created: false,
    };
  }

  try {
    // 5. Create chat and members atomically
    const newChat = await prisma.chat.create({
      data: {
        directKey,
        members: {
          create: [
            { userId: userAId },
            { userId: userBId },
          ],
        },
      },
      include: {
        members: true,
      },
    });

    return {
      chat: newChat,
      created: true,
    };
  } catch (error: unknown) {
    // 6. Handle concurrent duplicate requests
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const chat = await prisma.chat.findUnique({
        where: {
          directKey,
        },
        include: {
          members: true,
        },
      });

      if (chat) {
        return {
          chat,
          created: false,
        };
      }
    }

    throw error;
  }
}
