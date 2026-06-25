import mongoose, { Schema, Model } from "mongoose";

export interface IUser {
  email: string;
  name: string;
  avatar: string;
  githubId: string;
  plan: "free" | "pro";
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    avatar: { type: String },
    githubId: { type: String },
    plan: { type: String, enum: ["free", "pro"], default: "free" },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);