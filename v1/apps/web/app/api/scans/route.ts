import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Scan } from "@/models/scan";
import { submitScan } from "@/lib/scanner-client";
import { auth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

const FREE_DAILY_LIMIT = 3;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { url, domain } = body;

  if (!url || !domain) {
    return NextResponse.json(
      { error: "url and domain are required" },
      { status: 400 }
    );
  }

  const session = await auth();
  const userId = session?.user?.id ?? "anonymous";
  const plan = session?.user?.plan ?? "free";

  await connectDB();

  // enforce free tier limits
  if (plan === "free") {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayCount = await Scan.countDocuments({
      userId,
      createdAt: { $gte: startOfDay },
    });

    if (todayCount >= FREE_DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: "daily_limit_reached",
          message: "You have reached your 3 scans/day limit on the free plan.",
        },
        { status: 429 }
      );
    }

    // check domain limit — free users can only scan 1 unique domain
    const existingDomains = await Scan.distinct("domain", { userId });
    if (existingDomains.length > 0 && !existingDomains.includes(domain)) {
      return NextResponse.json(
        {
          error: "domain_limit_reached",
          message: "Free plan is limited to 1 domain. Upgrade to scan more.",
        },
        { status: 403 }
      );
    }
  }

  const scanId = uuidv4();
  const callbackUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

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