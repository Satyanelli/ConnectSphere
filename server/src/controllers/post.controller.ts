import { Request, Response } from "express";
import mongoose from "mongoose";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";

// Create a post
export const createPost = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const { content, imageUrl } = req.body;

    if (!content || content.trim() === "") {
      res.status(400).json({
        message: "Post content is required",
      });
      return;
    }

    const post = await Post.create({
      author: userId,
      content: content.trim(),
      imageUrl: imageUrl?.trim() || "",
    });

    const populatedPost = await post.populate(
      "author",
      "firstName lastName photoUrl headline"
    );

    res.status(201).json({
      message: "Post created successfully",
      post: populatedPost,
    });
  } catch (error) {
    console.error("Create post error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get all posts - newest first
export const getPosts = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const posts = await Post.find()
      .populate("author", "firstName lastName photoUrl headline")
      .sort({ createdAt: -1 });

    res.status(200).json({
      posts,
    });
  } catch (error) {
    console.error("Get posts error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Like / Unlike a post
export const toggleLike = async (
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
        message: "Invalid post ID",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "Invalid post ID",
      });
      return;
    }

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({
        message: "Post not found",
      });
      return;
    }

    const alreadyLiked = post.likes.some(
      (likeId) => likeId.toString() === userId
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (likeId) => likeId.toString() !== userId
      );
    } else {
      post.likes.push(userId as any);
    }

    await post.save();

    res.status(200).json({
      message: alreadyLiked
        ? "Post unliked successfully"
        : "Post liked successfully",
      likeCount: post.likes.length,
      liked: !alreadyLiked,
    });
  } catch (error) {
    console.error("Toggle like error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Delete your own post
export const deletePost = async (
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
        message: "Invalid post ID",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "Invalid post ID",
      });
      return;
    }

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({
        message: "Post not found",
      });
      return;
    }

    // Only the post author can delete the post
    if (post.author.toString() !== userId) {
      res.status(403).json({
        message: "You can only delete your own post",
      });
      return;
    }

    await Post.findByIdAndDelete(id);

    // Delete comments belonging to this post
    await Comment.deleteMany({
      post: new mongoose.Types.ObjectId(id),
    });

    res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};