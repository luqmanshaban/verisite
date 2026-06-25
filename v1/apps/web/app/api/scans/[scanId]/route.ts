import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Scan } from "@/models/scan";
import { Result } from "@/models/result";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params;

  await connectDB();

  const scan = await Scan.findOne({ scanId });
  if (!scan) {
    return NextResponse.json({ error: "scan not found" }, { status: 404 });
  }

  const results = await Result.find({ scanId }).sort({ completedAt: 1 });

  return NextResponse.json({ scan, results });
}