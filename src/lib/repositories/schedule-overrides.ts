import { getDB } from "@/lib/db";
import { uuid } from "@/lib/utils";
import { markDirty } from "@/lib/sync/dirty";
import type { ScheduleOverride } from "@/types/models";

export async function listOverrides(): Promise<ScheduleOverride[]> {
  return getDB().scheduleOverrides.toArray();
}

export async function listOverridesInRange(from: string, to: string): Promise<ScheduleOverride[]> {
  /* 데이터가 적어 전체 로드 후 메모리 필터링이 더 단순·안전 */
  const all = await getDB().scheduleOverrides.toArray();
  return all.filter((o) => {
    if (o.originalDate >= from && o.originalDate <= to) return true;
    if (o.newDate && o.newDate >= from && o.newDate <= to) return true;
    return false;
  });
}

export async function findOverride(
  studentId: string,
  originalDate: string,
  originalTime: string,
): Promise<ScheduleOverride | undefined> {
  return getDB()
    .scheduleOverrides
    .where("[studentId+originalDate+originalTime]")
    .equals([studentId, originalDate, originalTime])
    .first();
}

interface UpsertInput {
  id?: string;
  studentId: string;
  originalDate: string;
  originalTime: string;
  newDate: string | null;
  newTime?: string;
  note?: string;
}

export async function upsertOverride(input: UpsertInput): Promise<ScheduleOverride> {
  const db = getDB();
  const now = Date.now();
  const existing = input.id
    ? await db.scheduleOverrides.get(input.id)
    : await findOverride(input.studentId, input.originalDate, input.originalTime);

  const record: ScheduleOverride = {
    id: existing?.id ?? uuid(),
    studentId: input.studentId,
    originalDate: input.originalDate,
    originalTime: input.originalTime,
    newDate: input.newDate,
    newTime: input.newTime,
    note: input.note?.trim() || undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await db.scheduleOverrides.put(record);
  markDirty();
  return record;
}

export async function deleteOverride(id: string): Promise<void> {
  await getDB().scheduleOverrides.delete(id);
  markDirty();
}

export async function deleteOverrideByKey(
  studentId: string,
  originalDate: string,
  originalTime: string,
): Promise<void> {
  const existing = await findOverride(studentId, originalDate, originalTime);
  if (existing) {
    await getDB().scheduleOverrides.delete(existing.id);
    markDirty();
  }
}
