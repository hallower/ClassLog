"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, ChevronRight, CalendarDays, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DAY_LABELS, sortSlots } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import { getDB } from "@/lib/db";
import { OverrideDialog, type OverrideDialogState } from "@/components/dashboard/override-dialog";
import type { ScheduleOverride, ScheduleSlot, Student } from "@/types/models";

type View = "month" | "week" | "day";

interface Occurrence {
  student: Student;
  date: Date;         /* 표시할 (override 적용 후) 일시 */
  time: string;
  originalDate: string;
  originalTime: string;
  override: ScheduleOverride | null;
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
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d);
}

/* ---------- 일정 + 오버라이드 합성 ---------- */

function expandOccurrences(
  students: Student[],
  overrides: ScheduleOverride[],
  from: Date,
  to: Date,
): Occurrence[] {
  const fromIso = isoDate(from);
  const toIso = isoDate(to);
  const result: Occurrence[] = [];

  /* (studentId, originalDate, originalTime) → override 매핑 */
  const overrideKey = (sid: string, date: string, time: string) => `${sid}|${date}|${time}`;
  const map = new Map<string, ScheduleOverride>();
  for (const o of overrides) map.set(overrideKey(o.studentId, o.originalDate, o.originalTime), o);

  /* 1) 정기 일정 펼치기 */
  for (let d = new Date(startOfDay(from)); d <= startOfDay(to); d = addDays(d, 1)) {
    const dow = d.getDay();
    const dIso = isoDate(d);
    for (const s of students) {
      if (s.status !== "active" || !s.schedule) continue;
      const slots = sortSlots(s.schedule.filter((slot) => slot.dayOfWeek === dow));
      for (const slot of slots) {
        const ovr = map.get(overrideKey(s.id, dIso, slot.time));
        if (ovr) {
          /* 같은 정기 슬롯 → 다른 곳에서 추가하므로 여기선 skip */
          continue;
        }
        result.push(makeOccurrence(s, d, slot.time, dIso, slot.time, null));
      }
    }
  }

  /* 2) 오버라이드 적용: newDate에 표시 (또는 휴강이면 표시 안 함) */
  for (const o of overrides) {
    if (o.newDate === null) continue; /* 휴강 */
    if (o.newDate < fromIso || o.newDate > toIso) continue;
    const student = students.find((s) => s.id === o.studentId);
    if (!student || student.status !== "active") continue;
    const newDate = parseISODate(o.newDate);
    const newTime = o.newTime ?? o.originalTime;
    result.push(makeOccurrence(student, newDate, newTime, o.originalDate, o.originalTime, o));
  }

  return result.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function makeOccurrence(
  student: Student,
  date: Date,
  time: string,
  originalDate: string,
  originalTime: string,
  override: ScheduleOverride | null,
): Occurrence {
  const [h, m] = time.split(":").map((n) => parseInt(n, 10));
  const dt = new Date(date);
  dt.setHours(h || 0, m || 0, 0, 0);
  return { student, date: dt, time, originalDate, originalTime, override };
}

/* ---------- 컴포넌트 ---------- */

export function ScheduleCalendar({ students }: { students: Student[] }) {
  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));
  const [dialog, setDialog] = useState<OverrideDialogState | null>(null);

  const range = useMemo(() => computeRange(view, anchor), [view, anchor]);

  const overrides = useLiveQuery(
    async () => getDB().scheduleOverrides.toArray(),
    [],
  );

  const events = useMemo(
    () => expandOccurrences(students, overrides ?? [], range.from, range.to),
    [students, overrides, range.from, range.to],
  );

  const headerLabel = useMemo(() => {
    if (view === "month") return `${anchor.getFullYear()}년 ${anchor.getMonth() + 1}월`;
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
    } else setAnchor(addDays(anchor, view === "week" ? -7 : -1));
  };
  const goNext = () => {
    if (view === "month") {
      const next = new Date(anchor);
      next.setMonth(anchor.getMonth() + 1);
      setAnchor(next);
    } else setAnchor(addDays(anchor, view === "week" ? 7 : 1));
  };
  const goToday = () => setAnchor(startOfDay(new Date()));

  const openOverrideDialog = (occ: Occurrence, suggestedNewDate?: string) => {
    setDialog({
      student: occ.student,
      originalDate: occ.originalDate,
      originalTime: occ.originalTime,
      suggestedNewDate: suggestedNewDate ?? isoDate(occ.date),
      existing: occ.override,
    });
  };

  const handlers: CalendarHandlers = {
    onChipClick: (occ) => openOverrideDialog(occ),
    onDropOnDay: (occ, newDate) => openOverrideDialog(occ, isoDate(newDate)),
  };

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

        <p className="text-xs text-muted-foreground">
          일정 칸을 다른 날짜로 <strong>드래그</strong>해서 임시로 옮길 수 있어요. 클릭하면 휴강·시간 변경 옵션이 열립니다.
        </p>

        {view === "month" && <MonthGrid anchor={anchor} events={events} handlers={handlers} />}
        {view === "week" && <WeekGrid anchor={anchor} events={events} handlers={handlers} />}
        {view === "day" && <DayList anchor={anchor} events={events} handlers={handlers} />}
      </CardContent>

      <OverrideDialog state={dialog} onClose={() => setDialog(null)} />
    </Card>
  );
}

function computeRange(view: View, anchor: Date): { from: Date; to: Date } {
  if (view === "month") {
    const first = startOfMonth(anchor);
    const last = endOfMonth(anchor);
    void last;
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

interface CalendarHandlers {
  onChipClick: (occ: Occurrence) => void;
  onDropOnDay: (occ: Occurrence, newDate: Date) => void;
}

const DRAG_MIME = "application/x-classlog-occurrence";

type DragPayload = {
  studentId: string;
  originalDate: string;
  originalTime: string;
};

function eventToPayload(occ: Occurrence): string {
  const payload: DragPayload = {
    studentId: occ.student.id,
    originalDate: occ.originalDate,
    originalTime: occ.originalTime,
  };
  return JSON.stringify(payload);
}

function findOccurrenceByPayload(events: Occurrence[], raw: string): Occurrence | null {
  try {
    const p = JSON.parse(raw) as DragPayload;
    return (
      events.find(
        (e) =>
          e.student.id === p.studentId &&
          e.originalDate === p.originalDate &&
          e.originalTime === p.originalTime,
      ) ?? null
    );
  } catch {
    return null;
  }
}

/* ---------- 월 뷰 ---------- */

function MonthGrid({
  anchor,
  events,
  handlers,
}: {
  anchor: Date;
  events: Occurrence[];
  handlers: CalendarHandlers;
}) {
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
          const key = isoDate(d);
          const dayEvents = eventsByDate.get(key) ?? [];
          return (
            <DayCell
              key={i}
              date={d}
              events={dayEvents}
              allEvents={events}
              outside={!isSameMonth(d, anchor)}
              handlers={handlers}
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
  allEvents,
  outside,
  handlers,
}: {
  date: Date;
  events: Occurrence[];
  allEvents: Occurrence[];
  outside: boolean;
  handlers: CalendarHandlers;
}) {
  const [hover, setHover] = useState(false);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const max = 3;
  const visible = events.slice(0, max);
  const overflow = events.length - visible.length;

  return (
    <div
      className={cn(
        "bg-background min-h-[88px] md:min-h-[100px] p-1.5 flex flex-col gap-1 transition-colors",
        outside && "bg-muted/40",
        hover && "bg-primary/5",
      )}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(DRAG_MIME)) {
          e.preventDefault();
          setHover(true);
        }
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        const raw = e.dataTransfer.getData(DRAG_MIME);
        const occ = findOccurrenceByPayload(allEvents, raw);
        if (occ) handlers.onDropOnDay(occ, date);
      }}
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
          <EventChip key={i} event={e} onClick={() => handlers.onChipClick(e)} />
        ))}
        {overflow > 0 && (
          <div className="text-[10px] text-muted-foreground px-1">+{overflow}</div>
        )}
      </div>
    </div>
  );
}

function EventChip({
  event,
  onClick,
}: {
  event: Occurrence;
  onClick: () => void;
}) {
  const moved = !!event.override?.newDate;
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData(DRAG_MIME, eventToPayload(event));
      }}
      onClick={onClick}
      className={cn(
        "block w-full text-left truncate rounded px-1.5 py-0.5 text-[10px] leading-tight transition-colors cursor-grab active:cursor-grabbing",
        moved
          ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
          : "bg-primary/10 text-foreground hover:bg-primary/20",
      )}
      title={
        moved
          ? `임시 변경됨 · 원래 ${event.originalDate} ${event.originalTime}`
          : `${event.time} ${event.student.name}`
      }
    >
      {moved && <ArrowRightLeft className="inline size-2.5 mr-0.5 align-baseline" />}
      <span className="font-medium tabular-nums">{event.time}</span>{" "}
      <span>{event.student.name}</span>
    </button>
  );
}

/* ---------- 주 뷰 ---------- */

function WeekGrid({
  anchor,
  events,
  handlers,
}: {
  anchor: Date;
  events: Occurrence[];
  handlers: CalendarHandlers;
}) {
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const eventsByDate = groupByDate(events);

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {days.map((d, i) => {
        const key = isoDate(d);
        const dayEvents = eventsByDate.get(key) ?? [];
        const dow = d.getDay();
        return (
          <WeekDayCard
            key={i}
            date={d}
            dow={dow}
            events={dayEvents}
            allEvents={events}
            handlers={handlers}
          />
        );
      })}
    </div>
  );
}

function WeekDayCard({
  date,
  dow,
  events,
  allEvents,
  handlers,
}: {
  date: Date;
  dow: number;
  events: Occurrence[];
  allEvents: Occurrence[];
  handlers: CalendarHandlers;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className={cn(
        "rounded-md border bg-background p-2.5 min-h-[110px] transition-colors",
        isToday(date) && "border-primary",
        hover && "bg-primary/5",
      )}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(DRAG_MIME)) {
          e.preventDefault();
          setHover(true);
        }
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        const raw = e.dataTransfer.getData(DRAG_MIME);
        const occ = findOccurrenceByPayload(allEvents, raw);
        if (occ) handlers.onDropOnDay(occ, date);
      }}
    >
      <div
        className={cn(
          "flex items-center justify-between text-xs font-medium pb-1.5 mb-1.5 border-b",
          dow === 0 && "text-rose-600",
          dow === 6 && "text-blue-600",
        )}
      >
        <span>
          {DAY_LABELS[dow]} {date.getDate()}일
        </span>
        {isToday(date) && (
          <span className="text-[10px] bg-primary text-primary-foreground rounded px-1.5 py-0.5">오늘</span>
        )}
      </div>
      {events.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">수업 없음</p>
      ) : (
        <div className="space-y-1">
          {events.map((e, idx) => (
            <EventChip key={idx} event={e} onClick={() => handlers.onChipClick(e)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- 일 뷰 ---------- */

function DayList({
  anchor,
  events,
  handlers,
}: {
  anchor: Date;
  events: Occurrence[];
  handlers: CalendarHandlers;
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
        {isToday(anchor) ? "오늘 예정된 수업이 없습니다." : "이 날짜에 예정된 수업이 없습니다."}
      </div>
    );
  }
  return (
    <ol className="space-y-2">
      {events.map((e, i) => {
        const moved = !!e.override?.newDate;
        return (
          <li key={i}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-md border bg-background hover:bg-accent/40 transition-colors p-3 cursor-pointer",
                moved && "border-amber-300 bg-amber-50",
              )}
              onClick={() => handlers.onChipClick(e)}
            >
              <div className="text-lg font-semibold tabular-nums w-20 shrink-0">{e.time}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium flex items-center gap-1.5">
                  {moved && <ArrowRightLeft className="size-3 text-amber-700" />}
                  {e.student.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {e.student.school} · {e.student.grade}
                  {moved && (
                    <span className="ml-2 text-amber-700">
                      · 임시 변경 (원래 {e.originalDate.slice(5)} {e.originalTime})
                    </span>
                  )}
                </div>
              </div>
              <Link
                href={`/students/${e.student.id}`}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted"
                onClick={(ev) => ev.stopPropagation()}
              >
                상세 →
              </Link>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- helpers ---------- */

function groupByDate(events: Occurrence[]): Map<string, Occurrence[]> {
  const m = new Map<string, Occurrence[]>();
  for (const e of events) {
    const k = isoDate(e.date);
    const arr = m.get(k) ?? [];
    arr.push(e);
    m.set(k, arr);
  }
  for (const arr of m.values()) arr.sort((a, b) => a.date.getTime() - b.date.getTime());
  return m;
}

export type { ScheduleSlot };
