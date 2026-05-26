export type StudentStatus = "active" | "paused" | "ended";

/** 주간 반복 수업 슬롯. dayOfWeek는 JS Date 규약(0=일요일 ... 6=토요일). */
export interface ScheduleSlot {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  time: string;            /* "HH:MM" 24시간제 */
}

/**
 * 학생의 정기 일정 중 특정 1회만 임시로 옮기거나 취소한 기록.
 * 정기 일정(Student.schedule)은 건드리지 않고 이 테이블만 변경됨.
 *
 * (studentId, originalDate, originalTime) 조합이 고유 식별자.
 *   newDate=null  → 이 수업 취소(휴강)
 *   newDate=날짜  → 새 날짜·시간으로 이동
 */
export interface ScheduleOverride {
  id: string;
  studentId: string;
  originalDate: string;       /* ISO yyyy-mm-dd */
  originalTime: string;       /* "HH:MM" */
  newDate: string | null;
  newTime?: string;           /* "HH:MM" */
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Student {
  id: string;
  name: string;
  school: string;
  grade: string;
  address?: string;
  phone?: string;
  kakaoId?: string;
  profileImage?: string;   /* dataURL 또는 preset:character-1 형태 */
  status: StudentStatus;
  schedule?: ScheduleSlot[]; /* 주간 정기 수업 (요일·시간 다중 슬롯) */
  memo?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MockExamEntry {
  scope: string;
  score: number | null;
}

export interface Session {
  id: string;
  studentId: string;
  sessionDate: string;       /* ISO yyyy-mm-dd */
  vocabulary?: string;
  /** 한 수업에서 여러 범위 모의고사를 기록 가능. */
  mockExams?: MockExamEntry[];
  /** @deprecated 구 버전 단일 필드. 읽기 호환용으로만 유지. 신규 쓰기는 mockExams 사용. */
  mockExamScope?: string;
  /** @deprecated */
  mockExamScore?: number | null;
  pastQuestionType?: string;
  notes?: string;
  nextAssignment?: string;
  /* 이전 수업 과제의 이행률 (0-100). 다음 수업 입력 시 채워짐 */
  previousCompletionRate?: number | null;
  createdAt: number;
  updatedAt: number;
}

/** 신·구 필드를 합쳐 단일 배열로 정규화. */
export function getMockExamEntries(s: Session): MockExamEntry[] {
  if (s.mockExams && s.mockExams.length > 0) return s.mockExams;
  if (
    (s.mockExamScope && s.mockExamScope.trim().length > 0) ||
    (s.mockExamScore !== null && s.mockExamScore !== undefined)
  ) {
    return [
      {
        scope: s.mockExamScope ?? "",
        score: s.mockExamScore ?? null,
      },
    ];
  }
  return [];
}

export type AssignmentType = "vocab" | "mock" | "past" | "etc";

export interface Assignment {
  id: string;
  sessionId: string;
  studentId: string;
  type: AssignmentType;
  description?: string;
  completed: boolean;
  completionRate: number;   /* 0-100 */
  dueDate?: string;          /* ISO yyyy-mm-dd */
  notify: boolean;
  notifyAt?: string;         /* ISO yyyy-mm-ddTHH:mm */
  createdAt: number;
  updatedAt: number;
}

export type ReportPeriod = "4" | "8" | "custom";

export interface Report {
  id: string;
  studentId: string;
  period: ReportPeriod;
  fromDate: string;          /* ISO yyyy-mm-dd */
  toDate: string;            /* ISO yyyy-mm-dd */
  comment: string;
  pdfBlobName?: string;
  createdAt: number;
}

export interface MessageTemplate {
  id: string;
  name: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}

export type NotificationStatus = "scheduled" | "sent" | "canceled" | "failed";
export type NotificationChannel = "push" | "sms" | "kakao";

export interface NotificationRecord {
  id: string;
  studentId?: string;
  assignmentId?: string;
  channel: NotificationChannel;
  body: string;
  scheduledFor: string;      /* ISO datetime */
  status: NotificationStatus;
  sentAt?: number;
  createdAt: number;
}

export interface SettingsRecord {
  key: string;
  value: unknown;
  updatedAt: number;
}
