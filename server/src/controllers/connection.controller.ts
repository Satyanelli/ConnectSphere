import { Request, Response } from "express";
import mongoose from "mongoose";

import Connection from "../models/Connection.js";
import User from "../models/User.js";

// Send a connection request
export const sendConnectionRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const requesterId = req.userId;
    const { userId: recipientId } = req.body;

    if (!requesterId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    if (!recipientId) {
      res.status(400).json({
        message: "Recipient user ID is required",
      });
      return;
    }

    if (
      typeof recipientId !== "string" ||
      !mongoose.Types.ObjectId.isValid(recipientId)
    ) {
      res.status(400).json({
        message: "Invalid recipient user ID",
      });
      return;
    }

    if (requesterId === recipientId) {
      res.status(400).json({
        message:
          "You cannot send a connection request to yourself",
      });
      return;
    }

    const recipient = await User.findById(recipientId);

    if (!recipient) {
      res.status(404).json({
        message: "Recipient user not found",
      });
      return;
    }

    const existingConnection = await Connection.findOne({
      $or: [
        {
          requesterId,
          recipientId,
        },
        {
          requesterId: recipientId,
          recipientId: requesterId,
        },
      ],
    });

    if (existingConnection) {
      if (existingConnection.status === "ACCEPTED") {
        res.status(400).json({
          message: "You are already connected with this user",
        });
        return;
      }

      if (existingConnection.status === "PENDING") {
        if (
          existingConnection.requesterId.toString() ===
          requesterId
        ) {
          res.status(400).json({
            message: "Connection request already sent",
          });
          return;
        }

        res.status(400).json({
          message:
            "This user has already sent you a connection request",
        });
        return;
      }

      // If the previous request was rejected,
      // allow a new request.
      await Connection.deleteOne({
        _id: existingConnection._id,
      });
    }

    const connection = await Connection.create({
      requesterId,
      recipientId,
      status: "PENDING",
    });

    res.status(201).json({
      message: "Connection request sent successfully",
      connection,
    });
  } catch (error) {
    console.error("Send connection request error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Accept a connection request
export const acceptConnectionRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const recipientId = req.userId;
    const connectionIdParam = req.params.connectionId;

    if (!recipientId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    if (!connectionIdParam) {
      res.status(400).json({
        message: "Connection ID is required",
      });
      return;
    }

    if (typeof connectionIdParam !== "string") {
      res.status(400).json({
        message: "Invalid connection ID",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(connectionIdParam)) {
      res.status(400).json({
        message: "Invalid connection ID",
      });
      return;
    }

    const connection = await Connection.findById(
      connectionIdParam
    );

    if (!connection) {
      res.status(404).json({
        message: "Connection request not found",
      });
      return;
    }

    if (connection.recipientId.toString() !== recipientId) {
      res.status(403).json({
        message:
          "You are not allowed to accept this connection request",
      });
      return;
    }

    if (connection.status !== "PENDING") {
      res.status(400).json({
        message:
          "Only pending connection requests can be accepted",
      });
      return;
    }

    connection.status = "ACCEPTED";

    await connection.save();

    res.status(200).json({
      message: "Connection request accepted successfully",
      connection,
    });
  } catch (error) {
    console.error("Accept connection request error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Reject a connection request
export const rejectConnectionRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const recipientId = req.userId;
    const connectionIdParam = req.params.connectionId;

    if (!recipientId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    if (!connectionIdParam) {
      res.status(400).json({
        message: "Connection ID is required",
      });
      return;
    }

    if (typeof connectionIdParam !== "string") {
      res.status(400).json({
        message: "Invalid connection ID",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(connectionIdParam)) {
      res.status(400).json({
        message: "Invalid connection ID",
      });
      return;
    }

    const connection = await Connection.findById(
      connectionIdParam
    );

    if (!connection) {
      res.status(404).json({
        message: "Connection request not found",
      });
      return;
    }

    if (connection.recipientId.toString() !== recipientId) {
      res.status(403).json({
        message:
          "You are not allowed to reject this connection request",
      });
      return;
    }

    if (connection.status !== "PENDING") {
      res.status(400).json({
        message:
          "Only pending connection requests can be rejected",
      });
      return;
    }

    connection.status = "REJECTED";

    await connection.save();

    res.status(200).json({
      message: "Connection request rejected successfully",
      connection,
    });
  } catch (error) {
    console.error("Reject connection request error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get incoming pending connection requests
export const getIncomingRequests = async (
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

    const requests = await Connection.find({
      recipientId: userId,
      status: "PENDING",
    })
      .populate(
        "requesterId",
        "firstName lastName email photoUrl headline"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      requests,
    });
  } catch (error) {
    console.error("Get incoming requests error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get accepted connections
export const getConnections = async (
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

    const connections = await Connection.find({
      $or: [
        {
          requesterId: userId,
          status: "ACCEPTED",
        },
        {
          recipientId: userId,
          status: "ACCEPTED",
        },
      ],
    })
      .populate(
        "requesterId",
        "firstName lastName email photoUrl headline"
      )
      .populate(
        "recipientId",
        "firstName lastName email photoUrl headline"
      )
      .sort({ updatedAt: -1 });

    const users = connections.map((connection) => {
      const requester = connection.requesterId as any;
      const recipient = connection.recipientId as any;

      if (requester._id.toString() === userId) {
        return recipient;
      }

      return requester;
    });

    res.status(200).json({
      connections: users,
    });
  } catch (error) {
    console.error("Get connections error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};
export const getSentRequests = async (
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

    const requests = await Connection.find({
      requesterId: userId,
      status: "PENDING",
    })
      .populate(
        "recipientId",
        "firstName lastName email photoUrl headline"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      requests,
    });
  } catch (error) {
    console.error("Get sent requests error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getRelationshipStatus = async (
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

    if (userId === targetUserIdParam) {
      res.status(200).json({
        status: "SELF",
      });
      return;
    }

    const connection = await Connection.findOne({
      $or: [
        {
          requesterId: userId,
          recipientId: targetUserIdParam,
        },
        {
          requesterId: targetUserIdParam,
          recipientId: userId,
        },
      ],
    });

    if (!connection) {
      res.status(200).json({
        status: "NONE",
      });
      return;
    }

    if (connection.status === "ACCEPTED") {
      res.status(200).json({
        status: "CONNECTED",
      });
      return;
    }

    if (
      connection.status === "PENDING" &&
      connection.requesterId.toString() === userId
    ) {
      res.status(200).json({
        status: "PENDING",
      });
      return;
    }

    if (
      connection.status === "PENDING" &&
      connection.recipientId.toString() === userId
    ) {
      res.status(200).json({
        status: "RESPOND",
      });
      return;
    }

    res.status(200).json({
      status: "NONE",
    });
  } catch (error) {
    console.error("Get relationship status error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};
export const removeConnection = async (
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

    const connection = await Connection.findOne({
      $or: [
        {
          requesterId: userId,
          recipientId: targetUserIdParam,
          status: "ACCEPTED",
        },
        {
          requesterId: targetUserIdParam,
          recipientId: userId,
          status: "ACCEPTED",
        },
      ],
    });

    if (!connection) {
      res.status(404).json({
        message: "Accepted connection not found",
      });
      return;
    }

    await Connection.findByIdAndDelete(connection._id);

    res.status(200).json({
      message: "Connection removed successfully",
    });
  } catch (error) {
    console.error("Remove connection error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};