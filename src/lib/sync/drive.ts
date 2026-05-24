"use client";

import { getDB } from "@/lib/db";
import { exportBackup, importBackup, type BackupBundle } from "@/lib/sync/backup";

/**
 * Google Drive 동기화.
 *
 * 인증 방식: Google Identity Services (GIS) — implicit access token
 * 스코프: https://www.googleapis.com/auth/drive.file
 *   → 우리 앱이 직접 만든 파일에만 접근 가능 (사용자의 다른 Drive 파일은 못 봄)
 *
 * 파일 위치: 사용자의 Drive 루트에 `classlog-db.json` 단일 파일.
 *
 * Client ID는 설정 페이지에서 사용자가 입력 → 로컬 settings 테이블에 저장.
 */

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
            error_callback?: (err: { type?: string }) => void;
          }): { requestAccessToken(opts?: { prompt?: string }): void };
        };
      };
    };
  }
}

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const FILE_NAME = "classlog-db.json";

const SETTING_KEYS = {
  clientId: "drive.clientId",
  lastSyncedAt: "drive.lastSyncedAt",
  remoteFileId: "drive.remoteFileId",
} as const;

/** 배포 시 미리 설정된 OAuth Client ID — 있으면 사용자는 입력 없이 "구글로 로그인"만 누름 */
const ENV_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || null;

export function isClientIdFromEnv(): boolean {
  return !!ENV_CLIENT_ID;
}

let gisLoaded = false;
async function loadGis(): Promise<void> {
  if (gisLoaded) return;
  if (typeof window === "undefined") throw new Error("no window");
  if (window.google?.accounts?.oauth2) {
    gisLoaded = true;
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("GIS load failed")));
      if (window.google?.accounts?.oauth2) resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = GIS_SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("GIS load failed"));
    document.head.appendChild(s);
  });
  gisLoaded = true;
}

export async function getDriveClientId(): Promise<string | null> {
  if (ENV_CLIENT_ID) return ENV_CLIENT_ID;
  const row = await getDB().settings.get(SETTING_KEYS.clientId);
  return (row?.value as string | undefined) ?? null;
}

export function isSignedInToDrive(): boolean {
  return !!cachedToken && cachedToken.expiresAt > Date.now() + 60_000;
}

export async function setDriveClientId(value: string | null): Promise<void> {
  const db = getDB();
  if (!value) {
    await db.settings.delete(SETTING_KEYS.clientId);
    return;
  }
  await db.settings.put({ key: SETTING_KEYS.clientId, value, updatedAt: Date.now() });
}

export async function getLastSyncedAt(): Promise<number | null> {
  const row = await getDB().settings.get(SETTING_KEYS.lastSyncedAt);
  return (row?.value as number | undefined) ?? null;
}

async function setLastSyncedAt(ts: number) {
  await getDB().settings.put({ key: SETTING_KEYS.lastSyncedAt, value: ts, updatedAt: Date.now() });
}

async function getStoredFileId(): Promise<string | null> {
  const row = await getDB().settings.get(SETTING_KEYS.remoteFileId);
  return (row?.value as string | undefined) ?? null;
}

async function setStoredFileId(id: string | null) {
  const db = getDB();
  if (!id) {
    await db.settings.delete(SETTING_KEYS.remoteFileId);
    return;
  }
  await db.settings.put({ key: SETTING_KEYS.remoteFileId, value: id, updatedAt: Date.now() });
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function acquireAccessToken(opts?: { prompt?: "consent" | "none" | "" }): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;

  const clientId = await getDriveClientId();
  if (!clientId) throw new Error("Google OAuth Client ID가 설정되지 않았습니다.");

  await loadGis();
  if (!window.google?.accounts?.oauth2) throw new Error("GIS 미초기화");

  return new Promise<string>((resolve, reject) => {
    const tokenClient = window.google!.accounts!.oauth2!.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error || "토큰 발급 실패"));
          return;
        }
        cachedToken = { token: resp.access_token, expiresAt: Date.now() + 55 * 60 * 1000 };
        resolve(resp.access_token);
      },
      error_callback: (err) => {
        reject(new Error(`OAuth 오류: ${err.type ?? "unknown"}`));
      },
    });
    tokenClient.requestAccessToken({ prompt: opts?.prompt ?? "" });
  });
}

export function signOutDrive() {
  cachedToken = null;
}

export async function signInToDrive(): Promise<void> {
  await acquireAccessToken({ prompt: "consent" });
}

async function findFileId(token: string): Promise<{ id: string; modifiedTime: string } | null> {
  const q = encodeURIComponent(`name = '${FILE_NAME}' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,modifiedTime)&pageSize=1`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Drive 검색 실패 (${res.status})`);
  const json = (await res.json()) as { files: Array<{ id: string; modifiedTime: string }> };
  return json.files?.[0] ?? null;
}

async function getFileMeta(token: string, id: string): Promise<{ id: string; modifiedTime: string }> {
  const url = `https://www.googleapis.com/drive/v3/files/${id}?fields=id,modifiedTime`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Drive 메타 조회 실패 (${res.status})`);
  return (await res.json()) as { id: string; modifiedTime: string };
}

async function downloadFile(token: string, id: string): Promise<BackupBundle> {
  const url = `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Drive 다운로드 실패 (${res.status})`);
  return (await res.json()) as BackupBundle;
}

async function uploadFile(token: string, bundle: BackupBundle, existingId: string | null): Promise<string> {
  const body = JSON.stringify(bundle);
  const boundary = `cl-${Date.now()}`;
  const meta = existingId
    ? { mimeType: "application/json" }
    : { name: FILE_NAME, mimeType: "application/json" };
  const multipart =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(meta)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${body}\r\n` +
    `--${boundary}--`;
  const url = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart&fields=id,modifiedTime`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime`;
  const res = await fetch(url, {
    method: existingId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: multipart,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive 업로드 실패 (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { id: string };
  return json.id;
}

export interface SyncResult {
  action: "pushed" | "pulled" | "noop";
  remoteModifiedTime?: string;
  message: string;
}

export async function syncWithDrive(opts?: { force?: "push" | "pull" }): Promise<SyncResult> {
  const token = await acquireAccessToken();
  let fileId = await getStoredFileId();
  let remote: { id: string; modifiedTime: string } | null = null;
  if (fileId) {
    try {
      remote = await getFileMeta(token, fileId);
    } catch {
      remote = null;
      fileId = null;
    }
  }
  if (!remote) {
    remote = await findFileId(token);
    if (remote) {
      fileId = remote.id;
      await setStoredFileId(fileId);
    }
  }

  const lastSyncedAt = (await getLastSyncedAt()) ?? 0;
  const remoteMs = remote ? new Date(remote.modifiedTime).getTime() : 0;

  if (opts?.force === "pull") {
    if (!remote) throw new Error("Drive에 저장된 백업이 없습니다.");
    const bundle = await downloadFile(token, remote.id);
    await importBackup(bundle, "replace");
    await setLastSyncedAt(remoteMs || Date.now());
    return { action: "pulled", remoteModifiedTime: remote.modifiedTime, message: "Drive에서 데이터를 가져왔습니다." };
  }

  if (opts?.force === "push") {
    const bundle = await exportBackup();
    const newId = await uploadFile(token, bundle, fileId);
    if (!fileId || newId !== fileId) await setStoredFileId(newId);
    const meta = await getFileMeta(token, newId);
    await setLastSyncedAt(new Date(meta.modifiedTime).getTime());
    return { action: "pushed", remoteModifiedTime: meta.modifiedTime, message: "Drive에 업로드했습니다." };
  }

  /* 자동 결정 */
  if (!remote) {
    const bundle = await exportBackup();
    const newId = await uploadFile(token, bundle, null);
    await setStoredFileId(newId);
    const meta = await getFileMeta(token, newId);
    await setLastSyncedAt(new Date(meta.modifiedTime).getTime());
    return { action: "pushed", remoteModifiedTime: meta.modifiedTime, message: "첫 백업 생성 완료." };
  }

  if (remoteMs > lastSyncedAt + 1000) {
    const bundle = await downloadFile(token, remote.id);
    await importBackup(bundle, "replace");
    await setLastSyncedAt(remoteMs);
    return {
      action: "pulled",
      remoteModifiedTime: remote.modifiedTime,
      message: "다른 기기에서 변경된 내용을 가져왔습니다.",
    };
  }

  const bundle = await exportBackup();
  const newId = await uploadFile(token, bundle, fileId);
  const meta = await getFileMeta(token, newId);
  await setLastSyncedAt(new Date(meta.modifiedTime).getTime());
  return { action: "pushed", remoteModifiedTime: meta.modifiedTime, message: "Drive에 동기화 완료." };
}
