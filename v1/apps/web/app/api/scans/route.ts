import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Scan } from "@/models/scan";
import { Domain } from "@/models/domain";
import { submitScan } from "@/lib/scanner-client";
import { auth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { checkAnonymousLimit, getClientIP } from "@/lib/rate-limit";

const FREE_DAILY_LIMIT = 10;

function getRootDomain(hostname: string): string {
  const parts = hostname.split(".");
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join(".");
}

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
  await connectDB();

  // ── Anonymous flow ──────────────────────────────
  if (!session?.user) {
    const ip = getClientIP(req);
    const { allowed } = await checkAnonymousLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        {
          error: "daily_limit_reached",
          message: "Free scans limited to 3/day. Sign in for more.",
        },
        { status: 429 }
      );
    }
    const scanId = uuidv4();
    const callbackUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    await Scan.create({
      scanId,
      userId: "anonymous",
      domain,
      url,
      status: "pending",
    });
    await submitScan({ scanId, url, domain, callbackUrl });
    return NextResponse.json({ scanId }, { status: 202 });
  }

  // ── Authenticated flow ──────────────────────────
  const userId = session.user.id;
  const plan = session.user.plan ?? "free";
  const rootDomain = getRootDomain(domain);

  // Track the domain (no verification required)
  await Domain.findOneAndUpdate(
    { userId, domain },
    { userId, domain },
    { upsert: true }
  );

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
          message: "You have reached your 3 scans/day limit.",
        },
        { status: 429 }
      );
    }

    const existingRootDomains = await Domain.distinct("domain", { userId });
    const matchesExisting = existingRootDomains.some(
      (d) => getRootDomain(d) === rootDomain
    );
    if (existingRootDomains.length > 0 && !matchesExisting) {
      return NextResponse.json(
        {
          error: "domain_limit_reached",
          message: "Free plan is limited to 1 domain.",
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
    status: "pending",
  });
  await submitScan({ scanId, url, domain, callbackUrl });
  return NextResponse.json({ scanId }, { status: 202 });
}