"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDB } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/utils";
import { deleteReport } from "@/lib/repositories/reports";
import { StudentAvatar } from "@/components/students/student-avatar";

export default function ReportsPage() {
  const data = useLiveQuery(async () => {
    const db = getDB();
    const [reports, students] = await Promise.all([
      db.reports.orderBy("createdAt").reverse().toArray(),
      db.students.toArray(),
    ]);
    const studentById = new Map(students.map((s) => [s.id, s]));
    return { reports, studentById };
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">리포트</h1>
          <p className="text-muted-foreground text-sm">학부모에게 전달할 학습 리포트를 만들고 관리합니다.</p>
        </div>
        <Button asChild>
          <Link href="/reports/new">
            <Plus className="size-4" /> 새 리포트
          </Link>
        </Button>
      </header>

      {data === undefined ? (
        <div className="h-32 rounded-md bg-muted animate-pulse" />
      ) : data.reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <div className="size-14 rounded-full bg-secondary flex items-center justify-center">
              <FileText className="size-6 text-muted-foreground" />
            </div>
            <p className="font-medium">생성된 리포트가 없습니다</p>
            <p className="text-sm text-muted-foreground">
              학생 한 명을 골라 첫 부모용 리포트를 만들어보세요.
            </p>
            <Button asChild>
              <Link href="/reports/new">
                <Plus className="size-4" /> 새 리포트 만들기
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {data.reports.map((r) => {
            const s = data.studentById.get(r.studentId);
            return (
              <li key={r.id}>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    {s ? (
                      <StudentAvatar name={s.name} image={s.profileImage} size="sm" />
                    ) : (
                      <div className="size-9 rounded-full bg-muted" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{s?.name ?? "(삭제된 학생)"}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(r.fromDate)} – {formatDate(r.toDate)} · 생성 {formatDateTime(r.createdAt)}
                      </div>
                      {r.comment && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.comment}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!confirm("이 리포트 기록을 삭제할까요?")) return;
                        try {
                          await deleteReport(r.id);
                          toast.success("삭제되었습니다.");
                        } catch (err) {
                          console.error(err);
                          toast.error("삭제에 실패했습니다.");
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
