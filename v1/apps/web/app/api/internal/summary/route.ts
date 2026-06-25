import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Scan } from "@/models/scan";

export async function POST(req: NextRequest) {
  const internalKey = req.headers.get("x-internal-key");
  if (internalKey !== process.env.INTERNAL_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { scanId, score, grade, status } = await req.json();
  await connectDB();
  await Scan.findOneAndUpdate(
    { scanId },
    { score, grade, status, completedAt: new Date() }
  );

  return NextResponse.json({ ok: true });
}