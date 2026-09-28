import { Request, Response } from "express";
import mongoose from "mongoose";

import Message from "../models/Message.js";
import Connection from "../models/Connection.js";

export const sendMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const senderId = req.userId;

    if (!senderId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const { receiverId, text } = req.body;

    if (!receiverId || !text) {
      res.status(400).json({
        message: "Receiver ID and message text are required",
      });
      return;
    }

    if (typeof receiverId !== "string") {
      res.status(400).json({
        message: "Invalid receiver ID",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      res.status(400).json({
        message: "Invalid receiver ID",
      });
      return;
    }

    if (senderId === receiverId) {
      res.status(400).json({
        message: "You cannot message yourself",
      });
      return;
    }

    const messageText = String(text).trim();

    if (!messageText) {
      res.status(400).json({
        message: "Message cannot be empty",
      });
      return;
    }

    const connection = await Connection.findOne({
      $or: [
        {
          requesterId: senderId,
          recipientId: receiverId,
          status: "ACCEPTED",
        },
        {
          requesterId: receiverId,
          recipientId: senderId,
          status: "ACCEPTED",
        },
      ],
    });

    if (!connection) {
      res.status(403).json({
        message:
          "You can only message users you are connected with",
      });
      return;
    }

    const message = await Message.create({
      senderId,
      receiverId,
      text: messageText,
    });

    res.status(201).json({
      message,
    });
  } catch (error) {
    console.error("Send message error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = req.userId;

    if (!currentUserId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const targetUserIdParam = req.params.userId;

    if (!targetUserIdParam) {
      res.status(400).json({
        message: "User ID is required",
      });
      return;
    }

    if (typeof targetUserIdParam !== "string") {
      res.status(400).json({
        message: "Invalid user ID",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(targetUserIdParam)) {
      res.status(400).json({
        message: "Invalid user ID",
      });
      return;
    }

    if (currentUserId === targetUserIdParam) {
      res.status(400).json({
        message: "You cannot have a conversation with yourself",
      });
      return;
    }

    const connection = await Connection.findOne({
      $or: [
        {
          requesterId: currentUserId,
          recipientId: targetUserIdParam,
          status: "ACCEPTED",
        },
        {
          requesterId: targetUserIdParam,
          recipientId: currentUserId,
          status: "ACCEPTED",
        },
      ],
    });

    if (!connection) {
      res.status(403).json({
        message:
          "You can only view conversations with connected users",
      });
      return;
    }

    const messages = await Message.find({
      $or: [
        {
          senderId: currentUserId,
          receiverId: targetUserIdParam,
        },
        {
          senderId: targetUserIdParam,
          receiverId: currentUserId,
        },
      ],
    })
      .sort({ createdAt: 1 })
      .populate(
        "senderId",
        "firstName lastName photoUrl"
      )
      .populate(
        "receiverId",
        "firstName lastName photoUrl"
      );

    res.status(200).json({
      messages,
    });
  } catch (error) {
    console.error(
      "Get conversation error:",
      error
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};
export const getConversations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = req.userId;

    if (!currentUserId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const connections = await Connection.find({
      $or: [
        {
          requesterId: currentUserId,
          status: "ACCEPTED",
        },
        {
          recipientId: currentUserId,
          status: "ACCEPTED",
        },
      ],
    });

    const conversations = await Promise.all(
      connections.map(async (connection) => {
        const requesterId =
          connection.requesterId.toString();

        const recipientId =
          connection.recipientId.toString();

        const otherUserId =
          requesterId === currentUserId
            ? recipientId
            : requesterId;

        const latestMessage = await Message.findOne({
          $or: [
            {
              senderId: currentUserId,
              receiverId: otherUserId,
            },
            {
              senderId: otherUserId,
              receiverId: currentUserId,
            },
          ],
        })
          .sort({ createdAt: -1 })
          .populate(
            "senderId",
            "firstName lastName photoUrl"
          )
          .populate(
            "receiverId",
            "firstName lastName photoUrl"
          );

        if (!latestMessage) {
          return null;
        }

        return {
          userId: otherUserId,
          lastMessage: latestMessage,
        };
      })
    );

    const filteredConversations =
      conversations.filter(
        (conversation) => conversation !== null
      );

    filteredConversations.sort(
      (a, b) =>
        new Date(
          b!.lastMessage.createdAt
        ).getTime() -
        new Date(
          a!.lastMessage.createdAt
        ).getTime()
    );

    res.status(200).json({
      conversations: filteredConversations,
    });
  } catch (error) {
    console.error(
      "Get conversations error:",
      error
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};