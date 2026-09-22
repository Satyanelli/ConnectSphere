import { Request, Response } from "express";
import User from "../models/User.js";

// Get logged-in user's profile
export const getMe = async (
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

    const user = await User.findById(userId).select("-password");

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get another user's public profile
export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        message: "User ID is required",
      });
      return;
    }

    const user = await User.findById(id).select("-password -__v");

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get user profile error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Update logged-in user's profile
export const updateMe = async (
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

    const {
      firstName,
      lastName,
      photoUrl,
      headline,
      about,
      location,
      skills,
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    if (firstName !== undefined) {
      user.firstName = firstName;
    }

    if (lastName !== undefined) {
      user.lastName = lastName;
    }

    if (photoUrl !== undefined) {
      user.photoUrl = photoUrl;
    }

    if (headline !== undefined) {
      user.headline = headline;
    }

    if (about !== undefined) {
      user.about = about;
    }

    if (location !== undefined) {
      user.location = location;
    }

    if (skills !== undefined) {
      user.skills = skills;
    }

    await user.save();

    const updatedUser = await User.findById(userId).select("-password");

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};