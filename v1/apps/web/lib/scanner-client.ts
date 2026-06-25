import { ScanJob } from "@/models/scan";

const SCANNER_URL = process.env.SCANNER_URL!;
const INTERNAL_KEY = process.env.INTERNAL_KEY!;

async function post(path: string, body: unknown) {
  const res = await fetch(`${SCANNER_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Key": INTERNAL_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Scanner API error: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

export async function submitScan(job: {
  scanId: string;
  url: string;
  domain: string;
  callbackUrl: string;
}) {
  return post("/scans", job);
}

export async function verifyDomain(payload: {
  domain: string;
  token: string;
  method: "dns" | "file";
}) {
  return post("/verify", payload);
}