import { Router } from "express";

import {
  createComment,
  getComments,
  deleteComment,
} from "../controllers/comment.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// Create a comment
router.post("/:postId/comments", protect, createComment);

// Get comments for a post
router.get("/:postId/comments", protect, getComments);

// Delete your own comment
router.delete("/:id", protect, deleteComment);

export default router;