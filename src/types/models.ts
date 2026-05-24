export type StudentStatus = "active" | "paused" | "ended";

/** 주간 반복 수업 슬롯. dayOfWeek는 JS Date 규약(0=일요일 ... 6=토요일). */
export interface ScheduleSlot {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  time: string;            /* "HH:MM" 24시간제 */
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

export interface Session {
  id: string;
  studentId: string;
  sessionDate: string;       /* ISO yyyy-mm-dd */
  vocabulary?: string;
  mockExamScope?: string;
  mockExamScore?: number | null;
  pastQuestionType?: string;
  notes?: string;
  nextAssignment?: string;
  /* 이전 수업 과제의 이행률 (0-100). 다음 수업 입력 시 채워짐 */
  previousCompletionRate?: number | null;
  createdAt: number;
  updatedAt: number;
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
