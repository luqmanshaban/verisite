import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { Scan } from "@/models/scan";
import { Result } from "@/models/result";
import ScanDetailClient from "./ScanDetailClient";

export default async function ScanDetailPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  await connectDB();

  const scan = await Scan.findOne({ scanId, userId: session.user.id }).lean();
  if (!scan) notFound();

  const results = await Result.find({ scanId }).sort({ completedAt: 1 }).lean();

  const serializedScan = {
    scanId: scan.scanId,
    domain: scan.domain,
    url: scan.url,
    status: scan.status,
    score: scan.score,
    grade: scan.grade,
    createdAt: scan.createdAt?.toISOString() ?? null,
    completedAt: scan.completedAt?.toISOString() ?? null,
  };

  const serializedResults = results.map((r) => ({
    module: r.module,
    check: r.check,
    passed: r.passed,
    severity: r.severity,
    title: r.title,
    description: r.description,
    fix: r.fix,
  }));

  return <ScanDetailClient scan={serializedScan} results={serializedResults} />;
}