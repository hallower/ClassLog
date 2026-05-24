"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { completionBucket, cn, formatDate } from "@/lib/utils";
import type { Session } from "@/types/models";

type Mode = "monthly" | "weekly" | "session";
const SESSION_COUNTS = [4, 8, 12, 16] as const;

interface Point {
  label: string;
  key: string;
  avg: number;
  count: number;
}

function pickRated(sessions: Session[]) {
  return sessions
    .filter((s) => s.previousCompletionRate !== null && s.previousCompletionRate !== undefined)
    .sort((a, b) => (a.sessionDate < b.sessionDate ? -1 : 1));
}

function aggregateMonthly(sessions: Session[]): Point[] {
  const map = new Map<string, { sum: number; count: number }>();
  for (const s of pickRated(sessions)) {
    const k = s.sessionDate.slice(0, 7);
    const e = map.get(k) ?? { sum: 0, count: 0 };
    e.sum += s.previousCompletionRate!;
    e.count++;
    map.set(k, e);
  }
  return Array.from(map.entries())
    .map(([key, { sum, count }]) => ({
      key,
      label: key.replace("-", ". "),
      avg: round1(sum / count),
      count,
    }))
    .sort((a, b) => (a.key < b.key ? -1 : 1));
}

function isoWeekKey(dateStr: string): string {
  /* ISO 주차 (월요일 시작) — yyyy-Www */
  const d = new Date(dateStr + "T00:00:00");
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const week = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const isoYear = new Date(firstThursday).getFullYear();
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

function aggregateWeekly(sessions: Session[]): Point[] {
  const map = new Map<string, { sum: number; count: number; firstDate: string }>();
  for (const s of pickRated(sessions)) {
    const k = isoWeekKey(s.sessionDate);
    const e = map.get(k) ?? { sum: 0, count: 0, firstDate: s.sessionDate };
    e.sum += s.previousCompletionRate!;
    e.count++;
    if (s.sessionDate < e.firstDate) e.firstDate = s.sessionDate;
    map.set(k, e);
  }
  return Array.from(map.entries())
    .map(([key, { sum, count, firstDate }]) => ({
      key,
      label: key.split("-W")[1] ? `${key.slice(2, 4)}년 ${key.split("-W")[1]}주` : key,
      avg: round1(sum / count),
      count,
    }))
    .sort((a, b) => (a.key < b.key ? -1 : 1));
}

function takeRecent(sessions: Session[], count: number): Point[] {
  const rated = pickRated(sessions);
  const recent = rated.slice(-count);
  return recent.map((s, i) => ({
    key: s.id ?? String(i),
    label: formatDate(s.sessionDate).slice(5), /* MM-DD */
    avg: s.previousCompletionRate!,
    count: 1,
  }));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/* 산뜻한 페일 톤 (low=핑크, mid=페일 블루, high=라이트 옐로우) */
function bucketColor(rate: number): string {
  const b = completionBucket(rate);
  if (b === "low") return "#fda4af";   /* rose-300 */
  if (b === "mid") return "#7dd3fc";   /* sky-300 */
  if (b === "high") return "#fde047";  /* yellow-300 */
  return "#d4d4d8";
}

const REF_LOW_COLOR = "#fda4af";
const REF_HIGH_COLOR = "#fde047";

function cumulative(points: Point[]) {
  let totalSum = 0;
  let totalCount = 0;
  return points.map((p) => {
    totalSum += p.avg * p.count;
    totalCount += p.count;
    return { ...p, cumulative: round1(totalSum / totalCount) };
  });
}

export function CompletionChartsWithControls({ sessions }: { sessions: Session[] }) {
  const [mode, setMode] = useState<Mode>("session");
  const [sessionCount, setSessionCount] = useState<(typeof SESSION_COUNTS)[number]>(4);

  const points = useMemo(() => {
    if (mode === "monthly") return aggregateMonthly(sessions);
    if (mode === "weekly") return aggregateWeekly(sessions);
    return takeRecent(sessions, sessionCount);
  }, [mode, sessionCount, sessions]);

  const overallAvg = useMemo(() => {
    if (points.length === 0) return null;
    const sum = points.reduce((s, p) => s + p.avg * p.count, 0);
    const cnt = points.reduce((s, p) => s + p.count, 0);
    return cnt ? round1(sum / cnt) : null;
  }, [points]);

  const periodLabel =
    mode === "monthly" ? "월간" : mode === "weekly" ? "주간" : `최근 ${sessionCount}회`;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 md:p-6 space-y-3">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">{periodLabel}</strong> 과제 이행률
              {overallAvg !== null && (
                <>
                  {" "}· 전체 평균 <strong className="text-foreground">{overallAvg}%</strong>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <TabsList>
                  <TabsTrigger value="session">횟수</TabsTrigger>
                  <TabsTrigger value="weekly">주간</TabsTrigger>
                  <TabsTrigger value="monthly">월간</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {mode === "session" && (
            <div className="flex gap-1.5">
              {SESSION_COUNTS.map((c) => (
                <Button
                  key={c}
                  type="button"
                  size="sm"
                  variant={c === sessionCount ? "default" : "outline"}
                  className={cn("h-7 px-3 text-xs")}
                  onClick={() => setSessionCount(c)}
                >
                  최근 {c}회
                </Button>
              ))}
            </div>
          )}

          {points.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              표시할 이행률 데이터가 없습니다.
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={points} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="oklch(0.55 0 0)" />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11 }}
                    stroke="oklch(0.55 0 0)"
                    width={44}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload as Point;
                      return (
                        <div className="bg-popover border rounded-md shadow-md px-3 py-2 text-xs">
                          <div className="font-medium">{p.label}</div>
                          {p.count > 1 && <div className="text-muted-foreground">기록 {p.count}회</div>}
                          <div className="mt-1 font-semibold">{p.avg}%</div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={60} stroke={REF_LOW_COLOR} strokeDasharray="4 4" />
                  <ReferenceLine y={80} stroke={REF_HIGH_COLOR} strokeDasharray="4 4" />
                  <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                    {points.map((p) => (
                      <Cell key={p.key} fill={bucketColor(p.avg)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {mode !== "session" && points.length > 0 && (
        <Card>
          <CardContent className="p-4 md:p-6 space-y-2">
            <div className="text-sm text-muted-foreground">
              누적 평균 이행률 추이
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={cumulative(points)}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="oklch(0.55 0 0)" />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11 }}
                    stroke="oklch(0.55 0 0)"
                    width={44}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload as Point & { cumulative: number };
                      return (
                        <div className="bg-popover border rounded-md shadow-md px-3 py-2 text-xs">
                          <div className="font-medium">{p.label}</div>
                          <div className="text-muted-foreground">평균 {p.avg}%</div>
                          <div className="mt-1 font-semibold">누적 {p.cumulative}%</div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={60} stroke={REF_LOW_COLOR} strokeDasharray="4 4" />
                  <ReferenceLine y={80} stroke={REF_HIGH_COLOR} strokeDasharray="4 4" />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke="oklch(0.5 0.18 250)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
