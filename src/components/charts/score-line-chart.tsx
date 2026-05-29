"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  LabelList,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { getMockExamEntries, type Session } from "@/types/models";

interface Point {
  date: string;
  label: string;
  score: number;
  scope: string;
}

export function ScoreLineChart({ sessions }: { sessions: Session[] }) {
  const data: Point[] = sessions
    .flatMap((s) =>
      getMockExamEntries(s)
        .filter((e) => e.score !== null && e.score !== undefined && e.score > 0)
        .map((e) => ({
          date: s.sessionDate,
          label: formatDate(s.sessionDate),
          score: e.score!,
          scope: e.scope,
        })),
    )
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          입력된 모의고사 점수가 없습니다.
        </CardContent>
      </Card>
    );
  }

  const scores = data.map((d) => d.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const yMin = Math.max(0, Math.floor((min - 10) / 10) * 10);
  const yMax = Math.ceil((max + 10) / 10) * 10;

  return (
    <Card>
      <CardContent className="p-4 md:p-6 space-y-3">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <Stat label="최고" value={max} />
          <Stat label="평균" value={Math.round(avg * 10) / 10} />
          <Stat label="최저" value={min} />
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 28, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                stroke="oklch(0.55 0 0)"
              />
              <YAxis
                domain={[yMin, yMax]}
                tick={{ fontSize: 11 }}
                stroke="oklch(0.55 0 0)"
                width={36}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof data)[number];
                  return (
                    <div className="bg-popover border rounded-md shadow-md px-3 py-2 text-xs">
                      <div className="font-medium">{p.label}</div>
                      <div className="text-muted-foreground">{p.scope || "범위 미입력"}</div>
                      <div className="mt-1 font-semibold">{p.score}점</div>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={avg} stroke="oklch(0.7 0 0)" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="score"
                stroke="oklch(0.5 0.18 250)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              >
                <LabelList dataKey="score" content={<PointLabel data={data} />} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface PointLabelProps {
  x?: number;
  y?: number;
  index?: number;
  data: Point[];
}

/* 각 점 위에 점수(굵게) + 날짜(MM/DD)를 함께 표시 */
function PointLabel({ x, y, index, data }: PointLabelProps) {
  if (x === undefined || y === undefined || index === undefined) return null;
  const point = data[index];
  if (!point) return null;
  const shortDate = point.date.slice(5).replace("-", "/"); /* MM/DD */
  return (
    <g>
      <text
        x={x}
        y={y - 14}
        textAnchor="middle"
        style={{ fontSize: 12, fontWeight: 700, fill: "oklch(0.4 0.18 250)" }}
      >
        {point.score}점
      </text>
      <text
        x={x}
        y={y - 26}
        textAnchor="middle"
        style={{ fontSize: 10, fill: "oklch(0.55 0 0)" }}
      >
        {shortDate}
      </text>
    </g>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/40 px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
