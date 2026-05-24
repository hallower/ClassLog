"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDB } from "@/lib/db";
import { applyTemplate } from "@/lib/notifications";
import { createNotification } from "@/lib/repositories/notifications";
import type { NotificationChannel } from "@/types/models";

function defaultDateTime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset() + 30);
  return d.toISOString().slice(0, 16);
}

export function NotificationFormDialog({
  open,
  onOpenChange,
  initialStudentId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialStudentId?: string;
}) {
  const [studentId, setStudentId] = useState<string | undefined>(initialStudentId);
  const [channel, setChannel] = useState<NotificationChannel>("push");
  const [body, setBody] = useState("");
  const [scheduledFor, setScheduledFor] = useState<string>(defaultDateTime());
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const data = useLiveQuery(async () => {
    const db = getDB();
    const [students, templates] = await Promise.all([
      db.students.toArray(),
      db.messageTemplates.toArray(),
    ]);
    return {
      students: students.sort((a, b) => a.name.localeCompare(b.name, "ko")),
      templates: templates.sort((a, b) => a.name.localeCompare(b.name, "ko")),
    };
  }, []);

  useEffect(() => {
    if (open) {
      setStudentId(initialStudentId);
      setChannel("push");
      setScheduledFor(defaultDateTime());
      setTemplateId(undefined);
      setBody("");
    }
  }, [open, initialStudentId]);

  const student = useMemo(
    () => data?.students.find((s) => s.id === studentId),
    [data, studentId],
  );

  const applyTpl = (id: string) => {
    setTemplateId(id);
    const t = data?.templates.find((x) => x.id === id);
    if (!t) return;
    const next = applyTemplate(t.body, {
      학생: student?.name ?? "",
      학부모: student?.name ? `${student.name} 학부모` : "",
      과제: "",
      시간: "",
    });
    setBody(next);
  };

  const submit = async () => {
    if (!body.trim()) {
      toast.error("내용을 입력하세요.");
      return;
    }
    if (!scheduledFor) {
      toast.error("발송 일시를 입력하세요.");
      return;
    }
    setSubmitting(true);
    try {
      const iso = new Date(scheduledFor).toISOString();
      await createNotification({
        studentId,
        channel,
        body,
        scheduledFor: iso,
      });
      toast.success("알림이 예약되었습니다.");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>알림 예약</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Row label="대상 학생">
            <Select value={studentId ?? ""} onValueChange={(v) => setStudentId(v || undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="(선택) 학생 연결" />
              </SelectTrigger>
              <SelectContent>
                {data?.students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>

          <Row label="발송 채널">
            <Select value={channel} onValueChange={(v) => setChannel(v as NotificationChannel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="push">앱 푸시 (브라우저 알림)</SelectItem>
                <SelectItem value="sms">SMS — 기기 메시지 앱 호출</SelectItem>
                <SelectItem value="kakao" disabled>
                  카카오 알림톡 (추후 지원)
                </SelectItem>
              </SelectContent>
            </Select>
          </Row>

          <Row label="발송 일시">
            <Input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
            />
          </Row>

          <Row label="템플릿 적용">
            <Select value={templateId ?? ""} onValueChange={(v) => applyTpl(v)}>
              <SelectTrigger>
                <SelectValue placeholder="(선택)" />
              </SelectTrigger>
              <SelectContent>
                {data?.templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
                {data && data.templates.length === 0 && (
                  <SelectItem value="__none" disabled>
                    등록된 템플릿이 없습니다
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </Row>

          <Row label="내용" full>
            <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">
              치환자 예: {"{학생}"}, {"{학부모}"}, {"{과제}"}
            </p>
          </Row>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>취소</Button>
          <Button onClick={submit} disabled={submitting}>예약</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "" : ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
