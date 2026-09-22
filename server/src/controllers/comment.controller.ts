import { Request, Response } from "express";
import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";

// Create a comment on a post
export const createComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { postId } = req.params;
    const { content } = req.body;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    if (typeof postId !== "string") {
      res.status(400).json({
        message: "Invalid post ID",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({
        message: "Invalid post ID",
      });
      return;
    }

    if (!content || typeof content !== "string" || content.trim() === "") {
      res.status(400).json({
        message: "Comment content is required",
      });
      return;
    }

    const post = await Post.findById(postId);

    if (!post) {
      res.status(404).json({
        message: "Post not found",
      });
      return;
    }

    const comment = new Comment({
      post: new mongoose.Types.ObjectId(postId),
      author: new mongoose.Types.ObjectId(userId),
      content: content.trim(),
    });

    await comment.save();

    await comment.populate(
      "author",
      "firstName lastName photoUrl headline"
    );

    res.status(201).json({
      message: "Comment created successfully",
      comment,
    });
  } catch (error) {
    console.error("Create comment error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get comments for a post
export const getComments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { postId } = req.params;

    if (typeof postId !== "string") {
      res.status(400).json({
        message: "Invalid post ID",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({
        message: "Invalid post ID",
      });
      return;
    }

    const post = await Post.findById(postId);

    if (!post) {
      res.status(404).json({
        message: "Post not found",
      });
      return;
    }

    const comments = await Comment.find({
      post: new mongoose.Types.ObjectId(postId),
    })
      .populate("author", "firstName lastName photoUrl headline")
      .sort({ createdAt: 1 });

    res.status(200).json({
      comments,
    });
  } catch (error) {
    console.error("Get comments error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Delete your own comment
export const deleteComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    if (typeof id !== "string") {
      res.status(400).json({
        message: "Invalid comment ID",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "Invalid comment ID",
      });
      return;
    }

    // Find the comment
    const comment = await Comment.findById(id);

    if (!comment) {
      res.status(404).json({
        message: "Comment not found",
      });
      return;
    }

    // Only the comment author can delete it
    if (comment.author.toString() !== userId) {
      res.status(403).json({
        message: "You can only delete your own comment",
      });
      return;
    }

    await Comment.findByIdAndDelete(id);

    res.status(200).json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};