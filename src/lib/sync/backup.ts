"use client";

import { getDB } from "@/lib/db";

export interface BackupBundle {
  app: "ClassLog";
  version: 1;
  exportedAt: string;
  data: {
    students: unknown[];
    sessions: unknown[];
    assignments: unknown[];
    reports: unknown[];
    messageTemplates: unknown[];
    notifications: unknown[];
    settings: unknown[];
  };
}

export async function exportBackup(): Promise<BackupBundle> {
  const db = getDB();
  const [students, sessions, assignments, reports, messageTemplates, notifications, settings] =
    await Promise.all([
      db.students.toArray(),
      db.sessions.toArray(),
      db.assignments.toArray(),
      db.reports.toArray(),
      db.messageTemplates.toArray(),
      db.notifications.toArray(),
      db.settings.toArray(),
    ]);
  return {
    app: "ClassLog",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { students, sessions, assignments, reports, messageTemplates, notifications, settings },
  };
}

export async function downloadBackupAsFile() {
  const bundle = await exportBackup();
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  a.download = `classlog-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importBackup(bundle: BackupBundle, mode: "replace" | "merge"): Promise<{
  imported: Record<string, number>;
}> {
  if (bundle.app !== "ClassLog") throw new Error("ClassLog 백업 파일이 아닙니다.");
  const db = getDB();
  const imported: Record<string, number> = {};

  await db.transaction(
    "rw",
    [
      db.students,
      db.sessions,
      db.assignments,
      db.reports,
      db.messageTemplates,
      db.notifications,
      db.settings,
    ],
    async () => {
      if (mode === "replace") {
        await db.students.clear();
        await db.sessions.clear();
        await db.assignments.clear();
        await db.reports.clear();
        await db.messageTemplates.clear();
        await db.notifications.clear();
        await db.settings.clear();
      }
      const tables: Array<[keyof BackupBundle["data"], () => Promise<unknown>]> = [
        ["students", () => db.students.bulkPut(bundle.data.students as never[])],
        ["sessions", () => db.sessions.bulkPut(bundle.data.sessions as never[])],
        ["assignments", () => db.assignments.bulkPut(bundle.data.assignments as never[])],
        ["reports", () => db.reports.bulkPut(bundle.data.reports as never[])],
        ["messageTemplates", () => db.messageTemplates.bulkPut(bundle.data.messageTemplates as never[])],
        ["notifications", () => db.notifications.bulkPut(bundle.data.notifications as never[])],
        ["settings", () => db.settings.bulkPut(bundle.data.settings as never[])],
      ];
      for (const [name, fn] of tables) {
        const count = bundle.data[name]?.length ?? 0;
        imported[name] = count;
        if (count > 0) await fn();
      }
    },
  );

  return { imported };
}

export async function importBackupFromFile(file: File, mode: "replace" | "merge") {
  const text = await file.text();
  const bundle = JSON.parse(text) as BackupBundle;
  return importBackup(bundle, mode);
}
