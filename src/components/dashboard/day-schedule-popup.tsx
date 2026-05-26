"use client";

import Link from "next/link";
import { ArrowRightLeft, ChevronRight, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StudentAvatar } from "@/components/students/student-avatar";
import { cn } from "@/lib/utils";
import type { ScheduleOverride, Student } from "@/types/models";

export interface DayPopupOccurrence {
  student: Student;
  time: string;
  /** 임시 변경된 경우 그 변경 기록 */
  override?: ScheduleOverride | null;
  /** 정기 슬롯의 원래 일시 (override가 있을 때만 의미 있음) */
  originalDate?: string;
  originalTime?: string;
}

export function DaySchedulePopup({
  date,
  events,
  open,
  onClose,
  onEditOccurrence,
}: {
  date: Date | null;
  events: DayPopupOccurrence[];
  open: boolean;
  onClose: () => void;
  /** 일정 항목 옆 연필 아이콘 클릭 시 호출. 일정 임시 변경 다이얼로그를 열 때 사용. */
  onEditOccurrence?: (occ: DayPopupOccurrence) => void;
}) {
  if (!date) return null;

  const label = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{label}</DialogTitle>
        </DialogHeader>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            예정된 수업이 없습니다.
          </p>
        ) : (
          <ol className="space-y-2 max-h-[60vh] overflow-y-auto">
            {events.map((e, i) => {
              const moved = !!e.override?.newDate;
              return (
                <li key={i}>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-md border bg-background p-3",
                      moved && "border-amber-300 bg-amber-50",
                    )}
                  >
                    <div className="text-base font-semibold tabular-nums w-16 shrink-0 tabular-nums">
                      {e.time}
                    </div>
                    <StudentAvatar
                      name={e.student.name}
                      image={e.student.profileImage}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center gap-1.5">
                        {moved && <ArrowRightLeft className="size-3 text-amber-700" />}
                        {e.student.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {e.student.school} · {e.student.grade}
                      </div>
                      {moved && (
                        <div className="text-xs text-amber-700 mt-0.5">
                          원래 {e.originalDate?.slice(5)} {e.originalTime}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {onEditOccurrence && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEditOccurrence(e)}
                          aria-label="일정 변경"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      )}
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/students/${e.student.id}`} onClick={onClose}>
                          <ChevronRight className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
