import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { Scan } from "@/models/scan";
import OverviewClient from "./OverviewClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await connectDB();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [scans, todayCount] = await Promise.all([
    Scan.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Scan.countDocuments({
      userId: session.user.id,
      createdAt: { $gte: startOfDay },
    }),
  ]);

  const serialized = scans.map((s) => ({
    scanId: s.scanId,
    domain: s.domain,
    url: s.url,
    status: s.status,
    score: s.score,
    grade: s.grade,
    createdAt: s.createdAt?.toISOString() ?? null,
  }));

  return (
    <OverviewClient
      scans={serialized}
      user={session.user}
      todayCount={todayCount}
    />
  );
}