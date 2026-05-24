"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, Pencil, Phone, MessageCircle, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StudentAvatar } from "@/components/students/student-avatar";
import { AddressActions } from "@/components/students/address-actions";
import { SessionTable } from "@/components/sessions/session-table";
import { formatSchedule, nextOccurrence } from "@/lib/schedule";
import { formatDateTime } from "@/lib/utils";
import {
  StudentScoreChart,
  StudentCompletionCharts,
} from "@/components/students/student-detail-charts";
import { getDB } from "@/lib/db";
import type { StudentStatus } from "@/types/models";

const STATUS_LABEL: Record<StudentStatus, string> = {
  active: "재원",
  paused: "중단",
  ended: "종료",
};

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const student = useLiveQuery(async () => getDB().students.get(id), [id]);

  if (student === undefined) {
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        <div className="h-32 rounded-md bg-muted animate-pulse" />
      </div>
    );
  }

  if (student === null || !student) {
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-3">
        <Link href="/students" className="inline-flex items-center text-sm text-muted-foreground">
          <ChevronLeft className="size-4" /> 학생 목록
        </Link>
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            존재하지 않는 학생입니다.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <Link href="/students" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> 학생 목록
      </Link>

      <Card>
        <CardContent className="p-5 md:p-6 flex flex-col md:flex-row gap-5 md:items-center">
          <StudentAvatar name={student.name} image={student.profileImage} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{student.name}</h1>
              <Badge variant="secondary">{STATUS_LABEL[student.status]}</Badge>
            </div>
            <p className="text-muted-foreground">
              {student.school} · {student.grade}
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
              {student.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5" />
                  <a href={`tel:${student.phone}`} className="hover:underline">
                    {student.phone}
                  </a>
                </span>
              )}
              {student.kakaoId && (
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="size-3.5" />
                  {student.kakaoId}
                </span>
              )}
              {student.address && <AddressActions address={student.address} />}
            </div>
            {student.schedule && student.schedule.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="size-3.5" />
                  {formatSchedule(student.schedule)}
                </span>
                {(() => {
                  const next = nextOccurrence(student.schedule);
                  return next ? <span>다음 수업 · {formatDateTime(next)}</span> : null;
                })()}
              </div>
            )}
          </div>
          <Button asChild variant="outline">
            <Link href={`/students/${student.id}/edit`}>
              <Pencil className="size-4" /> 정보 수정
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">진도표</TabsTrigger>
          <TabsTrigger value="score">모의고사 점수</TabsTrigger>
          <TabsTrigger value="completion">과제 이행률</TabsTrigger>
          <TabsTrigger value="info">학생 정보</TabsTrigger>
        </TabsList>
        <TabsContent value="sessions" className="mt-4">
          <SessionTable studentId={student.id} />
        </TabsContent>
        <TabsContent value="score" className="mt-4">
          <StudentScoreChart studentId={student.id} />
        </TabsContent>
        <TabsContent value="completion" className="mt-4">
          <StudentCompletionCharts studentId={student.id} />
        </TabsContent>
        <TabsContent value="info" className="mt-4 space-y-2">
          {student.memo ? (
            <Card>
              <CardContent className="p-4 whitespace-pre-wrap text-sm">{student.memo}</CardContent>
            </Card>
          ) : (
            <PlaceholderCard text="등록된 메모가 없습니다." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlaceholderCard({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="p-8 text-center text-sm text-muted-foreground">{text}</CardContent>
    </Card>
  );
}
