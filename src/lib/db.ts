import Dexie, { type Table } from "dexie";
import type {
  Student,
  Session,
  Assignment,
  Report,
  MessageTemplate,
  NotificationRecord,
  ScheduleOverride,
  SettingsRecord,
} from "@/types/models";

export class ClassLogDB extends Dexie {
  students!: Table<Student, string>;
  sessions!: Table<Session, string>;
  assignments!: Table<Assignment, string>;
  reports!: Table<Report, string>;
  messageTemplates!: Table<MessageTemplate, string>;
  notifications!: Table<NotificationRecord, string>;
  scheduleOverrides!: Table<ScheduleOverride, string>;
  settings!: Table<SettingsRecord, string>;

  constructor() {
    /* 환경별로 DB 분리: 테스트(dev) 데이터가 운영(prod)에 섞이지 않도록 */
    const dbName = process.env.NODE_ENV === "production" ? "classlog-prod" : "classlog-dev";
    super(dbName);
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
    /* v3: 1회성 일정 변경 테이블 */
    this.version(3).stores({
      scheduleOverrides:
        "id, studentId, originalDate, newDate, [studentId+originalDate+originalTime]",
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
