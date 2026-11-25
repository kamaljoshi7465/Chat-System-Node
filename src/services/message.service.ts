import {
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";

import prisma from "../config/database";
import { firestore } from "../config/firebase";

interface SendMessageInput {
  chatId: string;
  senderId: string;
  text: string;
}

interface MarkMessageReadInput {
  chatId: string;
  messageId: string;
  userId: string;
}

interface UpdateLastSeenInput {
  chatId: string;
  messageId: string;
  userId: string;
}

function messagesCollection(chatId: string) {
  return firestore
    .collection("chats")
    .doc(chatId)
    .collection("messages");
}

async function verifyChatMember(chatId: string, userId: string) {
  const membership = await prisma.chatMember.findUnique({
    where: {
      chatId_userId: {
        chatId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new Error("Chat not found or user is not a member");
  }
}

/**
 * Send a message.
 */
export async function sendMessage(input: SendMessageInput) {
  const { chatId, senderId, text } = input;

  await verifyChatMember(chatId, senderId);

  const messageRef = messagesCollection(chatId).doc();

  await messageRef.set({
    senderId,
    text,
    createdAt: FieldValue.serverTimestamp(),
    readBy: [],
  });

  const snapshot = await messageRef.get();
  const message = snapshot.data();

  return {
    messageId: messageRef.id,
    chatId,
    senderId,
    text,
    createdAt: message?.createdAt instanceof Timestamp
      ? message.createdAt.toDate().toISOString()
      : null,
    readBy: message?.readBy ?? [],
  };
}

/**
 * Retrieve messages in chronological order.
 */
export async function getMessages(chatId: string, limit: number) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { id: true },
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

  const snapshot = await messagesCollection(chatId)
    .orderBy("createdAt", "asc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      messageId: doc.id,
      senderId: data.senderId,
      text: data.text,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : null,
      readBy: data.readBy ?? [],
    };
  });
}

/**
 * Add a user to the message's readBy array.
 */
export async function markMessageRead(input: MarkMessageReadInput) {
  const { chatId, messageId, userId } = input;

  await verifyChatMember(chatId, userId);

  const messageRef = messagesCollection(chatId).doc(messageId);
  const messageSnapshot = await messageRef.get();

  if (!messageSnapshot.exists) {
    throw new Error("Message not found");
  }

  await messageRef.update({
    readBy: FieldValue.arrayUnion(userId),
  });

  return {
    chatId,
    messageId,
    userId,
    read: true,
  };
}

/**
 * Store the user's latest seen message in a separate Firestore document.
 */
export async function updateLastSeen(input: UpdateLastSeenInput) {
  const { chatId, messageId, userId } = input;

  await verifyChatMember(chatId, userId);

  const messageSnapshot = await messagesCollection(chatId)
    .doc(messageId)
    .get();

  if (!messageSnapshot.exists) {
    throw new Error("Message not found");
  }

  await firestore
    .collection("chats")
    .doc(chatId)
    .collection("lastSeen")
    .doc(userId)
    .set({
      userId,
      messageId,
      updatedAt: FieldValue.serverTimestamp(),
    });

  return {
    chatId,
    userId,
    messageId,
    updated: true,
  };
}