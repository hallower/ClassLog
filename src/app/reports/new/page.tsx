"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDB } from "@/lib/db";
import { pickRecentSessions, pickSessionsInRange, summarizeSessions } from "@/lib/reports";
import { createReport } from "@/lib/repositories/reports";
import { exportElementToPDF } from "@/lib/pdf";
import { ReportPreview } from "@/components/reports/report-preview";
import type { ReportPeriod } from "@/types/models";

export default function NewReportPage() {
  const [studentId, setStudentId] = useState<string>("");
  const [period, setPeriod] = useState<ReportPeriod>("4");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [comment, setComment] = useState("");
  const [exporting, setExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const students = useLiveQuery(async () => {
    const arr = await getDB().students.toArray();
    return arr.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, []);

  const allSessions = useLiveQuery(
    async () => (studentId ? getDB().sessions.where("studentId").equals(studentId).toArray() : []),
    [studentId],
  );

  const student = students?.find((s) => s.id === studentId);

  /* 기간 자동 계산: 4회 또는 8회 선택 시 최근 N회의 날짜 범위로 설정 */
  useEffect(() => {
    if (!allSessions || allSessions.length === 0) return;
    if (period === "custom") return;
    const count = Number(period);
    const recent = pickRecentSessions(allSessions, count);
    if (recent.length === 0) return;
    setFromDate(recent[0].sessionDate);
    setToDate(recent[recent.length - 1].sessionDate);
  }, [period, allSessions]);

  const { sessionsInRange, stats } = useMemo(() => {
    if (!allSessions || !fromDate || !toDate) {
      return { sessionsInRange: [], stats: null };
    }
    const inRange = pickSessionsInRange(allSessions, fromDate, toDate);
    return { sessionsInRange: inRange, stats: summarizeSessions(inRange) };
  }, [allSessions, fromDate, toDate]);

  const canExport = !!student && !!fromDate && !!toDate && sessionsInRange.length > 0;

  const handleExport = async () => {
    if (!previewRef.current || !student) return;
    setExporting(true);
    try {
      await createReport({ studentId: student.id, period, fromDate, toDate, comment });
      const filename = `리포트_${student.name}_${fromDate}_${toDate}.pdf`;
      await exportElementToPDF(previewRef.current, filename);
      toast.success("PDF가 생성되었습니다.");
    } catch (err) {
      console.error(err);
      toast.error("PDF 생성에 실패했습니다.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <header className="space-y-2">
        <Link
          href="/reports"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> 리포트 목록
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">리포트 생성</h1>
        <p className="text-muted-foreground text-sm">학생과 기간을 고른 뒤 미리보기를 PDF로 내려받으세요.</p>
      </header>

      <Card>
        <CardContent className="p-5 grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>학생</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="학생을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {students?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {s.school} {s.grade}
                  </SelectItem>
                ))}
                {students && students.length === 0 && (
                  <SelectItem value="__none" disabled>
                    등록된 학생이 없습니다
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>기간</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">최근 4회 수업</SelectItem>
                <SelectItem value="8">최근 8회 수업</SelectItem>
                <SelectItem value="custom">직접 입력</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>시작일</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setPeriod("custom");
                setFromDate(e.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>종료일</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setPeriod("custom");
                setToDate(e.target.value);
              }}
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label>선생님 코멘트</Label>
            <Textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="이번 기간 학습 태도, 성취도, 다음 기간 학습 계획 등을 자유롭게 작성해주세요."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {studentId
            ? `이 기간 ${sessionsInRange.length}건의 수업 기록이 포함됩니다.`
            : "학생을 선택하면 미리보기가 표시됩니다."}
        </div>
        <Button onClick={handleExport} disabled={!canExport || exporting}>
          <Download className="size-4" /> {exporting ? "생성 중…" : "PDF 다운로드"}
        </Button>
      </div>

      {/* 미리보기 — 항상 794px 폭으로 렌더링하되 작은 화면에서는 가로 스크롤 */}
      {student && stats && fromDate && toDate ? (
        <div className="overflow-auto rounded-md border bg-zinc-50 p-4">
          <div className="mx-auto">
            <ReportPreview
              ref={previewRef}
              student={student}
              sessions={sessionsInRange}
              stats={stats}
              fromDate={fromDate}
              toDate={toDate}
              comment={comment}
            />
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground space-y-2">
            <FileText className="size-8 mx-auto text-muted-foreground" />
            <p className="text-sm">학생과 기간을 선택하면 리포트가 여기 표시됩니다.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
