
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import connectDB from "./config/db.js";

import User from "./models/User.js";
import Message from "./models/Message.js";
import Connection from "./models/Connection.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import postRoutes from "./routes/post.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import connectionRoutes from "./routes/connection.routes.js";
import messageRoutes from "./routes/message.routes.js";

dotenv.config();

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "ConnectSphere API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/messages", messageRoutes);

/*
  Socket authentication
*/
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token || typeof token !== "string") {
      return next(
        new Error("Authentication token is required")
      );
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return next(
        new Error("JWT_SECRET is not defined")
      );
    }

    const decoded = jwt.verify(
      token,
      jwtSecret
    ) as { userId: string };

    socket.data.userId = decoded.userId;

    next();
  } catch (error) {
    console.error(
      "Socket authentication error:",
      error
    );

    next(
      new Error("Invalid or expired access token")
    );
  }
});

/*
  Socket connection
*/
io.on("connection", (socket) => {
  const currentUserId = socket.data.userId as string;

  console.log(
    `Socket connected: ${socket.id}`
  );

  console.log(
    `Authenticated user: ${currentUserId}`
  );

  /*
    Join user-specific room
  */
  socket.join(`user:${currentUserId}`);

  console.log(
    `User joined room: user:${currentUserId}`
  );

  /*
    Real-time message
  */
  socket.on(
    "sendMessage",
    async (data: {
      receiverId: string;
      text: string;
    }) => {
      try {
        const { receiverId, text } = data;

        /*
          Validate receiver ID
        */
        if (
          !receiverId ||
          !mongoose.Types.ObjectId.isValid(receiverId)
        ) {
          socket.emit("messageError", {
            message: "Invalid receiver ID",
          });

          return;
        }

        /*
          Validate message text
        */
        const trimmedText =
          typeof text === "string"
            ? text.trim()
            : "";

        if (!trimmedText) {
          socket.emit("messageError", {
            message: "Message cannot be empty",
          });

          return;
        }

        /*
          Prevent sending to yourself
        */
        if (currentUserId === receiverId) {
          socket.emit("messageError", {
            message: "You cannot message yourself",
          });

          return;
        }

        /*
          Check receiver exists
        */
        const receiver = await User.findById(
          receiverId
        );

        if (!receiver) {
          socket.emit("messageError", {
            message: "Receiver not found",
          });

          return;
        }

        /*
          Check accepted connection
        */
        const connection =
          await Connection.findOne({
            $or: [
              {
                requesterId: currentUserId,
                recipientId: receiverId,
              },
              {
                requesterId: receiverId,
                recipientId: currentUserId,
              },
            ],
            status: "ACCEPTED",
          });

        if (!connection) {
          socket.emit("messageError", {
            message:
              "You can only message connected users",
          });

          return;
        }

        /*
          Save message
        */
        const message = await Message.create({
          senderId: currentUserId,
          receiverId,
          text: trimmedText,
        });

        /*
          Get complete message with user details
        */
        const populatedMessage =
          await Message.findById(message._id)
            .populate(
              "senderId",
              "firstName lastName photoUrl"
            )
            .populate(
              "receiverId",
              "firstName lastName photoUrl"
            );

        /*
          Send message to both users
        */
        io.to(`user:${currentUserId}`)
          .to(`user:${receiverId}`)
          .emit(
            "newMessage",
            populatedMessage
          );

        console.log(
          `Real-time message sent from ${currentUserId} to ${receiverId}`
        );
      } catch (error) {
        console.error(
          "Socket send message error:",
          error
        );

        socket.emit("messageError", {
          message: "Unable to send message",
        });
      }
    }
  );

  /*
    Disconnect
  */
  socket.on("disconnect", () => {
    console.log(
      `Socket disconnected: ${socket.id}`
    );
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(
      `ConnectSphere server running on port ${PORT}`
    );
  });
};

startServer();

