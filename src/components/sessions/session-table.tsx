"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDB } from "@/lib/db";
import { formatDate, cn } from "@/lib/utils";
import { CompletionBadge, completionRowClass } from "@/components/sessions/completion-badge";
import { SessionFormDialog } from "@/components/sessions/session-form-dialog";
import { getMockExamEntries, type Session } from "@/types/models";

export function SessionTable({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Session | undefined>(undefined);

  const sessions = useLiveQuery(async () => {
    const list = await getDB().sessions.where("studentId").equals(studentId).toArray();
    return list.sort((a, b) =>
      a.sessionDate < b.sessionDate ? 1 : a.sessionDate > b.sessionDate ? -1 : b.createdAt - a.createdAt,
    );
  }, [studentId]);

  /* 키보드 단축키: Ctrl+N 으로 새 수업 기록 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.ctrlKey || e.metaKey) && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        setEditing(undefined);
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          최신 수업이 위에 표시됩니다. 행을 클릭하면 수정할 수 있습니다.
          <span className="hidden md:inline ml-2">
            <kbd className="px-1.5 py-0.5 text-[10px] rounded border bg-muted">Ctrl</kbd>
            <span className="mx-1">+</span>
            <kbd className="px-1.5 py-0.5 text-[10px] rounded border bg-muted">N</kbd>
            <span className="ml-1">새 기록</span>
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> 새 수업 기록
        </Button>
      </div>

      {sessions === undefined ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">불러오는 중…</CardContent>
        </Card>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center space-y-3">
            <p className="text-sm text-muted-foreground">아직 수업 기록이 없습니다.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(undefined);
                setOpen(true);
              }}
            >
              <Plus className="size-4" /> 첫 수업 기록 추가
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">수업일</TableHead>
                  <TableHead className="w-24">이전 이행률</TableHead>
                  <TableHead>어휘</TableHead>
                  <TableHead className="w-56">모의고사</TableHead>
                  <TableHead className="w-32">기출 유형</TableHead>
                  <TableHead>비고</TableHead>
                  <TableHead className="w-12 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow
                    key={s.id}
                    className={cn("cursor-pointer", completionRowClass(s.previousCompletionRate))}
                    onClick={() => {
                      setEditing(s);
                      setOpen(true);
                    }}
                  >
                    <TableCell className="font-mono text-xs">{formatDate(s.sessionDate)}</TableCell>
                    <TableCell>
                      <CompletionBadge rate={s.previousCompletionRate} size="sm" />
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{s.vocabulary || "—"}</TableCell>
                    <TableCell className="text-xs">
                      {(() => {
                        const exams = getMockExamEntries(s);
                        if (exams.length === 0) return "—";
                        return (
                          <div className="space-y-0.5">
                            {exams.map((e, i) => (
                              <div key={i} className="flex justify-between gap-2">
                                <span className="truncate">{e.scope || "범위 미입력"}</span>
                                <span className="tabular-nums shrink-0">
                                  {e.score !== null && e.score !== undefined ? `${e.score}점` : "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-xs">{s.pastQuestionType || "—"}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {s.notes || s.nextAssignment ? (
                        <span className="line-clamp-1">
                          {s.notes}
                          {s.nextAssignment ? ` · 다음: ${s.nextAssignment}` : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Pencil className="size-3.5 text-muted-foreground inline" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <SessionFormDialog
        open={open}
        onOpenChange={setOpen}
        studentId={studentId}
        session={editing}
      />
    </div>
  );
}
