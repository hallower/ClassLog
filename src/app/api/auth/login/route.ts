import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, authPassword, cookieOptions } from "@/lib/sync/server";

export async function POST(req: NextRequest) {
  const expected = authPassword();
  if (!expected) {
    /* 비밀번호 미설정 = 개발 모드. 그냥 통과 */
    return NextResponse.json({ ok: true, mode: "no-auth" });
  }
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }
  const password = body.password?.trim();
  if (!password) {
    return NextResponse.json({ ok: false, error: "비밀번호를 입력하세요." }, { status: 400 });
  }
  if (password !== expected) {
    /* 정보 노출 최소화. 일관된 메시지 */
    return NextResponse.json({ ok: false, error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, expected, cookieOptions());
  return res;
}
