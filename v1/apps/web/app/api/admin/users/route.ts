import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/is-admin";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/user";
import { Domain } from "@/models/domain";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "25"));
  const domainStatus = searchParams.get("domainStatus"); // verified | pending

  let userFilter: Record<string, unknown> = {};

  if (domainStatus === "verified" || domainStatus === "pending") {
    const matchingUserIds = await Domain.distinct("userId", {
      verified: domainStatus === "verified",
    });
    userFilter = { _id: { $in: matchingUserIds } };
  }

  const [users, total] = await Promise.all([
    User.find(userFilter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("_id email name plan createdAt")
      .lean(),
    User.countDocuments(userFilter),
  ]);

  const userIds = users.map((u) => u._id);
  const domains = await Domain.find({ userId: { $in: userIds.map((id) => id.toString()) } })
    .select("userId verified")
    .lean();

  // a user counts as "verified" if they have at least one verified domain,
  // otherwise "pending" (covers users with only pending domains, or none yet)
  const verifiedUserIds = new Set(
    domains.filter((d) => d.verified).map((d) => String(d.userId))
  );

  const usersOut = users.map((u) => ({
    _id: String(u._id),
    email: u.email,
    name: u.name,
    plan: u.plan,
    domainStatus: verifiedUserIds.has(String(u._id)) ? "verified" : "pending",
    createdAt: u.createdAt?.toISOString() ?? null,
  }));

  return NextResponse.json({ users: usersOut, total });
}