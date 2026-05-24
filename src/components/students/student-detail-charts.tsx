"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { getDB } from "@/lib/db";
import { ScoreLineChart } from "@/components/charts/score-line-chart";
import {
  MonthlyCompletionChart,
  CumulativeCompletionChart,
} from "@/components/charts/completion-charts";

export function StudentScoreChart({ studentId }: { studentId: string }) {
  const sessions = useLiveQuery(
    async () => getDB().sessions.where("studentId").equals(studentId).toArray(),
    [studentId],
  );
  if (sessions === undefined) return <SkeletonChart />;
  return <ScoreLineChart sessions={sessions} />;
}

export function StudentCompletionCharts({ studentId }: { studentId: string }) {
  const sessions = useLiveQuery(
    async () => getDB().sessions.where("studentId").equals(studentId).toArray(),
    [studentId],
  );
  if (sessions === undefined) return <SkeletonChart />;
  return (
    <div className="space-y-4">
      <MonthlyCompletionChart sessions={sessions} />
      <CumulativeCompletionChart sessions={sessions} />
    </div>
  );
}

function SkeletonChart() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="h-64 bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}
