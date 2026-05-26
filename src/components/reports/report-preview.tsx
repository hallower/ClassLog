"use client";

import { forwardRef } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  LabelList,
} from "recharts";
import { formatDate, completionBucket } from "@/lib/utils";
import { getMockExamEntries, type Student, type Session } from "@/types/models";
import type { ReportStats } from "@/lib/reports";

interface Props {
  student: Student;
  sessions: Session[];
  stats: ReportStats;
  fromDate: string;
  toDate: string;
  comment: string;
}

/* 산뜻한 톤의 이행률 팔레트 */
const FRESH = {
  low: { bg: "#fde2e7", fg: "#9f1239", bar: "#fda4af" },        /* 산뜻한 페일 핑크 */
  mid: { bg: "#e0f2fe", fg: "#075985", bar: "#7dd3fc" },        /* 산뜻한 페일 블루 */
  high: { bg: "#fef9c3", fg: "#854d0e", bar: "#fde047" },       /* 산뜻한 라이트 옐로우 */
  neutral: { bg: "#f4f4f5", fg: "#3f3f46", bar: "#a1a1aa" },
};

function shortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export const ReportPreview = forwardRef<HTMLDivElement, Props>(function ReportPreview(
  { student, sessions, stats, fromDate, toDate, comment },
  ref,
) {
  const scoreData = sessions
    .flatMap((s) =>
      getMockExamEntries(s)
        .filter((e) => e.score !== null && e.score !== undefined && e.score > 0)
        .map((e) => ({
          date: s.sessionDate,
          label: formatDate(s.sessionDate),
          shortLabel: shortDate(s.sessionDate),
          scope: e.scope,
          score: e.score!,
        })),
    )
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const completionData = sessions
    .filter((s) => s.previousCompletionRate !== null && s.previousCompletionRate !== undefined)
    .sort((a, b) => (a.sessionDate < b.sessionDate ? -1 : 1))
    .map((s) => ({
      label: shortDate(s.sessionDate),
      rate: s.previousCompletionRate!,
    }));

  const sessionDateList = sessions
    .map((s) => s.sessionDate)
    .sort()
    .map(shortDate)
    .join(", ");

  const totalAssessed = stats.completionCount || 1;
  const lowPct = Math.round((stats.completionBuckets.low / totalAssessed) * 100);
  const midPct = Math.round((stats.completionBuckets.mid / totalAssessed) * 100);
  const highPct = Math.round((stats.completionBuckets.high / totalAssessed) * 100);

  /* 점수 차트 Y축 범위 자동 계산 */
  const scoreValues = scoreData.map((d) => d.score);
  const scoreYMin =
    scoreValues.length > 0
      ? Math.max(0, Math.floor((Math.min(...scoreValues) - 10) / 10) * 10)
      : 0;
  const scoreYMax =
    scoreValues.length > 0
      ? Math.min(100, Math.ceil((Math.max(...scoreValues) + 10) / 10) * 10)
      : 100;

  return (
    <div
      ref={ref}
      className="bg-white text-zinc-900"
      style={{ width: 794, padding: 48, fontFamily: "var(--font-pretendard)" }}
    >
      <header className="border-b pb-4 mb-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">학습 리포트</h1>
            <p className="text-sm text-zinc-500 mt-1">ClassLog · 클래스로그</p>
          </div>
          <div className="text-right text-xs text-zinc-500">
            <div>{formatDate(fromDate)} – {formatDate(toDate)}</div>
            <div className="mt-0.5">생성일 {formatDate(new Date())}</div>
          </div>
        </div>
      </header>

      <section className="mb-6">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <Row label="학생" value={student.name} />
          <Row label="학교 · 학년" value={`${student.school} · ${student.grade}`} />
          <Row label="기록된 수업" value={`${stats.totalSessions}회`} />
          <Row label="이행률 평가" value={`${stats.completionCount}회`} />
        </div>
        {sessionDateList && (
          <div className="mt-3 text-xs text-zinc-700 leading-relaxed">
            <span className="text-zinc-500 mr-1">수업 일자:</span>
            {sessionDateList}
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">과제 수행 통계</h2>
        <div className="grid grid-cols-4 gap-3 text-center">
          <StatBox
            label="평균 이행률"
            value={stats.completionAvg !== null ? `${stats.completionAvg}%` : "—"}
          />
          <StatBox label=">80%" value={`${stats.completionBuckets.high}회 (${highPct || 0}%)`} accent="high" />
          <StatBox label="61–80%" value={`${stats.completionBuckets.mid}회 (${midPct || 0}%)`} accent="mid" />
          <StatBox label="≤60%" value={`${stats.completionBuckets.low}회 (${lowPct || 0}%)`} accent="low" />
        </div>
        {completionData.length > 0 ? (
          <div className="h-44 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionData} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#737373" />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 10 }}
                  stroke="#737373"
                />
                <Tooltip />
                <ReferenceLine y={60} stroke={FRESH.low.bar} strokeDasharray="4 4" />
                <ReferenceLine y={80} stroke={FRESH.high.bar} strokeDasharray="4 4" />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="rate" position="top" style={{ fontSize: 10, fill: "#52525b" }} formatter={(v: number) => `${v}%`} />
                  {completionData.map((d, i) => {
                    const b = completionBucket(d.rate);
                    const color = b === "low" ? FRESH.low.bar : b === "mid" ? FRESH.mid.bar : FRESH.high.bar;
                    return <Cell key={i} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 mt-3 text-center">입력된 과제 이행률이 없습니다.</p>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">모의고사 점수 추이</h2>
        {scoreData.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
            이 기간에 입력된 모의고사 점수가 없습니다.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3 mb-3 text-center">
              <StatBox label="최고" value={`${stats.scoreMax}점`} />
              <StatBox label="평균" value={`${stats.scoreAvg}점`} />
              <StatBox label="최저" value={`${stats.scoreMin}점`} />
              <StatBox
                label="변화"
                value={
                  stats.scoreDelta === null
                    ? "—"
                    : `${stats.scoreDelta > 0 ? "+" : ""}${stats.scoreDelta}점`
                }
                accent={
                  stats.scoreDelta !== null && stats.scoreDelta > 0
                    ? "high"
                    : stats.scoreDelta !== null && stats.scoreDelta < 0
                      ? "low"
                      : undefined
                }
              />
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreData} margin={{ top: 20, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="shortLabel" tick={{ fontSize: 10 }} stroke="#737373" />
                  <YAxis
                    domain={[scoreYMin, scoreYMax]}
                    tick={{ fontSize: 10 }}
                    stroke="#737373"
                    width={36}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload as (typeof scoreData)[number];
                      return (
                        <div className="bg-white border border-zinc-200 rounded-md shadow-md px-3 py-2 text-xs">
                          <div className="font-medium">{p.label}</div>
                          {p.scope && <div className="text-zinc-500">{p.scope}</div>}
                          <div className="mt-1 font-semibold">{p.score}점</div>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#60a5fa"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: "#60a5fa", stroke: "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  >
                    <LabelList
                      dataKey="score"
                      position="top"
                      style={{ fontSize: 10, fill: "#1e40af", fontWeight: 600 }}
                      formatter={(v: number) => `${v}`}
                    />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">진도 요약</h2>
        <div className="space-y-2 text-sm">
          {stats.vocabularySummary.length > 0 && (
            <Summary label="어휘" items={stats.vocabularySummary} />
          )}
          {stats.examSummary.length > 0 && (
            <Summary label="모의고사 범위" items={stats.examSummary} />
          )}
          {stats.pastTypeSummary.length > 0 && (
            <Summary label="기출 유형" items={stats.pastTypeSummary} />
          )}
          {stats.vocabularySummary.length === 0 &&
            stats.examSummary.length === 0 &&
            stats.pastTypeSummary.length === 0 && (
              <p className="text-zinc-500">입력된 진도 내용이 없습니다.</p>
            )}
        </div>
      </section>

      {comment.trim() && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">선생님 코멘트</h2>
          <div className="rounded-md border bg-zinc-50 p-4 text-sm whitespace-pre-wrap leading-relaxed">
            {comment}
          </div>
        </section>
      )}

      <footer className="pt-4 border-t text-xs text-zinc-500 text-right">
        ClassLog · 클래스로그
      </footer>
    </div>
  );
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div className="text-zinc-500">{label}</div>
      <div className="font-medium">{value}</div>
    </>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "low" | "mid" | "high";
}) {
  const palette = accent ? FRESH[accent] : FRESH.neutral;
  return (
    <div
      className="rounded-md px-3 py-2"
      style={{ background: palette.bg, color: palette.fg }}
    >
      <div className="text-[10px] opacity-80">{label}</div>
      <div className="text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Summary({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-zinc-500 mb-1">{label}</div>
      <ul className="list-disc pl-5 space-y-0.5">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
