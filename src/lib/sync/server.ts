import { Redis } from "@upstash/redis";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "classlog_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; /* 1년 */
const DATA_KEY = "classlog:data";
const META_KEY = "classlog:meta";

export function authPassword(): string | null {
  const v = process.env.APP_PASSWORD?.trim();
  return v && v.length > 0 ? v : null;
}

export function isRedisConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

let _redis: Redis | null = null;
export function getRedis(): Redis {
  if (!isRedisConfigured()) {
    throw new Error("Redis 환경변수(KV_REST_API_URL/KV_REST_API_TOKEN)가 설정되지 않았습니다.");
  }
  if (!_redis) {
    _redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return _redis;
}

/** 요청 쿠키가 유효한지 검사. 비밀번호 미설정이면 자동 통과(개발용). */
export async function isAuthenticated(): Promise<boolean> {
  const expected = authPassword();
  if (!expected) return true;
  const jar = await cookies();
  const value = jar.get(AUTH_COOKIE)?.value;
  return value === expected;
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

export interface DataRecord {
  data: unknown;
  modifiedAt: number;
  revision: number;
}

export async function pullData(): Promise<DataRecord | null> {
  const redis = getRedis();
  /* Upstash는 JSON 객체를 자동으로 (de)serialize */
  const record = await redis.get<DataRecord>(DATA_KEY);
  return record ?? null;
}

export async function pushData(payload: unknown): Promise<DataRecord> {
  const redis = getRedis();
  const prev = await redis.get<DataRecord>(META_KEY);
  const revision = (prev?.revision ?? 0) + 1;
  const record: DataRecord = {
    data: payload,
    modifiedAt: Date.now(),
    revision,
  };
  /* 데이터·메타를 함께 갱신 (pipeline) */
  const pipe = redis.multi();
  pipe.set(DATA_KEY, record);
  pipe.set(META_KEY, { modifiedAt: record.modifiedAt, revision });
  await pipe.exec();
  return record;
}

export async function getMeta(): Promise<{ modifiedAt: number; revision: number } | null> {
  const redis = getRedis();
  const meta = await redis.get<{ modifiedAt: number; revision: number }>(META_KEY);
  return meta ?? null;
}
