"use client";

import Link from "next/link";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Users, FileText, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StudentAvatar } from "@/components/students/student-avatar";
import { CompletionBadge } from "@/components/sessions/completion-badge";
import { ScheduleCalendar } from "@/components/dashboard/schedule-calendar";
import { DaySchedulePopup } from "@/components/dashboard/day-schedule-popup";
import { getDB } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { studentsScheduledOn, sortSlots } from "@/lib/schedule";
import type { Student, Session } from "@/types/models";

export function Dashboard() {
  const [todayPopup, setTodayPopup] = useState(false);

  const data = useLiveQuery(async () => {
    const db = getDB();
    const [students, recentSessions, scheduledNotifs] = await Promise.all([
      db.students.toArray(),
      db.sessions.orderBy("sessionDate").reverse().limit(5).toArray(),
      db.notifications.where("status").equals("scheduled").toArray(),
    ]);
    const studentById = new Map(students.map((s) => [s.id, s]));
    const now = new Date();
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const todays = studentsScheduledOn(students, now);
    const tomorrows = studentsScheduledOn(students, tomorrowDate);
    return {
      students,
      studentById,
      todays,
      tomorrows,
      recent: recentSessions,
      pendingNotifs: scheduledNotifs.length,
    };
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">홈 · 대시보드</h1>
          <p className="text-muted-foreground text-sm">
            {new Intl.DateTimeFormat("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            }).format(new Date())}
          </p>
        </div>
        <Button asChild>
          <Link href="/students/new">
            <Plus className="size-4" /> 학생 등록
          </Link>
        </Button>
      </header>

      {/* 통계 카드 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="전체 학생" value={data?.students.length ?? "—"} href="/students" />
        <StatCard
          label="오늘 수업"
          value={data?.todays.length ?? "—"}
          highlight={!!data && data.todays.length > 0}
          onClick={() => setTodayPopup(true)}
        />
        <StatCard label="내일 수업" value={data?.tomorrows.length ?? "—"} />
        <StatCard label="예약 알림" value={data?.pendingNotifs ?? "—"} href="/notifications" />
      </section>

      <DaySchedulePopup
        date={todayPopup ? new Date() : null}
        events={
          data?.todays.flatMap(({ student, slots }) =>
            sortSlots(slots).map((slot) => ({
              student,
              time: slot.time,
              originalDate: toISODate(new Date()),
              originalTime: slot.time,
            })),
          ) ?? []
        }
        open={todayPopup}
        onClose={() => setTodayPopup(false)}
      />

      {/* 수업 일정 캘린더 */}
      <section className="space-y-3">
        <ScheduleCalendar students={data?.students ?? []} />
      </section>

      {/* 최근 수업 기록 */}
      <section className="space-y-3">
        <SectionHeader title="최근 수업 기록" count={data?.recent.length} />
        <RecentSessions
          sessions={data?.recent}
          studentById={data?.studentById}
        />
      </section>

      {/* 빠른 입력 */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">바로가기</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickAction href="/students" icon={<Users className="size-5" />} title="학생 목록" desc="진도표 보러가기" />
          <QuickAction href="/reports/new" icon={<FileText className="size-5" />} title="리포트 생성" desc="부모용 PDF" />
          <QuickAction href="/notifications" icon={<Bell className="size-5" />} title="알림 관리" desc="메시지 템플릿" />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  highlight,
  onClick,
}: {
  label: string;
  value: number | string;
  href?: string;
  highlight?: boolean;
  onClick?: () => void;
}) {
  const card = (
    <Card
      className={`${highlight ? "ring-2 ring-primary/40 " : ""}${onClick || href ? "hover:bg-accent/40 transition-colors cursor-pointer" : ""}`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
  if (href) return <Link href={href}>{card}</Link>;
  if (onClick)
    return (
      <button type="button" onClick={onClick} className="text-left w-full">
        {card}
      </button>
    );
  return card;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function SectionHeader({
  title,
  icon,
  count,
}: {
  title: string;
  icon?: React.ReactNode;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {icon}
      {count !== undefined && count > 0 && (
        <Badge variant="secondary" className="text-[10px]">
          {count}
        </Badge>
      )}
    </div>
  );
}


function RecentSessions({
  sessions,
  studentById,
}: {
  sessions?: Session[];
  studentById?: Map<string, Student>;
}) {
  if (sessions === undefined) return <SkeletonRow />;
  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          아직 수업 기록이 없습니다.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="p-0 divide-y">
        {sessions.map((s) => {
          const student = studentById?.get(s.studentId);
          return (
            <Link
              key={s.id}
              href={student ? `/students/${student.id}` : "#"}
              className="flex items-center gap-3 p-4 hover:bg-accent/40 transition-colors"
            >
              {student ? (
                <StudentAvatar name={student.name} image={student.profileImage} size="sm" />
              ) : (
                <div className="size-9 rounded-full bg-muted" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{student?.name ?? "(삭제된 학생)"}</span>
                  <span className="text-xs text-muted-foreground">· {formatDate(s.sessionDate)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {s.vocabulary || s.mockExamScope || s.notes || s.nextAssignment || "기록 내용 없음"}
                </p>
              </div>
              <CompletionBadge rate={s.previousCompletionRate} size="sm" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

function QuickAction({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Button asChild variant="outline" className="h-auto justify-start gap-3 py-4 px-4">
      <Link href={href}>
        {icon}
        <div className="flex flex-col items-start">
          <span className="font-medium">{title}</span>
          <span className="text-xs text-muted-foreground">{desc}</span>
        </div>
      </Link>
    </Button>
  );
}

function SkeletonRow() {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="size-9 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
          <div className="h-3 w-32 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
