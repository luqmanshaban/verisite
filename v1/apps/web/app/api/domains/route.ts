import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Domain } from "@/models/domain";
import { auth } from "@/lib/auth";
import { isThirdPartyHost } from "@/lib/hosting-detector";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { domain } = await req.json();
  if (!domain) {
    return NextResponse.json({ error: "domain is required" }, { status: 400 });
  }

  await connectDB();

  const existing = await Domain.findOne({ userId: session.user.id, domain });
  if (existing) {
    return NextResponse.json({ domain: existing });
  }

  const token = crypto.randomBytes(16).toString("hex");

  const newDomain = await Domain.create({
    userId: session.user.id,
    domain,
    verified: false,
    verificationToken: token,
    isThirdPartyHost: isThirdPartyHost(domain),
  });

  return NextResponse.json({ domain: newDomain }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await connectDB();
  const domains = await Domain.find({ userId: session.user.id }).sort({ createdAt: -1 });

  return NextResponse.json({ domains });
}