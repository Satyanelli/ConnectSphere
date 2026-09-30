import { Router } from "express";

import {
  getMe,
  getUserById,
  updateMe,
  searchUsers,
} from "../controllers/user.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/me", protect, getMe);

router.put("/me", protect, updateMe);

router.get("/search", protect, searchUsers);

router.get("/:id", protect, getUserById);

export default router;