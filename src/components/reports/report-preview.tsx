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
} from "recharts";
import { formatDate, completionBucket } from "@/lib/utils";
import type { Student, Session } from "@/types/models";
import type { ReportStats } from "@/lib/reports";

interface Props {
  student: Student;
  sessions: Session[];
  stats: ReportStats;
  fromDate: string;
  toDate: string;
  comment: string;
}

export const ReportPreview = forwardRef<HTMLDivElement, Props>(function ReportPreview(
  { student, sessions, stats, fromDate, toDate, comment },
  ref,
) {
  const scoreData = sessions
    .filter((s) => s.mockExamScore !== null && s.mockExamScore !== undefined)
    .sort((a, b) => (a.sessionDate < b.sessionDate ? -1 : 1))
    .map((s) => ({
      label: formatDate(s.sessionDate),
      score: s.mockExamScore!,
    }));

  const completionData = sessions
    .filter((s) => s.previousCompletionRate !== null && s.previousCompletionRate !== undefined)
    .sort((a, b) => (a.sessionDate < b.sessionDate ? -1 : 1))
    .map((s) => ({
      label: formatDate(s.sessionDate).slice(5),
      rate: s.previousCompletionRate!,
    }));

  const totalAssessed = stats.completionCount || 1;
  const lowPct = Math.round((stats.completionBuckets.low / totalAssessed) * 100);
  const midPct = Math.round((stats.completionBuckets.mid / totalAssessed) * 100);
  const highPct = Math.round((stats.completionBuckets.high / totalAssessed) * 100);

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
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">과제 수행 통계</h2>
        <div className="grid grid-cols-4 gap-3 text-center">
          <StatBox label="평균 이행률" value={stats.completionAvg !== null ? `${stats.completionAvg}%` : "—"} />
          <StatBox label=">80%" value={`${stats.completionBuckets.high}회 (${highPct || 0}%)`} accent="high" />
          <StatBox label="61–80%" value={`${stats.completionBuckets.mid}회 (${midPct || 0}%)`} accent="mid" />
          <StatBox label="≤60%" value={`${stats.completionBuckets.low}회 (${lowPct || 0}%)`} accent="low" />
        </div>
        {completionData.length > 0 && (
          <div className="h-44 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#737373" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} stroke="#737373" />
                <Tooltip />
                <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="4 4" />
                <ReferenceLine y={80} stroke="#eab308" strokeDasharray="4 4" />
                <Bar dataKey="rate" radius={[3, 3, 0, 0]}>
                  {completionData.map((d, i) => {
                    const b = completionBucket(d.rate);
                    const color =
                      b === "low" ? "#fb7185" : b === "mid" ? "#86efac" : "#facc15";
                    return <Cell key={i} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {scoreData.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">모의고사 점수 추이</h2>
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
              accent={stats.scoreDelta !== null && stats.scoreDelta > 0 ? "high" : undefined}
            />
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#737373" />
                <YAxis tick={{ fontSize: 10 }} stroke="#737373" />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

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
  const bg =
    accent === "low"
      ? "bg-rose-100"
      : accent === "mid"
        ? "bg-emerald-100"
        : accent === "high"
          ? "bg-yellow-100"
          : "bg-zinc-100";
  return (
    <div className={`rounded-md ${bg} px-3 py-2`}>
      <div className="text-[10px] text-zinc-600">{label}</div>
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
