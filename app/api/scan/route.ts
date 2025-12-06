import { NextRequest, NextResponse } from "next/server";
import { checkVulnerability } from "@/lib/scanner";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const host = typeof body?.host === "string" ? body.host : "";
  if (!host.trim()) {
    return NextResponse.json(
      { error: "Missing 'host' in request body" },
      { status: 400 },
    );
  }

  const result = await checkVulnerability(host);
  return NextResponse.json(result);
}

