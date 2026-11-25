import { Router } from "express";
import {
  createUserController,
  listUserChatsController,
} from "../controllers/user.controller";

const router = Router();
router.post("/create", createUserController);
router.get("/:userId/chats", listUserChatsController);

export default router;