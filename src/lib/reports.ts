import { getMockExamEntries, type Session } from "@/types/models";

export interface ReportStats {
  totalSessions: number;
  completionCount: number;
  completionAvg: number | null;
  completionBuckets: { low: number; mid: number; high: number };
  scoreCount: number;
  scoreMin: number | null;
  scoreMax: number | null;
  scoreAvg: number | null;
  firstScore: number | null;
  lastScore: number | null;
  scoreDelta: number | null;
  vocabularySummary: string[];
  examSummary: string[];
  pastTypeSummary: string[];
}

export function pickSessionsInRange(sessions: Session[], fromDate: string, toDate: string): Session[] {
  return sessions
    .filter((s) => s.sessionDate >= fromDate && s.sessionDate <= toDate)
    .sort((a, b) => (a.sessionDate < b.sessionDate ? -1 : 1));
}

export function pickRecentSessions(sessions: Session[], count: number): Session[] {
  const sorted = [...sessions].sort((a, b) => (a.sessionDate < b.sessionDate ? 1 : -1));
  return sorted.slice(0, count).reverse();
}

export function summarizeSessions(sessions: Session[]): ReportStats {
  const completions = sessions
    .map((s) => s.previousCompletionRate)
    .filter((v): v is number => v !== null && v !== undefined);
  /* 0점은 "미응시/미입력"으로 간주, 통계에서 제외.
     한 수업에서 여러 모의고사 입력 시 각 점수를 개별 데이터 포인트로 취급. */
  const sortedSessions = [...sessions].sort((a, b) =>
    a.sessionDate < b.sessionDate ? -1 : 1,
  );
  const scoreValues: number[] = [];
  const examScopes: string[] = [];
  for (const s of sortedSessions) {
    for (const e of getMockExamEntries(s)) {
      if (e.score !== null && e.score !== undefined && e.score > 0) scoreValues.push(e.score);
      if (e.scope && e.scope.trim()) examScopes.push(e.scope.trim());
    }
  }

  const buckets = { low: 0, mid: 0, high: 0 };
  for (const r of completions) {
    if (r <= 60) buckets.low++;
    else if (r <= 80) buckets.mid++;
    else buckets.high++;
  }

  const completionAvg = completions.length
    ? Math.round((completions.reduce((a, b) => a + b, 0) / completions.length) * 10) / 10
    : null;

  const scoreMin = scoreValues.length ? Math.min(...scoreValues) : null;
  const scoreMax = scoreValues.length ? Math.max(...scoreValues) : null;
  const scoreAvg = scoreValues.length
    ? Math.round((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) * 10) / 10
    : null;
  const firstScore = scoreValues.length ? scoreValues[0] : null;
  const lastScore = scoreValues.length ? scoreValues[scoreValues.length - 1] : null;
  const scoreDelta = firstScore !== null && lastScore !== null ? lastScore - firstScore : null;

  const vocabularySummary = uniqueTrimmed(sessions.map((s) => s.vocabulary));
  const examSummary = uniqueTrimmed(examScopes);
  const pastTypeSummary = uniqueTrimmed(sessions.map((s) => s.pastQuestionType));

  return {
    totalSessions: sessions.length,
    completionCount: completions.length,
    completionAvg,
    completionBuckets: buckets,
    scoreCount: scoreValues.length,
    scoreMin,
    scoreMax,
    scoreAvg,
    firstScore,
    lastScore,
    scoreDelta,
    vocabularySummary,
    examSummary,
    pastTypeSummary,
  };
}

function uniqueTrimmed(arr: (string | undefined | null)[]): string[] {
  const set = new Set<string>();
  for (const v of arr) {
    const t = v?.trim();
    if (t) set.add(t);
  }
  return Array.from(set);
}
