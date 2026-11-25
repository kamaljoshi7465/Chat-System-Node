
import { Request, Response } from "express";
import { z } from "zod";

import { createOrGetChat } from "../services/chat.service";

const createChatSchema = z.object({
  userAId: z.string().uuid(),
  userBId: z.string().uuid(),
}).strict();

export async function createChat(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validate request body
    const validation = createChatSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: validation.error.flatten(),
      });
      return;
    }

    const { userAId, userBId } = validation.data;

    // Call service
    const result = await createOrGetChat(userAId, userBId);

    res.status(result.created ? 201 : 200).json({
      success: true,
      message: result.created
        ? "Chat created successfully"
        : "Existing chat retrieved successfully",
      data: {
        chatId: result.chat.id,
        members: result.chat.members.map((member) => member.userId),
      },
    });
  } catch (error: unknown) {
    console.error("Create chat error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    const status =
      message === "Users not found" ||
        message === "Users must be different"
        ? 400
        : 500;

    res.status(status).json({
      success: false,
      message,
    });
  }
}
