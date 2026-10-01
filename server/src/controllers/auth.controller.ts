
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../models/User.js";

import {
  signupSchema,
  loginSchema,
} from "../validators/auth.validator.js";

export const signup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 1. Validate request data
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        message: "Validation failed",
        errors:
          validationResult.error.flatten().fieldErrors,
      });
      return;
    }

    const {
      firstName,
      lastName,
      email,
      password,
    } = validationResult.data;

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(409).json({
        message:
          "User with this email already exists",
      });
      return;
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // 4. Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    // 5. Send response without password
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        photoUrl: user.photoUrl,
        headline: user.headline,
        about: user.about,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 1. Validate request data
    const validationResult = loginSchema.safeParse(
      req.body
    );

    if (!validationResult.success) {
      res.status(400).json({
        message: "Validation failed",
        errors:
          validationResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } =
      validationResult.data;

    // 2. Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    // 3. Compare entered password with hashed password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    // 4. Get JWT secrets
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret =
      process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret) {
      throw new Error(
        "JWT_SECRET is not defined"
      );
    }

    if (!jwtRefreshSecret) {
      throw new Error(
        "JWT_REFRESH_SECRET is not defined"
      );
    }

    // 5. Generate short-lived access token
    const accessToken = jwt.sign(
      {
        userId: user._id.toString(),
      },
      jwtSecret,
      {
        expiresIn: "15m",
      }
    );

    // 6. Generate long-lived refresh token
    const refreshToken = jwt.sign(
      {
        userId: user._id.toString(),
      },
      jwtRefreshSecret,
      {
        expiresIn: "7d",
      }
    );

    // 7. Store refresh token in database
    user.refreshToken = refreshToken;

    await user.save();

    // 8. Send successful login response
    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        photoUrl: user.photoUrl,
        headline: user.headline,
        about: user.about,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

/*
 * Refresh Access Token
 *
 * User provides their refresh token.
 * We verify it and generate a new access token.
 */
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    // 1. Validate refresh token
    if (!token || typeof token !== "string") {
      res.status(401).json({
        message: "Refresh token is required",
      });
      return;
    }

    // 2. Get refresh token secret
    const jwtRefreshSecret =
      process.env.JWT_REFRESH_SECRET;

    if (!jwtRefreshSecret) {
      throw new Error(
        "JWT_REFRESH_SECRET is not defined"
      );
    }

    // 3. Verify refresh token
    let decoded: { userId: string };

    try {
      decoded = jwt.verify(
        token,
        jwtRefreshSecret
      ) as { userId: string };
    } catch (error) {
      res.status(401).json({
        message:
          "Invalid or expired refresh token",
      });
      return;
    }

    // 4. Find user
    const user = await User.findById(
      decoded.userId
    );

    if (!user) {
      res.status(401).json({
        message: "User not found",
      });
      return;
    }

    // 5. Check stored refresh token
    if (
      !user.refreshToken ||
      user.refreshToken !== token
    ) {
      res.status(401).json({
        message: "Invalid refresh token",
      });
      return;
    }

    // 6. Get access token secret
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error(
        "JWT_SECRET is not defined"
      );
    }

    // 7. Generate new access token
    const accessToken = jwt.sign(
      {
        userId: user._id.toString(),
      },
      jwtSecret,
      {
        expiresIn: "15m",
      }
    );

    // 8. Send new access token
    res.status(200).json({
      message: "Access token refreshed successfully",
      accessToken,
    });
  } catch (error) {
    console.error(
      "Refresh token error:",
      error
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

/*
 * Forgot Password
 *
 * User provides their email.
 * We generate a temporary reset token
 * and store it in the database.
 */
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    // 1. Validate email
    if (!email || typeof email !== "string") {
      res.status(400).json({
        message: "Email is required",
      });
      return;
    }

    // 2. Find user
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    /*
     * Don't reveal whether an email exists.
     */
    if (!user) {
      res.status(200).json({
        message:
          "If an account exists with this email, a password reset link has been generated.",
      });
      return;
    }

    // 3. Generate random reset token
    const resetToken = crypto
      .randomBytes(32)
      .toString("hex");

    // 4. Token expires after 15 minutes
    const resetTokenExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    // 5. Save token and expiry
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires =
      resetTokenExpires;

    await user.save();

    /*
     * Local development only:
     * Return the token so we can test
     * the reset-password flow.
     */
    res.status(200).json({
      message:
        "Password reset token generated successfully",
      resetToken,
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

/*
 * Reset Password
 *
 * User provides the reset token
 * and their new password.
 */
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    // 1. Validate token
    if (!token || typeof token !== "string") {
      res.status(400).json({
        message: "Reset token is required",
      });
      return;
    }

    // 2. Validate new password
    if (
      !newPassword ||
      typeof newPassword !== "string"
    ) {
      res.status(400).json({
        message: "New password is required",
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        message:
          "New password must be at least 6 characters",
      });
      return;
    }

    // 3. Find user with valid, non-expired token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      res.status(400).json({
        message:
          "Invalid or expired reset token",
      });
      return;
    }

    // 4. Hash the new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    // 5. Update password
    user.password = hashedPassword;

    // 6. Clear reset token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // 7. Send success response
    res.status(200).json({
      message:
        "Password reset successfully",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

