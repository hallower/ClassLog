"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
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
import {
  createSession,
  deleteSession,
  updateSession,
} from "@/lib/repositories/sessions";
import { todayISO } from "@/lib/utils";
import { getMockExamEntries, type MockExamEntry, type Session } from "@/types/models";

const schema = z.object({
  sessionDate: z.string().min(1, "수업일을 선택하세요."),
  vocabulary: z.string().optional(),
  pastQuestionType: z.string().optional(),
  notes: z.string().optional(),
  nextAssignment: z.string().optional(),
  previousCompletionRate: z
    .union([z.string().length(0), z.coerce.number().min(0).max(100)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : Number(v))),
});

type FormValues = z.input<typeof schema>;
type ParsedValues = z.output<typeof schema>;

interface ExamRow {
  scope: string;
  scoreText: string;
}

function entriesToRows(entries: MockExamEntry[]): ExamRow[] {
  return entries.map((e) => ({
    scope: e.scope,
    scoreText: e.score === null || e.score === undefined ? "" : String(e.score),
  }));
}

function rowsToEntries(rows: ExamRow[]): MockExamEntry[] {
  const result: MockExamEntry[] = [];
  for (const r of rows) {
    const scope = r.scope.trim();
    const scoreNum = r.scoreText.trim() === "" ? null : Number(r.scoreText);
    if (!scope && (scoreNum === null || Number.isNaN(scoreNum))) continue;
    result.push({
      scope,
      score: scoreNum === null || Number.isNaN(scoreNum) ? null : scoreNum,
    });
  }
  return result;
}

export function SessionFormDialog({
  open,
  onOpenChange,
  studentId,
  session,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  studentId: string;
  session?: Session;
  onSaved?: () => void;
}) {
  const editing = !!session;
  const [submitting, setSubmitting] = useState(false);
  const [examRows, setExamRows] = useState<ExamRow[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sessionDate: session?.sessionDate ?? todayISO(),
      vocabulary: session?.vocabulary ?? "",
      pastQuestionType: session?.pastQuestionType ?? "",
      notes: session?.notes ?? "",
      nextAssignment: session?.nextAssignment ?? "",
      previousCompletionRate:
        session?.previousCompletionRate === null ||
        session?.previousCompletionRate === undefined
          ? ""
          : String(session.previousCompletionRate),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        sessionDate: session?.sessionDate ?? todayISO(),
        vocabulary: session?.vocabulary ?? "",
        pastQuestionType: session?.pastQuestionType ?? "",
        notes: session?.notes ?? "",
        nextAssignment: session?.nextAssignment ?? "",
        previousCompletionRate:
          session?.previousCompletionRate === null ||
          session?.previousCompletionRate === undefined
            ? ""
            : String(session.previousCompletionRate),
      });
      const entries = session ? getMockExamEntries(session) : [];
      setExamRows(entries.length > 0 ? entriesToRows(entries) : []);
    }
  }, [open, session, form]);

  const addExamRow = () => {
    setExamRows((prev) => [...prev, { scope: "", scoreText: "" }]);
  };

  const updateExamRow = (idx: number, patch: Partial<ExamRow>) => {
    setExamRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const removeExamRow = (idx: number) => {
    setExamRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async (raw: FormValues) => {
    const parsed = schema.parse(raw) as ParsedValues;
    /* 점수 범위 검증 */
    for (const r of examRows) {
      const s = r.scoreText.trim();
      if (s === "") continue;
      const n = Number(s);
      if (Number.isNaN(n) || n < 0 || n > 200) {
        toast.error("모의고사 점수는 0~200 사이로 입력해주세요.");
        return;
      }
    }
    const mockExams = rowsToEntries(examRows);
    setSubmitting(true);
    try {
      const basePayload = {
        sessionDate: parsed.sessionDate,
        vocabulary: parsed.vocabulary || undefined,
        mockExams: mockExams.length > 0 ? mockExams : undefined,
        /* 구 필드는 더 이상 쓰지 않음 (read fallback만 유지). 수정 시 비워서 일관성 확보. */
        mockExamScope: undefined,
        mockExamScore: null,
        pastQuestionType: parsed.pastQuestionType || undefined,
        notes: parsed.notes || undefined,
        nextAssignment: parsed.nextAssignment || undefined,
        previousCompletionRate: parsed.previousCompletionRate,
      };
      if (editing) {
        await updateSession(session!.id, basePayload);
        toast.success("수업 기록이 수정되었습니다.");
      } else {
        await createSession({ studentId, ...basePayload });
        toast.success("수업 기록이 추가되었습니다.");
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!session) return;
    if (!confirm("이 수업 기록을 삭제할까요? 연결된 과제도 함께 삭제됩니다.")) return;
    setSubmitting(true);
    try {
      await deleteSession(session.id);
      toast.success("수업 기록이 삭제되었습니다.");
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("삭제에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "수업 기록 수정" : "새 수업 기록"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(submit)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              form.handleSubmit(submit)();
            }
          }}
          className="space-y-4"
        >
          <div className="grid md:grid-cols-2 gap-3">
            <FormField label="수업일" required>
              <Input type="date" autoFocus {...form.register("sessionDate")} />
            </FormField>
            <FormField label="이전 과제 이행률 (%)">
              <Input
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                placeholder="0–100"
                {...form.register("previousCompletionRate")}
              />
            </FormField>
            <FormField label="어휘 진도" className="md:col-span-2">
              <Input placeholder="예: Day 12 (1500–1600)" {...form.register("vocabulary")} />
            </FormField>
          </div>

          {/* 모의고사 — 여러 범위/점수 입력 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">모의고사</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={addExamRow}
              >
                <Plus className="size-3.5" /> 추가
              </Button>
            </div>
            {examRows.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                <button
                  type="button"
                  className="underline underline-offset-2 hover:text-foreground"
                  onClick={addExamRow}
                >
                  + 첫 모의고사 범위 추가
                </button>
              </p>
            ) : (
              <ul className="space-y-2">
                {examRows.map((row, idx) => (
                  <li key={idx} className="flex gap-2 items-start">
                    <Input
                      className="flex-1"
                      placeholder="범위 (예: 2024 6월 모의고사)"
                      value={row.scope}
                      onChange={(e) => updateExamRow(idx, { scope: e.target.value })}
                    />
                    <Input
                      className="w-24"
                      type="number"
                      min={0}
                      max={200}
                      inputMode="numeric"
                      placeholder="점수"
                      value={row.scoreText}
                      onChange={(e) => updateExamRow(idx, { scoreText: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExamRow(idx)}
                      aria-label="삭제"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <FormField label="기출 유형" className="md:col-span-2">
              <Input placeholder="예: 빈칸, 어법, 주제 등" {...form.register("pastQuestionType")} />
            </FormField>
            <FormField label="기타 비고" className="md:col-span-2">
              <Textarea rows={2} {...form.register("notes")} placeholder="수업 중 메모, 학생 컨디션 등" />
            </FormField>
            <FormField label="다음 수업 과제" className="md:col-span-2">
              <Textarea rows={2} {...form.register("nextAssignment")} placeholder="다음 시간에 학습할 진도·과제" />
            </FormField>
          </div>

          <DialogFooter className="flex-row sm:justify-between gap-2">
            <div>
              {editing && (
                <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={submitting}>
                  삭제
                </Button>
              )}
            </div>
            <div className="flex gap-2 ml-auto">
              <span className="hidden md:flex items-center text-xs text-muted-foreground mr-2">
                <kbd className="px-1.5 py-0.5 text-[10px] rounded border bg-muted">Ctrl</kbd>
                <span className="mx-1">+</span>
                <kbd className="px-1.5 py-0.5 text-[10px] rounded border bg-muted">Enter</kbd>
                <span className="ml-2">저장</span>
              </span>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
                취소
              </Button>
              <Button type="submit" disabled={submitting}>
                저장
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
