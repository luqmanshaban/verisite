import mongoose, { Schema, Document, Model } from "mongoose";

export type ScanStatus = "pending" | "running" | "completed" | "failed";

export interface ScanJob {
  scanId: string;
  url: string;
  domain: string;
  callbackUrl: string;
}

export interface IScan extends Document {
  scanId: string;
  userId: string;
  domain: string;
  url: string;
  verified: boolean;
  status: ScanStatus;
  score: number | null;
  grade: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

const ScanSchema = new Schema<IScan>(
  {
    scanId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true },
    domain: { type: String, required: true },
    url: { type: String, required: true },
    verified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
    },
    score: { type: Number, default: null },
    grade: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Scan: Model<IScan> =
  mongoose.models.Scan || mongoose.model<IScan>("Scan", ScanSchema);