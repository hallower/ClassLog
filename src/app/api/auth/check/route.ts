import { NextResponse } from "next/server";
import { authPassword, isAuthenticated, isRedisConfigured } from "@/lib/sync/server";

export async function GET() {
  const required = !!authPassword();
  const authed = await isAuthenticated();
  return NextResponse.json({
    authRequired: required,
    authed,
    syncEnabled: isRedisConfigured(),
  });
}
