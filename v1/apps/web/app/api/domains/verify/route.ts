import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Domain } from "@/models/domain";
import { auth } from "@/lib/auth";
import { verifyDomain } from "@/lib/scanner-client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { domain, method } = await req.json();
  if (!domain || !method) {
    return NextResponse.json(
      { error: "domain and method are required" },
      { status: 400 }
    );
  }

  await connectDB();

  const domainDoc = await Domain.findOne({ userId: session.user.id, domain });
  if (!domainDoc) {
    return NextResponse.json({ error: "domain not found" }, { status: 404 });
  }

  if (domainDoc.verified) {
    return NextResponse.json({ verified: true });
  }

  const result = await verifyDomain({
    domain,
    token: domainDoc.verificationToken,
    method,
  });

  if (result.verified) {
    domainDoc.verified = true;
    domainDoc.verificationMethod = method;
    domainDoc.verifiedAt = new Date();
    await domainDoc.save();
  }

  return NextResponse.json(result);
}