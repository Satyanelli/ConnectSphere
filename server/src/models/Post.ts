import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  content: string;
  imageUrl?: string;
  likes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model<IPost>("Post", postSchema);

export default Post;