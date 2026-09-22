import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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
        errors: validationResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { firstName, lastName, email, password } =
      validationResult.data;

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(409).json({
        message: "User with this email already exists",
      });
      return;
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

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
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validationResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = validationResult.data;

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

    // 4. Get JWT secret
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    // 5. Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      jwtSecret,
      {
        expiresIn: "1h",
      }
    );

    // 6. Send successful login response
    res.status(200).json({
      message: "Login successful",
      token,
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