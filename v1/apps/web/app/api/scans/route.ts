import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Scan } from "@/models/scan";
import { submitScan } from "@/lib/scanner-client";
import { auth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { url, domain } = body;

  if (!url || !domain) {
    return NextResponse.json({ error: "url and domain are required" }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id ?? "anonymous";
  const scanId = uuidv4();
  const callbackUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  await connectDB();

  await Scan.create({
    scanId,
    userId,
    domain,
    url,
    verified: true,
    status: "pending",
  });

  await submitScan({ scanId, url, domain, callbackUrl });

  return NextResponse.json({ scanId }, { status: 202 });
}