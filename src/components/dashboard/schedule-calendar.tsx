"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DAY_LABELS, sortSlots } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import type { ScheduleSlot, Student } from "@/types/models";

type View = "month" | "week" | "day";

interface Occurrence {
  student: Student;
  date: Date;
  time: string;
}

/* ---------- 날짜 유틸 ---------- */

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function startOfWeek(d: Date): Date {
  /* 일요일 시작 */
  const r = startOfDay(d);
  r.setDate(r.getDate() - r.getDay());
  return r;
}
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}
function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/* ---------- 일정 생성 ---------- */

function expandOccurrences(students: Student[], from: Date, to: Date): Occurrence[] {
  const result: Occurrence[] = [];
  const fromDay = startOfDay(from);
  const toDay = startOfDay(to);
  for (let d = new Date(fromDay); d <= toDay; d = addDays(d, 1)) {
    const dow = d.getDay();
    for (const s of students) {
      if (s.status !== "active" || !s.schedule || s.schedule.length === 0) continue;
      const slots = sortSlots(s.schedule.filter((slot) => slot.dayOfWeek === dow));
      for (const slot of slots) {
        const [h, m] = slot.time.split(":").map((n) => parseInt(n, 10));
        const occ = new Date(d);
        occ.setHours(h || 0, m || 0, 0, 0);
        result.push({ student: s, date: occ, time: slot.time });
      }
    }
  }
  return result.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/* ---------- 컴포넌트 ---------- */

export function ScheduleCalendar({ students }: { students: Student[] }) {
  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));

  const range = useMemo(() => computeRange(view, anchor), [view, anchor]);
  const events = useMemo(
    () => expandOccurrences(students, range.from, range.to),
    [students, range.from, range.to],
  );

  const headerLabel = useMemo(() => {
    if (view === "month") {
      return `${anchor.getFullYear()}년 ${anchor.getMonth() + 1}월`;
    }
    if (view === "week") {
      const start = startOfWeek(anchor);
      const end = addDays(start, 6);
      return `${start.getMonth() + 1}월 ${start.getDate()}일 – ${end.getMonth() + 1}월 ${end.getDate()}일`;
    }
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(anchor);
  }, [view, anchor]);

  const goPrev = () => {
    if (view === "month") {
      const next = new Date(anchor);
      next.setMonth(anchor.getMonth() - 1);
      setAnchor(next);
    } else {
      setAnchor(addDays(anchor, view === "week" ? -7 : -1));
    }
  };
  const goNext = () => {
    if (view === "month") {
      const next = new Date(anchor);
      next.setMonth(anchor.getMonth() + 1);
      setAnchor(next);
    } else {
      setAnchor(addDays(anchor, view === "week" ? 7 : 1));
    }
  };
  const goToday = () => setAnchor(startOfDay(new Date()));

  return (
    <Card>
      <CardContent className="p-4 md:p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="size-4 text-muted-foreground" />
            <h2 className="text-base md:text-lg font-semibold">{headerLabel}</h2>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={goPrev} aria-label="이전">
                <ChevronLeft className="size-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={goToday}>오늘</Button>
              <Button size="icon" variant="ghost" onClick={goNext} aria-label="다음">
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <Tabs value={view} onValueChange={(v) => setView(v as View)}>
              <TabsList>
                <TabsTrigger value="month">월</TabsTrigger>
                <TabsTrigger value="week">주</TabsTrigger>
                <TabsTrigger value="day">일</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {view === "month" && <MonthGrid anchor={anchor} events={events} />}
        {view === "week" && <WeekGrid anchor={anchor} events={events} />}
        {view === "day" && <DayList anchor={anchor} events={events} />}
      </CardContent>
    </Card>
  );
}

function computeRange(view: View, anchor: Date): { from: Date; to: Date } {
  if (view === "month") {
    const first = startOfMonth(anchor);
    const last = endOfMonth(anchor);
    /* 캘린더 그리드는 6주(42일) */
    const from = startOfWeek(first);
    const to = addDays(from, 41);
    return { from, to };
  }
  if (view === "week") {
    const from = startOfWeek(anchor);
    return { from, to: addDays(from, 6) };
  }
  return { from: startOfDay(anchor), to: startOfDay(anchor) };
}

/* ---------- 월 뷰 ---------- */

function MonthGrid({ anchor, events }: { anchor: Date; events: Occurrence[] }) {
  const first = startOfMonth(anchor);
  const gridStart = startOfWeek(first);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  const eventsByDate = groupByDate(events);

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden min-w-[640px]">
        {DAY_LABELS.map((label, i) => (
          <div
            key={i}
            className={cn(
              "bg-muted px-2 py-1.5 text-xs font-medium text-center",
              i === 0 && "text-rose-600",
              i === 6 && "text-blue-600",
            )}
          >
            {label}
          </div>
        ))}
        {days.map((d, i) => {
          const key = dateKey(d);
          const dayEvents = eventsByDate.get(key) ?? [];
          return (
            <DayCell
              key={i}
              date={d}
              events={dayEvents}
              outside={!isSameMonth(d, anchor)}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayCell({
  date,
  events,
  outside,
}: {
  date: Date;
  events: Occurrence[];
  outside: boolean;
}) {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const max = 3;
  const visible = events.slice(0, max);
  const overflow = events.length - visible.length;

  return (
    <div
      className={cn(
        "bg-background min-h-[88px] md:min-h-[100px] p-1.5 flex flex-col gap-1",
        outside && "bg-muted/40",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between text-xs font-medium",
          outside && "text-muted-foreground/60",
          isWeekend && date.getDay() === 0 && "text-rose-600",
          isWeekend && date.getDay() === 6 && "text-blue-600",
        )}
      >
        <span
          className={cn(
            "inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px]",
            isToday(date) && "bg-primary text-primary-foreground",
          )}
        >
          {date.getDate()}
        </span>
      </div>
      <div className="space-y-0.5">
        {visible.map((e, i) => (
          <EventChip key={i} event={e} />
        ))}
        {overflow > 0 && (
          <div className="text-[10px] text-muted-foreground px-1">+{overflow}</div>
        )}
      </div>
    </div>
  );
}

function EventChip({ event }: { event: Occurrence }) {
  return (
    <Link
      href={`/students/${event.student.id}`}
      className="block truncate rounded px-1.5 py-0.5 text-[10px] leading-tight bg-primary/10 hover:bg-primary/20 text-foreground"
      title={`${event.time} ${event.student.name}`}
    >
      <span className="font-medium tabular-nums">{event.time}</span>{" "}
      <span>{event.student.name}</span>
    </Link>
  );
}

/* ---------- 주 뷰 ---------- */

function WeekGrid({ anchor, events }: { anchor: Date; events: Occurrence[] }) {
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const eventsByDate = groupByDate(events);

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {days.map((d, i) => {
        const key = dateKey(d);
        const dayEvents = eventsByDate.get(key) ?? [];
        const dow = d.getDay();
        return (
          <div
            key={i}
            className={cn(
              "rounded-md border bg-background p-2.5 min-h-[110px]",
              isToday(d) && "border-primary",
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between text-xs font-medium pb-1.5 mb-1.5 border-b",
                dow === 0 && "text-rose-600",
                dow === 6 && "text-blue-600",
              )}
            >
              <span>{DAY_LABELS[dow]} {d.getDate()}일</span>
              {isToday(d) && (
                <span className="text-[10px] bg-primary text-primary-foreground rounded px-1.5 py-0.5">오늘</span>
              )}
            </div>
            {dayEvents.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">수업 없음</p>
            ) : (
              <div className="space-y-1">
                {dayEvents.map((e, idx) => (
                  <EventChip key={idx} event={e} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- 일 뷰 ---------- */

function DayList({ anchor, events }: { anchor: Date; events: Occurrence[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
        {isToday(anchor) ? "오늘 예정된 수업이 없습니다." : "이 날짜에 예정된 수업이 없습니다."}
      </div>
    );
  }
  return (
    <ol className="space-y-2">
      {events.map((e, i) => (
        <li key={i}>
          <Link
            href={`/students/${e.student.id}`}
            className="flex items-center gap-3 rounded-md border bg-background hover:bg-accent/40 transition-colors p-3"
          >
            <div className="text-lg font-semibold tabular-nums w-20 shrink-0">{e.time}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{e.student.name}</div>
              <div className="text-xs text-muted-foreground">
                {e.student.school} · {e.student.grade}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}

/* ---------- helpers ---------- */

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function groupByDate(events: Occurrence[]): Map<string, Occurrence[]> {
  const m = new Map<string, Occurrence[]>();
  for (const e of events) {
    const k = dateKey(e.date);
    const arr = m.get(k) ?? [];
    arr.push(e);
    m.set(k, arr);
  }
  for (const arr of m.values()) {
    arr.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  return m;
}

/* schedule slot util reuse to silence unused */
export type { ScheduleSlot };
