import mongoose, { Schema, Document, Model } from "mongoose";

export type Severity = "critical" | "warning" | "info";

export interface IResult extends Document {
  scanId: string;
  module: string;
  check: string;
  passed: boolean;
  severity: Severity;
  title: string;
  description: string;
  fix: string;
  completedAt: Date;
}

const ResultSchema = new Schema<IResult>({
  scanId: { type: String, required: true, index: true },
  module: { type: String, required: true },
  check: { type: String, required: true },
  passed: { type: Boolean, required: true },
  severity: {
    type: String,
    enum: ["critical", "warning", "info"],
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  fix: { type: String, default: "" },
  completedAt: { type: Date, default: Date.now },
});

export const Result: Model<IResult> =
  mongoose.models.Result || mongoose.model<IResult>("Result", ResultSchema);