"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ReportPreview } from "@/components/reports/report-preview";
import { getDB } from "@/lib/db";
import { pickSessionsInRange, summarizeSessions, type ReportStats } from "@/lib/reports";
import { exportElementToPDF } from "@/lib/pdf";
import type { Report, Session, Student } from "@/types/models";

interface PreviewData {
  student: Student;
  sessions: Session[];
  stats: ReportStats;
}

export function ReportDownloadButton({ report }: { report: Report }) {
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<PreviewData | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const start = async () => {
    setBusy(true);
    try {
      const db = getDB();
      const [student, allSessions] = await Promise.all([
        db.students.get(report.studentId),
        db.sessions.where("studentId").equals(report.studentId).toArray(),
      ]);
      if (!student) {
        toast.error("해당 학생이 더 이상 존재하지 않습니다.");
        setBusy(false);
        return;
      }
      const inRange = pickSessionsInRange(allSessions, report.fromDate, report.toDate);
      const stats = summarizeSessions(inRange);
      setData({ student, sessions: inRange, stats });
    } catch (err) {
      console.error(err);
      toast.error("리포트 데이터를 불러오지 못했습니다.");
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!data || !previewRef.current) return;
    const node = previewRef.current;
    (async () => {
      /* DOM이 완전히 렌더되고 차트가 그려질 시간을 잠깐 줌 */
      await new Promise((r) => setTimeout(r, 200));
      try {
        const filename = `리포트_${data.student.name}_${report.fromDate}_${report.toDate}.pdf`;
        await exportElementToPDF(node, filename);
        toast.success("PDF가 생성되었습니다.");
      } catch (err) {
        console.error(err);
        toast.error("PDF 생성에 실패했습니다.");
      } finally {
        setData(null);
        setBusy(false);
      }
    })();
  }, [data, report.fromDate, report.toDate]);

  return (
    <>
      <Button size="sm" variant="outline" onClick={start} disabled={busy}>
        <Download className="size-3.5" />
        {busy ? "생성 중…" : "PDF"}
      </Button>
      {data && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: "-99999px",
            top: 0,
            pointerEvents: "none",
            opacity: 0,
          }}
        >
          <ReportPreview
            ref={previewRef}
            student={data.student}
            sessions={data.sessions}
            stats={data.stats}
            fromDate={report.fromDate}
            toDate={report.toDate}
            comment={report.comment}
          />
        </div>
      )}
    </>
  );
}
