import { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { createUser, listUserChats } from "../services/user.service";

// ---------- Create User ----------
const createUserSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
});

export async function createUserController(
  req: Request,
  res: Response,
): Promise<void> {
  const validation = createUserSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      message: "Invalid user data",
      errors: validation.error.flatten(),
    });
    return;
  }

  try {
    const user = await createUser(validation.data);
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(409).json({ message: "A user with this email already exists" });
      return;
    }
    console.error("Create user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ---------- List User Chats ----------
const userIdSchema = z.string().uuid();

export async function listUserChatsController(
  req: Request,
  res: Response,
): Promise<void> {
  const validation = userIdSchema.safeParse(req.params.userId);
  if (!validation.success) {
    res.status(400).json({ success: false, message: "Invalid userId" });
    return;
  }

  try {
    const chats = await listUserChats(validation.data);
    res.status(200).json({
      success: true,
      userId: validation.data,
      count: chats.length,
      data: chats,
    });
  } catch (error: unknown) {
    console.error("List user chats error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    const status = msg === "User not found" ? 404 : 500;
    res.status(status).json({ success: false, message: msg });
  }
}
