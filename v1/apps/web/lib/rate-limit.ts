import { connectDB } from "@/lib/mongodb";
import mongoose, { Schema } from "mongoose";

interface IRateLimitLog {
  ip: string;
  date: string;
  count: number;
}

const RateLimitSchema = new Schema<IRateLimitLog>({
  ip: { type: String, required: true },
  date: { type: String, required: true },
  count: { type: Number, default: 0 },
});

RateLimitSchema.index({ ip: 1, date: 1 }, { unique: true });

const RateLimitLog =
  mongoose.models.RateLimitLog ||
  mongoose.model<IRateLimitLog>("RateLimitLog", RateLimitSchema);

const ANONYMOUS_DAILY_LIMIT = 3;

export async function checkAnonymousLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  await connectDB();
  const today = new Date().toISOString().split("T")[0];

  const log = await RateLimitLog.findOneAndUpdate(
    { ip, date: today },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );

  const allowed = log.count <= ANONYMOUS_DAILY_LIMIT;
  const remaining = Math.max(0, ANONYMOUS_DAILY_LIMIT - log.count);

  return { allowed, remaining };
}

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}