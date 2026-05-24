import type { ScheduleSlot, Student } from "@/types/models";

export const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;
export const DAY_LABELS_FULL = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
] as const;

export function sortSlots(slots: ScheduleSlot[]): ScheduleSlot[] {
  return [...slots].sort((a, b) =>
    a.dayOfWeek !== b.dayOfWeek
      ? a.dayOfWeek - b.dayOfWeek
      : a.time.localeCompare(b.time),
  );
}

export function formatSchedule(schedule: ScheduleSlot[] | undefined, separator = " · "): string {
  if (!schedule || schedule.length === 0) return "";
  return sortSlots(schedule)
    .map((s) => `${DAY_LABELS[s.dayOfWeek]} ${s.time}`)
    .join(separator);
}

export function slotsOnDay(schedule: ScheduleSlot[] | undefined, dayOfWeek: number): ScheduleSlot[] {
  if (!schedule) return [];
  return sortSlots(schedule.filter((s) => s.dayOfWeek === dayOfWeek));
}

export function studentsScheduledOn(students: Student[], date: Date): Array<{ student: Student; slots: ScheduleSlot[] }> {
  const day = date.getDay();
  const result: Array<{ student: Student; slots: ScheduleSlot[] }> = [];
  for (const s of students) {
    if (s.status !== "active") continue;
    const slots = slotsOnDay(s.schedule, day);
    if (slots.length > 0) result.push({ student: s, slots });
  }
  return result;
}

/** schedule을 따라 `fromDate`(포함) 이후 가장 빠른 다음 수업 일시를 반환. 없으면 null. */
export function nextOccurrence(schedule: ScheduleSlot[] | undefined, fromDate: Date = new Date()): Date | null {
  if (!schedule || schedule.length === 0) return null;
  const sorted = sortSlots(schedule);
  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const candidate = new Date(fromDate);
    candidate.setDate(candidate.getDate() + dayOffset);
    const day = candidate.getDay();
    for (const slot of sorted) {
      if (slot.dayOfWeek !== day) continue;
      const [h, m] = slot.time.split(":").map((n) => parseInt(n, 10));
      const dt = new Date(candidate);
      dt.setHours(h || 0, m || 0, 0, 0);
      if (dt.getTime() >= fromDate.getTime()) return dt;
    }
  }
  return null;
}
