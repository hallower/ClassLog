"use client";

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
import { completionBucket } from "@/lib/utils";
import type { Session } from "@/types/models";

interface Point {
  monthLabel: string;
  monthKey: string;
  avg: number;
  count: number;
}

function aggregateMonthly(sessions: Session[]): Point[] {
  const map = new Map<string, { sum: number; count: number }>();
  for (const s of sessions) {
    const rate = s.previousCompletionRate;
    if (rate === null || rate === undefined) continue;
    const monthKey = s.sessionDate.slice(0, 7); /* yyyy-mm */
    const entry = map.get(monthKey) ?? { sum: 0, count: 0 };
    entry.sum += rate;
    entry.count += 1;
    map.set(monthKey, entry);
  }
  return Array.from(map.entries())
    .map(([monthKey, { sum, count }]) => ({
      monthKey,
      monthLabel: monthKey.replace("-", ". "),
      avg: Math.round((sum / count) * 10) / 10,
      count,
    }))
    .sort((a, b) => (a.monthKey < b.monthKey ? -1 : 1));
}

function cumulativeFromMonthly(points: Point[]) {
  let totalSum = 0;
  let totalCount = 0;
  return points.map((p) => {
    totalSum += p.avg * p.count;
    totalCount += p.count;
    return {
      ...p,
      cumulative: Math.round((totalSum / totalCount) * 10) / 10,
    };
  });
}

function bucketColor(rate: number) {
  const b = completionBucket(rate);
  if (b === "low") return "oklch(0.7 0.2 25)";
  if (b === "mid") return "oklch(0.7 0.18 145)";
  if (b === "high") return "oklch(0.78 0.18 90)";
  return "oklch(0.7 0 0)";
}

export function MonthlyCompletionChart({ sessions }: { sessions: Session[] }) {
  const data = aggregateMonthly(sessions);
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          입력된 과제 이행률이 없습니다.
        </CardContent>
      </Card>
    );
  }

  const overallAvg =
    Math.round(
      (data.reduce((s, d) => s + d.avg * d.count, 0) /
        data.reduce((s, d) => s + d.count, 0)) *
        10,
    ) / 10;

  return (
    <Card>
      <CardContent className="p-4 md:p-6 space-y-2">
        <div className="text-sm text-muted-foreground">
          월간 과제 이행률 평균 · 전체 평균 <strong className="text-foreground">{overallAvg}%</strong>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
              <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} stroke="oklch(0.55 0 0)" />
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
                      <div className="font-medium">{p.monthLabel}</div>
                      <div className="text-muted-foreground">기록 {p.count}회</div>
                      <div className="mt-1 font-semibold">{p.avg}%</div>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={60} stroke="oklch(0.7 0.18 25)" strokeDasharray="4 4" />
              <ReferenceLine y={80} stroke="oklch(0.75 0.18 90)" strokeDasharray="4 4" />
              <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                {data.map((d) => (
                  <Cell key={d.monthKey} fill={bucketColor(d.avg)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function CumulativeCompletionChart({ sessions }: { sessions: Session[] }) {
  const monthly = aggregateMonthly(sessions);
  if (monthly.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          누적 이행률을 그릴 데이터가 없습니다.
        </CardContent>
      </Card>
    );
  }
  const data = cumulativeFromMonthly(monthly);

  return (
    <Card>
      <CardContent className="p-4 md:p-6 space-y-2">
        <div className="text-sm text-muted-foreground">
          누적 평균 이행률 추이
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
              <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} stroke="oklch(0.55 0 0)" />
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
                  const p = payload[0].payload as (typeof data)[number];
                  return (
                    <div className="bg-popover border rounded-md shadow-md px-3 py-2 text-xs">
                      <div className="font-medium">{p.monthLabel}</div>
                      <div className="text-muted-foreground">월 평균 {p.avg}%</div>
                      <div className="mt-1 font-semibold">누적 {p.cumulative}%</div>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={60} stroke="oklch(0.7 0.18 25)" strokeDasharray="4 4" />
              <ReferenceLine y={80} stroke="oklch(0.75 0.18 90)" strokeDasharray="4 4" />
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
  );
}
