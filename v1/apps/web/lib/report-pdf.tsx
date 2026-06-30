import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface CheckResult {
  module: string;
  check: string;
  passed: boolean;
  severity: string;
  title: string;
  description: string;
  fix: string;
}

interface ReportPDFProps {
  domain: string;
  score: number;
  grade: string;
  createdAt: string;
  results: CheckResult[];
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0D0D0D",
  },
  header: {
    marginBottom: 24,
    borderBottom: "1pt solid #D8D6D0",
    paddingBottom: 16,
  },
  logo: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 2,
    marginBottom: 4,
  },
  domain: {
    fontSize: 12,
    color: "#666666",
  },
  scoreSection: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
    marginTop: 16,
  },
  grade: {
    fontSize: 48,
    fontWeight: 700,
    marginRight: 16,
  },
  scoreText: {
    fontSize: 16,
    color: "#666666",
  },
  meta: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1,
    color: "#666666",
    marginBottom: 12,
    marginTop: 20,
  },
  resultCard: {
    border: "1pt solid #D8D6D0",
    padding: 10,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  severityTag: {
    fontSize: 8,
    fontWeight: 700,
    border: "1pt solid",
    padding: "2 4",
    marginRight: 8,
  },
  resultTitle: {
    fontSize: 11,
    fontWeight: 700,
  },
  resultDesc: {
    fontSize: 9,
    color: "#444444",
    marginBottom: 6,
    lineHeight: 1.4,
  },
  fixBox: {
    backgroundColor: "#F7F6F2",
    padding: 6,
    marginTop: 4,
  },
  fixLabel: {
    fontSize: 8,
    color: "#666666",
    fontWeight: 700,
  },
  fixText: {
    fontSize: 9,
    marginTop: 2,
  },
  passedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  passedText: {
    fontSize: 9,
    marginLeft: 6,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#999999",
    textAlign: "center",
    borderTop: "1pt solid #D8D6D0",
    paddingTop: 10,
  },
});

function severityColor(severity: string) {
  if (severity === "critical") return "#E63946";
  if (severity === "warning") return "#F4A261";
  return "#9B9B9B";
}

function gradeColor(grade: string) {
  if (grade === "A" || grade === "B") return "#2A9D8F";
  if (grade === "C" || grade === "D") return "#F4A261";
  return "#E63946";
}

export function ReportPDF({ domain, score, grade, createdAt, results }: ReportPDFProps) {
  const failed = results.filter((r) => !r.passed)
    .sort((a, b) => {
      const order: Record<string, number> = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    });
  const passed = results.filter((r) => r.passed);
  const date = createdAt ? new Date(createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  }) : "";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>VERISITE</Text>
          <Text style={styles.domain}>Security Report — {domain}</Text>
        </View>

        <View style={styles.scoreSection}>
          <Text style={{ ...styles.grade, color: gradeColor(grade) }}>{grade}</Text>
          <Text style={styles.scoreText}>{score}/100</Text>
        </View>
        <Text style={styles.meta}>
          {failed.length} issues found · {passed.length} checks passed · Scanned {date}
        </Text>

        {failed.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>ISSUES TO FIX</Text>
            {failed.map((r) => (
              <View key={r.check} style={styles.resultCard} wrap={false}>
                <View style={styles.resultHeader}>
                  <Text style={{ ...styles.severityTag, color: severityColor(r.severity), borderColor: severityColor(r.severity) }}>
                    {r.severity.toUpperCase()}
                  </Text>
                  <Text style={styles.resultTitle}>{r.title}</Text>
                </View>
                {r.description ? <Text style={styles.resultDesc}>{r.description}</Text> : null}
                {r.fix ? (
                  <View style={styles.fixBox}>
                    <Text style={styles.fixLabel}>FIX</Text>
                    <Text style={styles.fixText}>{r.fix}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </>
        )}

        {passed.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>PASSING CHECKS</Text>
            {passed.map((r) => (
              <View key={r.check} style={styles.passedRow}>
                <Text style={{ color: "#2A9D8F", fontWeight: 700 }}>✓</Text>
                <Text style={styles.passedText}>{r.title}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.footer}>
          Generated by Verisite · verisite.luqman.cloud
        </Text>
      </Page>
    </Document>
  );
}