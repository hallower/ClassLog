"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteOverride, upsertOverride } from "@/lib/repositories/schedule-overrides";
import type { ScheduleOverride, Student } from "@/types/models";

export interface OverrideDialogState {
  student: Student;
  /** 원래 정기 일정의 날짜·시간 */
  originalDate: string;
  originalTime: string;
  /** 사용자가 드래그한 결과 새 날짜 (있을 수도, 없을 수도) */
  suggestedNewDate: string;
  /** 이미 변경된 슬롯이면 ID, 아니면 null */
  existing: ScheduleOverride | null;
}

export function OverrideDialog({
  state,
  onClose,
}: {
  state: OverrideDialogState | null;
  onClose: () => void;
}) {
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!state) return;
    setNewDate(
      state.existing?.newDate ?? state.suggestedNewDate ?? state.originalDate,
    );
    setNewTime(state.existing?.newTime ?? state.originalTime);
    setNote(state.existing?.note ?? "");
  }, [state]);

  if (!state) return null;

  const moved =
    newDate !== state.originalDate || newTime !== state.originalTime;

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await upsertOverride({
        id: state.existing?.id,
        studentId: state.student.id,
        originalDate: state.originalDate,
        originalTime: state.originalTime,
        newDate,
        newTime,
        note,
      });
      toast.success(moved ? "일정이 변경되었습니다." : "정기 일정대로 유지됩니다.");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSession = async () => {
    if (!confirm("이 수업을 휴강으로 처리할까요? 정기 일정 자체는 그대로 유지됩니다.")) return;
    setSubmitting(true);
    try {
      await upsertOverride({
        id: state.existing?.id,
        studentId: state.student.id,
        originalDate: state.originalDate,
        originalTime: state.originalTime,
        newDate: null,
        note,
      });
      toast.success("이 수업이 휴강 처리되었습니다.");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevert = async () => {
    if (!state.existing) {
      onClose();
      return;
    }
    if (!confirm("이 임시 변경을 취소하고 정기 일정으로 되돌릴까요?")) return;
    setSubmitting(true);
    try {
      await deleteOverride(state.existing.id);
      toast.success("정기 일정으로 복귀되었습니다.");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("복귀에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!state} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>일정 임시 변경</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-md bg-muted/40 p-3 text-sm">
            <div className="font-medium">{state.student.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              정기 일정 · {state.originalDate} {state.originalTime}
            </div>
            {state.existing?.newDate === null && (
              <div className="text-xs text-rose-600 mt-1">현재: 휴강 처리됨</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">새 날짜</Label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">새 시간</Label>
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">사유 메모 (선택)</Label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 학교 시험 기간, 가족 일정 등"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            이 변경은 이번 한 번만 적용되며, 학생의 정기 수업 일정은 그대로 유지됩니다.
          </p>
        </div>
        <DialogFooter className="flex-row sm:justify-between gap-2">
          <div className="flex gap-2">
            {state.existing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRevert}
                disabled={submitting}
              >
                원래대로
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelSession}
              disabled={submitting}
            >
              이 수업 휴강
            </Button>
          </div>
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              저장
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
