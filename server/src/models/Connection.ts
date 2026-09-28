import mongoose, { Document, Schema } from "mongoose";

export type ConnectionStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED";

export interface IConnection extends Document {
  requesterId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const connectionSchema = new Schema<IConnection>(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

connectionSchema.index(
  {
    requesterId: 1,
    recipientId: 1,
  },
  {
    unique: true,
  }
);

const Connection = mongoose.model<IConnection>(
  "Connection",
  connectionSchema
);

export default Connection;