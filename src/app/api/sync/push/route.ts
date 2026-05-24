import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, isRedisConfigured, pushData } from "@/lib/sync/server";

/* sendBeacon은 큰 페이로드를 보낼 수 없어 일반 fetch만 지원해도 충분.
   학생 10명·이미지 포함 평균 ~3MB. 최대 페이로드 8MB 한도. */
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isRedisConfigured()) {
    return NextResponse.json({ error: "sync_disabled" }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    const record = await pushData(body);
    return NextResponse.json({ ok: true, modifiedAt: record.modifiedAt, revision: record.revision });
  } catch (err) {
    console.error("[sync/push]", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "push failed" },
      { status: 500 },
    );
  }
}
