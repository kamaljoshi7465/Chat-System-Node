import prisma from "../config/database";

/** Input type for creating a user */
interface CreateUserInput {
  name: string;
  email: string;
}

/** Create a new user */
export async function createUser(input: CreateUserInput) {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });
}

/**
 * List chats for a given user.
 * Returns an array of objects: { chatId: string, members: string[] }
 */
export async function listUserChats(userId: string) {
  const memberships = await prisma.chatMember.findMany({
    where: { userId },
    include: {
      chat: {
        include: { members: true },
      },
    },
  });

  return memberships.map((m) => ({
    chatId: m.chatId,
    members: m.chat.members.map((mem) => mem.userId),
  }));
}
