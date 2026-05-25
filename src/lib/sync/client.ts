"use client";

import { exportBackup, importBackup, type BackupBundle } from "@/lib/sync/backup";
import { getDB } from "@/lib/db";

const META_LAST_SYNCED = "sync.lastSyncedAt";
const META_LAST_PUSHED_REV = "sync.lastPushedRevision";
const META_LAST_PULLED_REV = "sync.lastPulledRevision";

export interface AuthCheckResult {
  authRequired: boolean;
  authed: boolean;
  syncEnabled: boolean;
}

export async function checkAuth(): Promise<AuthCheckResult> {
  const res = await fetch("/api/auth/check", { cache: "no-store" });
  if (!res.ok) throw new Error("auth check 실패");
  return (await res.json()) as AuthCheckResult;
}

export async function login(password: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  return { ok: !!json.ok, error: json.error };
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

interface PullResponse {
  ok: boolean;
  record?: { data: BackupBundle; modifiedAt: number; revision: number } | null;
}

interface PushResponse {
  ok: boolean;
  modifiedAt?: number;
  revision?: number;
  error?: string;
}

export async function pullFromServer(): Promise<{
  applied: boolean;
  revision?: number;
  modifiedAt?: number;
}> {
  const res = await fetch("/api/sync/pull", { cache: "no-store" });
  if (res.status === 401) throw new Error("unauthorized");
  if (res.status === 503) throw new Error("sync_disabled");
  if (!res.ok) throw new Error(`pull 실패 (${res.status})`);
  const json = (await res.json()) as PullResponse;
  if (!json.record) {
    /* 서버에 데이터 없음 — 첫 동기화. 그냥 표시만 */
    await setMeta(META_LAST_PULLED_REV, 0);
    return { applied: false };
  }
  const { record } = json;
  const lastPulled = (await getMeta<number>(META_LAST_PULLED_REV)) ?? -1;
  if (record.revision === lastPulled) {
    /* 이미 같은 리비전 가지고 있음 */
    return { applied: false, revision: record.revision, modifiedAt: record.modifiedAt };
  }
  await importBackup(record.data, "replace");
  await setMeta(META_LAST_PULLED_REV, record.revision);
  await setMeta(META_LAST_PUSHED_REV, record.revision);
  await setMeta(META_LAST_SYNCED, Date.now());
  return { applied: true, revision: record.revision, modifiedAt: record.modifiedAt };
}

export async function pushToServer(): Promise<{
  ok: boolean;
  revision?: number;
  modifiedAt?: number;
}> {
  const bundle = await exportBackup();
  const body = JSON.stringify(bundle);
  /**
   * fetch keepalive는 본문 64 KiB 제한이 있어서 학생/수업 데이터 양이 조금만 늘어도
   * 즉시 "Failed to fetch"로 실패한다. 작은 payload에만 keepalive를 켜고,
   * 일반적인 경우엔 일반 fetch로 보낸다.
   */
  const useKeepalive = body.length < 60_000;
  const res = await fetch("/api/sync/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: useKeepalive,
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (res.status === 503) throw new Error("sync_disabled");
  if (!res.ok) throw new Error(`push 실패 (${res.status})`);
  const json = (await res.json()) as PushResponse;
  if (!json.ok) throw new Error(json.error || "push 실패");
  await setMeta(META_LAST_PUSHED_REV, json.revision ?? 0);
  await setMeta(META_LAST_PULLED_REV, json.revision ?? 0);
  await setMeta(META_LAST_SYNCED, Date.now());
  return { ok: true, revision: json.revision, modifiedAt: json.modifiedAt };
}

/* ---------- 메타 헬퍼 ---------- */

async function setMeta(key: string, value: unknown): Promise<void> {
  const db = getDB();
  await db.settings.put({ key, value, updatedAt: Date.now() });
}

async function getMeta<T>(key: string): Promise<T | null> {
  const db = getDB();
  const row = await db.settings.get(key);
  return (row?.value as T | undefined) ?? null;
}

export async function getLastSyncedAt(): Promise<number | null> {
  return getMeta<number>(META_LAST_SYNCED);
}
