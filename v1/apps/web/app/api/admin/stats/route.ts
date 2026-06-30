import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Scan } from "@/models/scan";
import { Domain } from "@/models/domain";
import { User } from "@/models/user";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/is-admin";

export async function GET() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await connectDB();

  const [
    totalUsers,
    totalScans,
    anonymousScans,
    completedScans,
    verifiedDomains,
    pendingDomains,
    recentUsers,
    recentScans,
    scansByUser,
  ] = await Promise.all([
    User.countDocuments(),
    Scan.countDocuments(),
    Scan.countDocuments({ userId: "anonymous" }),
    Scan.countDocuments({ status: "completed" }),
    Domain.countDocuments({ verified: true }),
    Domain.countDocuments({ verified: false }),
    User.find().sort({ createdAt: -1 }).limit(10).lean(),
    Scan.find().sort({ createdAt: -1 }).limit(15).lean(),
    Scan.aggregate([
      { $match: { userId: { $ne: "anonymous" } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const repeatUsers = scansByUser.filter((u) => u.count >= 3).length;
  const powerUsers = scansByUser.filter((u) => u.count >= 10).length;

  return NextResponse.json({
    totals: {
      users: totalUsers,
      scans: totalScans,
      anonymousScans,
      loggedInScans: totalScans - anonymousScans,
      completedScans,
      verifiedDomains,
      pendingDomains,
    },
    engagement: {
      uniqueScanners: scansByUser.length,
      repeatUsers,   // 3+ scans
      powerUsers,    // 10+ scans (hitting the limit)
    },
    recentUsers: recentUsers.map((u) => ({
      email: u.email,
      name: u.name,
      plan: u.plan,
      createdAt: u.createdAt?.toISOString() ?? null,
    })),
    recentScans: recentScans.map((s) => ({
      domain: s.domain,
      userId: s.userId,
      status: s.status,
      score: s.score,
      grade: s.grade,
      createdAt: s.createdAt?.toISOString() ?? null,
    })),
    topScanners: scansByUser.slice(0, 10),
  });
}