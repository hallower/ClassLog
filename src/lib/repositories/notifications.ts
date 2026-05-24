import { getDB } from "@/lib/db";
import { uuid } from "@/lib/utils";
import type {
  MessageTemplate,
  NotificationChannel,
  NotificationRecord,
  NotificationStatus,
} from "@/types/models";

/* ---------- 알림 기록 ---------- */

export async function listNotifications(): Promise<NotificationRecord[]> {
  const arr = await getDB().notifications.toArray();
  return arr.sort((a, b) => (a.scheduledFor < b.scheduledFor ? 1 : -1));
}

export async function listNotificationsByStatus(status: NotificationStatus): Promise<NotificationRecord[]> {
  const arr = await getDB().notifications.where("status").equals(status).toArray();
  return arr.sort((a, b) => (a.scheduledFor < b.scheduledFor ? -1 : 1));
}

export async function createNotification(input: {
  studentId?: string;
  assignmentId?: string;
  channel: NotificationChannel;
  body: string;
  scheduledFor: string;
}): Promise<NotificationRecord> {
  const record: NotificationRecord = {
    id: uuid(),
    ...input,
    status: "scheduled",
    createdAt: Date.now(),
  };
  await getDB().notifications.add(record);
  return record;
}

export async function updateNotification(
  id: string,
  patch: Partial<Omit<NotificationRecord, "id" | "createdAt">>,
): Promise<void> {
  await getDB().notifications.update(id, patch);
}

export async function deleteNotification(id: string): Promise<void> {
  await getDB().notifications.delete(id);
}

export async function findDueScheduledNotifications(nowIso: string): Promise<NotificationRecord[]> {
  const arr = await getDB().notifications.where("status").equals("scheduled").toArray();
  return arr.filter((n) => n.scheduledFor <= nowIso);
}

/* ---------- 메시지 템플릿 ---------- */

export async function listTemplates(): Promise<MessageTemplate[]> {
  const arr = await getDB().messageTemplates.toArray();
  return arr.sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export async function ensureDefaultTemplates(): Promise<void> {
  const db = getDB();
  const count = await db.messageTemplates.count();
  if (count > 0) return;
  const now = Date.now();
  await db.messageTemplates.bulkAdd([
    {
      id: uuid(),
      name: "과제 알림",
      body: "안녕하세요 {학부모}님, {학생} 학생의 다음 과제는 다음과 같습니다.\n\n· {과제}\n\n수업 전까지 완료 부탁드립니다 :)",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuid(),
      name: "수업 알림",
      body: "{학생} 학생, 내일 {시간}에 수업 있어요. 과제 확인 후 만나요!",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuid(),
      name: "리포트 전달",
      body: "{학부모}님, {학생} 학생의 학습 리포트를 보내드립니다. 확인 부탁드립니다.",
      createdAt: now,
      updatedAt: now,
    },
  ]);
}

export async function createTemplate(input: { name: string; body: string }): Promise<MessageTemplate> {
  const now = Date.now();
  const t: MessageTemplate = { id: uuid(), ...input, createdAt: now, updatedAt: now };
  await getDB().messageTemplates.add(t);
  return t;
}

export async function updateTemplate(id: string, patch: Partial<Pick<MessageTemplate, "name" | "body">>): Promise<void> {
  await getDB().messageTemplates.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteTemplate(id: string): Promise<void> {
  await getDB().messageTemplates.delete(id);
}
