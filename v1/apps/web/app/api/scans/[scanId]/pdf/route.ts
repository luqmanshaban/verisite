import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Scan } from "@/models/scan";
import { Result } from "@/models/result";
import { auth } from "@/lib/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportPDF } from "@/lib/report-pdf";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await connectDB();

  const scan = await Scan.findOne({ scanId, userId: session.user.id }).lean();
  if (!scan) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const results = await Result.find({ scanId }).sort({ completedAt: 1 }).lean();

  const buffer = await renderToBuffer(
    ReportPDF({
      domain: scan.domain,
      score: scan.score ?? 0,
      grade: scan.grade ?? "—",
      createdAt: scan.createdAt?.toISOString() ?? "",
      results: results.map((r) => ({
        module: r.module,
        check: r.check,
        passed: r.passed,
        severity: r.severity,
        title: r.title,
        description: r.description,
        fix: r.fix,
      })),
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="verisite-report-${scan.domain}.pdf"`,
    },
  });
}