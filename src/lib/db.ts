import Dexie, { type Table } from "dexie";
import type {
  Student,
  Session,
  Assignment,
  Report,
  MessageTemplate,
  NotificationRecord,
  SettingsRecord,
} from "@/types/models";

export class ClassLogDB extends Dexie {
  students!: Table<Student, string>;
  sessions!: Table<Session, string>;
  assignments!: Table<Assignment, string>;
  reports!: Table<Report, string>;
  messageTemplates!: Table<MessageTemplate, string>;
  notifications!: Table<NotificationRecord, string>;
  settings!: Table<SettingsRecord, string>;

  constructor() {
    super("classlog");
    /* v1: 초기 스키마. nextSessionDate 인덱스 보유 */
    this.version(1).stores({
      students: "id, name, status, createdAt, updatedAt, nextSessionDate",
      sessions: "id, studentId, sessionDate, createdAt, [studentId+sessionDate]",
      assignments:
        "id, sessionId, studentId, type, dueDate, completed, completionRate, notify, notifyAt",
      reports: "id, studentId, createdAt, fromDate, toDate",
      messageTemplates: "id, name, updatedAt",
      notifications:
        "id, studentId, assignmentId, channel, status, scheduledFor, createdAt",
      settings: "key, updatedAt",
    });
    /* v2: schedule 도입 + nextSessionDate 인덱스 제거 */
    this.version(2).stores({
      students: "id, name, status, createdAt, updatedAt",
    });
  }
}

let _db: ClassLogDB | null = null;

export function getDB(): ClassLogDB {
  if (typeof window === "undefined") {
    /* SSR 호출 방지용 가드 — 페이지/컴포넌트는 client에서만 사용해야 함 */
    throw new Error("getDB() must be called in browser context");
  }
  if (!_db) _db = new ClassLogDB();
  return _db;
}
