import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { Scan } from "@/models/scan";
import ScansClient from "./ScansClient";

export default async function ScansPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await connectDB();
  const scans = await Scan.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const serialized = scans.map((s) => ({
    scanId: s.scanId,
    domain: s.domain,
    url: s.url,
    status: s.status,
    score: s.score,
    grade: s.grade,
    createdAt: s.createdAt?.toISOString() ?? null,
  }));

  return <ScansClient scans={serialized} />;
}