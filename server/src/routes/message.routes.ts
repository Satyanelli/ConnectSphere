import { Router } from "express";

import {
  sendMessage,
  getConversation,
  getConversations,
} from "../controllers/message.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", protect, sendMessage);

router.get("/", protect, getConversations);

router.get("/:userId", protect, getConversation);

export default router;