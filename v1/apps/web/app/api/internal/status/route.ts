import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Scan } from "@/models/scan";

export async function POST(req: NextRequest) {
  const internalKey = req.headers.get("x-internal-key");
  if (internalKey !== process.env.INTERNAL_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { scanId, status } = body;

  await connectDB();
  await Scan.findOneAndUpdate({ scanId }, { status });


  return NextResponse.json({ ok: true });
}