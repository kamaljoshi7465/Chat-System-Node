
import { Request, Response } from "express";
import { z } from "zod";

import {
  getMessages,
  sendMessage,
  markMessageRead,
  updateLastSeen,
} from "../services/message.service";

// ---------------------------------------------------
// Send Message Controller
// ---------------------------------------------------
const sendMessageSchema = z.object({
  senderId: z.string().uuid(),
  text: z.string().trim().min(1).max(5000),
}).strict();

export async function sendMessageController(
  req: Request,
  res: Response,
): Promise<void> {
  const validation = sendMessageSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Invalid request data",
      errors: validation.error.flatten(),
    });
    return;
  }

  const { senderId, text } = validation.data;
  const { chatId } = req.params;

  // Validate chatId param
  const chatIdValid = z.string().uuid().safeParse(chatId);
  if (!chatIdValid.success) {
    res.status(400).json({ success: false, message: "Invalid chatId" });
    return;
  }

  try {
    const message = await sendMessage({
      chatId: chatIdValid.data,
      senderId,
      text,
    });
    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error: unknown) {
    console.error("Send message error:", error);
    const errMsg = error instanceof Error ? error.message : "Internal server error";
    if (errMsg === "Chat not found or sender is not a member") {
      res.status(403).json({ success: false, message: errMsg });
    } else {
      res.status(500).json({ success: false, message: "Failed to send message" });
    }
  }
}

// ---------------------------------------------------
// Get Messages Controller
// ---------------------------------------------------
export async function getMessagesController(
  req: Request,
  res: Response,
): Promise<void> {
  const chatIdResult = z.string().uuid().safeParse(req.params.chatId);
  const limitResult = z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .safeParse(req.query.limit ?? "50");

  if (!chatIdResult.success || !limitResult.success) {
    res.status(400).json({
      success: false,
      message: "Invalid chatId or limit (1‑100).",
    });
    return;
  }

  try {
    const messages = await getMessages(chatIdResult.data, limitResult.data);
    res.status(200).json({
      success: true,
      chatId: chatIdResult.data,
      count: messages.length,
      data: messages,
    });
  } catch (error: unknown) {
    console.error("Get messages error:", error);
    const errMsg = error instanceof Error ? error.message : "Internal server error";
    res.status(errMsg === "Chat not found" ? 404 : 500).json({
      success: false,
      message: errMsg,
    });
  }
}

// ---------------------------------------------------
// Mark Message Read Controller
// ---------------------------------------------------
const markReadSchema = z.object({
  userId: z.string().uuid(),
});

export async function markMessageReadController(
  req: Request,
  res: Response,
): Promise<void> {
  const { chatId, messageId } = req.params;
  const validation = markReadSchema.safeParse(req.body);

  // chatId must be a UUID, but messageId (Firestore doc ID) can be any non‑empty string
  const chatIdValid = z.string().uuid().safeParse(chatId);
  const messageIdValid = z.string().min(1).safeParse(messageId);

  if (!validation.success || !chatIdValid.success || !messageIdValid.success) {
    res.status(400).json({
      success: false,
      message: "Invalid IDs or request body.",
    });
    return;
  }

  try {
    await markMessageRead({
      chatId: chatIdValid.data,
      messageId: messageIdValid.data,
      userId: validation.data.userId,
    });
    res.status(200).json({ success: true, message: "Read receipt updated" });
  } catch (error: unknown) {
    console.error("Mark read error:", error);
    const errMsg = error instanceof Error ? error.message : "Internal server error";
    const status = errMsg === "Chat not found" || errMsg === "Message not found" ? 404 : 500;
    res.status(status).json({ success: false, message: errMsg });
  }
}

// ---------------------------------------------------
// Update Last Seen Controller
// ---------------------------------------------------
const lastSeenSchema = z.object({
  userId: z.string().uuid(),
  messageId: z.string().min(1),
});

export async function updateLastSeenController(
  req: Request,
  res: Response,
): Promise<void> {
  const { chatId } = req.params;
  const validation = lastSeenSchema.safeParse(req.body);

  const chatIdValid = z.string().uuid().safeParse(chatId);

  if (!validation.success || !chatIdValid.success) {
    res.status(400).json({
      success: false,
      message: "Invalid chatId or request body.",
    });
    return;
  }

  try {
    await updateLastSeen({
      chatId: chatIdValid.data,
      userId: validation.data.userId,
      messageId: validation.data.messageId,
    });
    res.status(200).json({ success: true, message: "Last seen updated" });
  } catch (error: unknown) {
    console.error("Update last seen error:", error);
    const errMsg = error instanceof Error ? error.message : "Internal server error";
    const status = errMsg === "Chat not found" ? 404 : 500;
    res.status(status).json({ success: false, message: errMsg });
  }
}
