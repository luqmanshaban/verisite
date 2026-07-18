// app/api/admin/scans/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/is-admin";
import {connectDB} from "@/lib/mongodb";
import {Scan} from "@/models/scan";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "25"));
  const status = searchParams.get("status");   // completed | pending | failed
  const type = searchParams.get("type");       // anonymous | user

  const filter: Record<string, unknown> = {};
  if (status && status !== "all") filter.status = status;
  if (type === "anonymous") filter.userId = "anonymous";
  if (type === "user") filter.userId = { $ne: "anonymous" };

  const [scans, total] = await Promise.all([
    Scan.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("_id scanId url domain userId status score grade createdAt")
      .lean(),
    Scan.countDocuments(filter),
  ]);

  return NextResponse.json({ scans, total });
}