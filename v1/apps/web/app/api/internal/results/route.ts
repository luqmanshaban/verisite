import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Result } from "@/models/result";

export async function POST(req: NextRequest) {
  const internalKey = req.headers.get("x-internal-key");
  if (internalKey !== process.env.INTERNAL_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { scanId, module, check, passed, severity, title, description, fix } = body;

  await connectDB();
  await Result.findOneAndUpdate(
    { scanId, check },
    {
      scanId, module, check, passed, severity, title,
      description: description ?? "",
      fix: fix ?? "",
      completedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true });
}