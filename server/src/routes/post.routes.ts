import { Router } from "express";

import {
  createPost,
  getPosts,
  toggleLike,
  deletePost,
} from "../controllers/post.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// Create a post
router.post("/", protect, createPost);

// Get all posts
router.get("/", protect, getPosts);

// Like / Unlike a post
router.post("/:id/like", protect, toggleLike);

// Delete your own post
router.delete("/:id", protect, deletePost);

export default router;