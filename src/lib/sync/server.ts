import { Redis as UpstashRedis } from "@upstash/redis";
import IORedis, { type Redis as IORedisType } from "ioredis";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "classlog_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; /* 1년 */
const DATA_KEY = "classlog:data";
const META_KEY = "classlog:meta";

export function authPassword(): string | null {
  const v = process.env.APP_PASSWORD?.trim();
  return v && v.length > 0 ? v : null;
}

/* ---------- Redis 클라이언트 선택 ----------
 * Vercel/Upstash 통합 방식과 시기에 따라 환경변수 이름·형식이 다양.
 * 지원 형식:
 *   1) UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN  → HTTPS REST (@upstash/redis)
 *   2) KV_REST_API_URL + KV_REST_API_TOKEN                → 구 Vercel KV REST (@upstash/redis)
 *   3) REDIS_URL = redis://… 또는 rediss://…             → TCP (ioredis)
 *   4) REDIS_URL = https://user:token@host               → REST (token 분리해 @upstash/redis)
 */

type Client =
  | { kind: "rest"; r: UpstashRedis }
  | { kind: "tcp"; r: IORedisType };

let _client: Client | null = null;

function buildClient(): Client | null {
  /* 1) UPSTASH REST */
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (upstashUrl && upstashToken) {
    return { kind: "rest", r: new UpstashRedis({ url: upstashUrl, token: upstashToken }) };
  }
  /* 2) 구 KV REST */
  const kvUrl = process.env.KV_REST_API_URL?.trim();
  const kvToken = process.env.KV_REST_API_TOKEN?.trim();
  if (kvUrl && kvToken) {
    return { kind: "rest", r: new UpstashRedis({ url: kvUrl, token: kvToken }) };
  }
  /* 3/4) REDIS_URL */
  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl) {
    if (redisUrl.startsWith("https://")) {
      /* HTTPS 형태인데 따로 토큰이 안 들어있는 경우 → 인증 URL에서 추출 시도 */
      try {
        const u = new URL(redisUrl);
        const token = u.password || u.username;
        if (token) {
          const cleanUrl = `${u.protocol}//${u.host}${u.pathname.replace(/\/$/, "")}`;
          return { kind: "rest", r: new UpstashRedis({ url: cleanUrl, token }) };
        }
      } catch {
        /* fallthrough */
      }
    } else if (redisUrl.startsWith("redis://") || redisUrl.startsWith("rediss://")) {
      /* TCP. Vercel 서버리스에서 lazyConnect=true로 cold start 영향 최소화 */
      return {
        kind: "tcp",
        r: new IORedis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 2,
          connectTimeout: 10_000,
        }),
      };
    }
  }
  return null;
}

export function isRedisConfigured(): boolean {
  return buildClient() !== null;
}

function getClient(): Client {
  if (!_client) {
    _client = buildClient();
    if (!_client) {
      throw new Error(
        "Redis 환경변수가 설정되지 않았거나 형식을 인식하지 못했습니다. " +
        "REDIS_URL(redis://·rediss://) 또는 UPSTASH_REDIS_REST_URL+TOKEN, KV_REST_API_URL+TOKEN 중 하나를 설정해주세요.",
      );
    }
  }
  return _client;
}

/* ---------- 인증 ---------- */

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

/* ---------- 데이터 access ---------- */

export interface DataRecord {
  data: unknown;
  modifiedAt: number;
  revision: number;
}

async function clientGet<T>(key: string): Promise<T | null> {
  const c = getClient();
  if (c.kind === "rest") {
    return (await c.r.get<T>(key)) ?? null;
  }
  const raw = await c.r.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function clientSet(key: string, value: unknown): Promise<void> {
  const c = getClient();
  if (c.kind === "rest") {
    await c.r.set(key, value as never);
    return;
  }
  await c.r.set(key, JSON.stringify(value));
}

export async function pullData(): Promise<DataRecord | null> {
  return clientGet<DataRecord>(DATA_KEY);
}

export async function pushData(payload: unknown): Promise<DataRecord> {
  const prev = await clientGet<{ revision: number }>(META_KEY);
  const revision = (prev?.revision ?? 0) + 1;
  const record: DataRecord = {
    data: payload,
    modifiedAt: Date.now(),
    revision,
  };
  await clientSet(DATA_KEY, record);
  await clientSet(META_KEY, { modifiedAt: record.modifiedAt, revision });
  return record;
}

export async function getMeta(): Promise<{ modifiedAt: number; revision: number } | null> {
  return clientGet<{ modifiedAt: number; revision: number }>(META_KEY);
}
