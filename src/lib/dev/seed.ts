"use client";

/**
 * 개발용 테스트 데이터 시드.
 * - dev 모드(NODE_ENV !== "production")에서만 사용.
 * - settings 테이블의 `dev.seeded=true` 플래그로 중복 실행 방지.
 * - 운영 배포에는 영향 없음. 정리하려면 설정 → 전체 데이터 삭제.
 */

import { getDB } from "@/lib/db";
import { uuid } from "@/lib/utils";
import type {
  Student,
  Session,
  ScheduleSlot,
  Report,
  NotificationRecord,
} from "@/types/models";

const SEED_FLAG_KEY = "dev.seeded";

interface SeedStudent {
  name: string;
  school: string;
  grade: string;
  address: string;
  phone: string;
  profileImage: string;
  schedule: ScheduleSlot[];
  scoreFloor: number;          /* 모의고사 시작 점수대 */
  scoreCeiling: number;        /* 모의고사 도착 점수대 */
  completionBias: "high" | "mid" | "mixed"; /* 이행률 성향 */
  notes: string;
}

const STUDENT_CONFIGS: SeedStudent[] = [
  {
    name: "김민준",
    school: "대치고등학교",
    grade: "고2",
    address: "서울 강남구 대치동 943",
    phone: "010-2345-6789",
    profileImage: "preset:lion",
    schedule: [
      { dayOfWeek: 1, time: "16:00" },
      { dayOfWeek: 4, time: "16:00" },
    ],
    scoreFloor: 68,
    scoreCeiling: 88,
    completionBias: "high",
    notes: "어휘 암기 성실. 빈칸 추론 약함 → 4월부터 집중 보강.",
  },
  {
    name: "이서연",
    school: "분당여자고등학교",
    grade: "고3",
    address: "성남시 분당구 정자동 178",
    phone: "010-9876-5432",
    profileImage: "preset:rabbit",
    schedule: [
      { dayOfWeek: 2, time: "19:00" },
      { dayOfWeek: 5, time: "19:00" },
    ],
    scoreFloor: 75,
    scoreCeiling: 92,
    completionBias: "mid",
    notes: "최상위권. 시간 압박 훈련 필요. 학기 중 시험 직후엔 컨디션 저조.",
  },
  {
    name: "박지호",
    school: "휘문중학교",
    grade: "중3",
    address: "서울 강남구 도곡동 467",
    phone: "010-5555-1234",
    profileImage: "preset:fox",
    schedule: [
      { dayOfWeek: 3, time: "14:00" },
      { dayOfWeek: 6, time: "14:00" },
    ],
    scoreFloor: 55,
    scoreCeiling: 78,
    completionBias: "mixed",
    notes: "기초 어휘 부족. 단어 시험 반복 / 게임형 학습으로 동기부여 시도 중.",
  },
];

const PAST_QUESTION_TYPES = ["빈칸 추론", "어법", "주제·요지", "함축적 의미", "글의 순서", "어휘"];
const NOTE_POOL = [
  "수업 집중도 좋음.",
  "졸음 호소 — 학교 시험 직후라 컨디션 저하.",
  "문제풀이 속도 개선 필요.",
  "암기 자체는 안정적, 응용 약함.",
  "추가 자료 카톡으로 전송 완료.",
  "본인이 어려워한 부분 다음 시간에 복습 예정.",
];

function mockExamScopeFor(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y} ${m}월 모의고사`;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}

function pickCompletion(bias: SeedStudent["completionBias"], progress: number): number | null {
  /* progress: 0 ~ 1 (시간 흐름) */
  if (bias === "high") {
    return Math.min(100, Math.round(75 + progress * 15 + rand(-8, 8)));
  }
  if (bias === "mid") {
    return Math.round(60 + progress * 15 + rand(-12, 12));
  }
  /* mixed: 큰 변동 */
  const base = 55 + progress * 20;
  return Math.max(20, Math.min(100, Math.round(base + rand(-25, 25))));
}

function pickScore(cfg: SeedStudent, progress: number): number {
  const base = cfg.scoreFloor + (cfg.scoreCeiling - cfg.scoreFloor) * progress;
  return Math.max(20, Math.min(100, Math.round(base + rand(-5, 5))));
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function generateSessionsFor(student: Student, cfg: SeedStudent, weeksBack: number): Session[] {
  const sessions: Session[] = [];
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - weeksBack * 7);
  start.setHours(0, 0, 0, 0);

  let dayIdx = 1;
  let totalEstimate = 0;
  for (const slot of cfg.schedule) totalEstimate += weeksBack; /* 슬롯당 주 1회 */

  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    const slot = cfg.schedule.find((s) => s.dayOfWeek === dow);
    if (!slot) continue;

    const progress = dayIdx / Math.max(1, totalEstimate);
    const isMockSession = dayIdx % 4 === 0;
    const includePastType = dayIdx % 3 !== 0;
    const includeNote = Math.random() < 0.35;
    const includeAssignment = dayIdx > 1 || true;

    const [h, m] = slot.time.split(":").map((n) => parseInt(n, 10));
    const tsBase = new Date(d);
    tsBase.setHours(h, m, 0, 0);

    sessions.push({
      id: uuid(),
      studentId: student.id,
      sessionDate: toISODate(d),
      vocabulary: `Day ${dayIdx} (${(dayIdx - 1) * 50 + 1}–${dayIdx * 50})`,
      mockExamScope: isMockSession ? mockExamScopeFor(d) : undefined,
      mockExamScore: isMockSession ? pickScore(cfg, progress) : null,
      pastQuestionType: includePastType ? PAST_QUESTION_TYPES[dayIdx % PAST_QUESTION_TYPES.length] : undefined,
      notes: includeNote ? NOTE_POOL[dayIdx % NOTE_POOL.length] : undefined,
      nextAssignment: includeAssignment
        ? `Day ${dayIdx + 1} 어휘 암기 + ${PAST_QUESTION_TYPES[(dayIdx + 1) % PAST_QUESTION_TYPES.length]} 5문항`
        : undefined,
      previousCompletionRate: dayIdx === 1 ? null : pickCompletion(cfg.completionBias, progress),
      createdAt: tsBase.getTime(),
      updatedAt: tsBase.getTime(),
    });
    dayIdx++;
  }
  return sessions;
}

function buildReports(students: Student[], allSessions: Map<string, Session[]>): Report[] {
  const reports: Report[] = [];
  /* 학생 1, 2 각각 한 건씩 — 최근 8회 기준 */
  for (let i = 0; i < Math.min(2, students.length); i++) {
    const s = students[i];
    const ss = allSessions.get(s.id) ?? [];
    if (ss.length < 4) continue;
    const sorted = [...ss].sort((a, b) => (a.sessionDate < b.sessionDate ? 1 : -1));
    const recent = sorted.slice(0, 8).reverse();
    if (recent.length === 0) continue;
    reports.push({
      id: uuid(),
      studentId: s.id,
      period: "8",
      fromDate: recent[0].sessionDate,
      toDate: recent[recent.length - 1].sessionDate,
      comment:
        i === 0
          ? "지난 8회 동안 빈칸 추론 정답률이 60%대에서 80%대로 안정화되었습니다. 어휘 암기는 꾸준히 잘 따라와 주고 있어요. 다음 기간엔 어법·시간 안배 훈련에 집중하겠습니다."
          : "최상위권 점수를 유지 중이고, 응시 컨디션이 좋을 때와 그렇지 않을 때의 편차가 줄어들고 있습니다. 남은 기간 실전 모의고사 위주로 전환하겠습니다.",
      createdAt: Date.now() - randInt(1, 14) * 24 * 60 * 60 * 1000,
    });
  }
  return reports;
}

function buildNotifications(students: Student[]): NotificationRecord[] {
  const list: NotificationRecord[] = [];
  if (students.length === 0) return list;
  const now = new Date();

  /* 오늘 저녁 — 첫 번째 학생 과제 알림 */
  const scheduled = new Date(now);
  scheduled.setHours(20, 0, 0, 0);
  list.push({
    id: uuid(),
    studentId: students[0].id,
    channel: "push",
    body: `${students[0].name} 학생, 내일 수업 전 어휘 Day ${randInt(20, 32)} + 기출 빈칸 5문항 부탁드려요!`,
    scheduledFor: scheduled.toISOString(),
    status: "scheduled",
    createdAt: now.getTime(),
  });

  /* 발송 이력 1건 — 학생 2 */
  if (students.length >= 2) {
    const sent = new Date(now);
    sent.setDate(sent.getDate() - 2);
    sent.setHours(21, 30, 0, 0);
    list.push({
      id: uuid(),
      studentId: students[1].id,
      channel: "sms",
      body: `${students[1].name} 학부모님, 이번 주 리포트 보내드립니다. 확인 부탁드립니다.`,
      scheduledFor: sent.toISOString(),
      status: "sent",
      sentAt: sent.getTime(),
      createdAt: sent.getTime() - 60_000,
    });
  }

  return list;
}

export async function isSeeded(): Promise<boolean> {
  const row = await getDB().settings.get(SEED_FLAG_KEY);
  return row?.value === true;
}

export async function seedTestData(): Promise<{
  students: number;
  sessions: number;
  reports: number;
  notifications: number;
}> {
  const db = getDB();
  const now = Date.now();

  /* 학생 생성 */
  const students: Student[] = STUDENT_CONFIGS.map((cfg) => ({
    id: uuid(),
    name: cfg.name,
    school: cfg.school,
    grade: cfg.grade,
    address: cfg.address,
    phone: cfg.phone,
    profileImage: cfg.profileImage,
    status: "active",
    schedule: cfg.schedule,
    memo: cfg.notes,
    createdAt: now - 16 * 7 * 24 * 60 * 60 * 1000,
    updatedAt: now,
  }));

  /* 수업 기록 (학생별 16주) */
  const sessionsByStudent = new Map<string, Session[]>();
  const allSessions: Session[] = [];
  students.forEach((s, idx) => {
    const arr = generateSessionsFor(s, STUDENT_CONFIGS[idx], 16);
    sessionsByStudent.set(s.id, arr);
    allSessions.push(...arr);
  });

  const reports = buildReports(students, sessionsByStudent);
  const notifications = buildNotifications(students);

  await db.transaction(
    "rw",
    [db.students, db.sessions, db.reports, db.notifications, db.settings],
    async () => {
      await db.students.bulkAdd(students);
      await db.sessions.bulkAdd(allSessions);
      if (reports.length) await db.reports.bulkAdd(reports);
      if (notifications.length) await db.notifications.bulkAdd(notifications);
      await db.settings.put({ key: SEED_FLAG_KEY, value: true, updatedAt: now });
    },
  );

  return {
    students: students.length,
    sessions: allSessions.length,
    reports: reports.length,
    notifications: notifications.length,
  };
}

export async function seedIfEmpty(): Promise<boolean> {
  const db = getDB();
  if (await isSeeded()) return false;
  const studentCount = await db.students.count();
  if (studentCount > 0) {
    /* 이미 사용자 데이터가 있으면 시드하지 않고 플래그만 세워서 차후 자동 실행 막음 */
    await db.settings.put({ key: SEED_FLAG_KEY, value: true, updatedAt: Date.now() });
    return false;
  }
  await seedTestData();
  return true;
}
