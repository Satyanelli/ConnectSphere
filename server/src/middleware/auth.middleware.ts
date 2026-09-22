import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
}

export const protect = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // 1. Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    // 2. Extract token
    const token = authHeader.split(" ")[1];

    // 3. Get JWT secret
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    // 4. Verify token
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // 5. Attach user ID to request
    req.userId = decoded.userId;

    // 6. Continue to the next middleware/controller
    next();
  } catch (error) {
    console.error("Authentication error:", error);

    res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};