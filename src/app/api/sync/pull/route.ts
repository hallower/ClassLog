import { NextResponse } from "next/server";
import { isAuthenticated, isRedisConfigured, pullData } from "@/lib/sync/server";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isRedisConfigured()) {
    return NextResponse.json({ error: "sync_disabled" }, { status: 503 });
  }
  try {
    const record = await pullData();
    return NextResponse.json({ ok: true, record });
  } catch (err) {
    console.error("[sync/pull]", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "pull failed" },
      { status: 500 },
    );
  }
}
