"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Send, MessageSquare, BellRing, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDB } from "@/lib/db";
import {
  deleteNotification,
  updateNotification,
} from "@/lib/repositories/notifications";
import {
  channelLabel,
  dispatchNotification,
  smsUri,
  isNotificationApiSupported,
  notificationPermission,
  requestNotificationPermission,
} from "@/lib/notifications";
import { formatDateTime } from "@/lib/utils";
import type { NotificationRecord, NotificationStatus } from "@/types/models";

const STATUS_LABEL: Record<NotificationStatus, string> = {
  scheduled: "예약",
  sent: "발송됨",
  canceled: "취소",
  failed: "실패",
};

const STATUS_ICON: Record<NotificationStatus, React.ReactNode> = {
  scheduled: <Clock className="size-3.5" />,
  sent: <CheckCircle className="size-3.5" />,
  canceled: <XCircle className="size-3.5" />,
  failed: <XCircle className="size-3.5" />,
};

export function NotificationList({ status }: { status?: NotificationStatus }) {
  const data = useLiveQuery(async () => {
    const db = getDB();
    const [all, students] = await Promise.all([db.notifications.toArray(), db.students.toArray()]);
    const studentById = new Map(students.map((s) => [s.id, s]));
    const filtered = status ? all.filter((n) => n.status === status) : all;
    filtered.sort((a, b) => (a.scheduledFor < b.scheduledFor ? 1 : -1));
    return { items: filtered, studentById };
  }, [status]);

  if (data === undefined) return <div className="h-32 rounded-md bg-muted animate-pulse" />;
  if (data.items.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          {status === "scheduled"
            ? "예약된 알림이 없습니다."
            : status === "sent"
              ? "발송 이력이 없습니다."
              : "표시할 알림이 없습니다."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {data.items.map((n) => {
        const student = n.studentId ? data.studentById.get(n.studentId) : undefined;
        return (
          <NotificationCard
            key={n.id}
            notif={n}
            studentName={student?.name}
            phone={student?.phone}
          />
        );
      })}
    </div>
  );
}

function NotificationCard({
  notif,
  studentName,
  phone,
}: {
  notif: NotificationRecord;
  studentName?: string;
  phone?: string;
}) {
  const isScheduled = notif.status === "scheduled";

  const sendNow = async () => {
    if (notif.channel === "push") {
      if (!isNotificationApiSupported()) {
        toast.error("이 환경은 브라우저 알림을 지원하지 않습니다.");
        return;
      }
      if (notificationPermission() !== "granted") {
        const r = await requestNotificationPermission();
        if (r !== "granted") {
          toast.error("알림 권한이 거부되었습니다.");
          return;
        }
      }
      const ok = await dispatchNotification(notif, {
        title: studentName ? `ClassLog · ${studentName}` : "ClassLog",
      });
      if (ok) toast.success("알림이 발송되었습니다.");
      else toast.error("발송 실패");
    } else if (notif.channel === "sms") {
      const uri = smsUri(phone, notif.body);
      window.location.href = uri;
      await updateNotification(notif.id, { status: "sent", sentAt: Date.now() });
      toast.success("SMS 앱을 호출했습니다.");
    }
  };

  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div className="size-9 rounded-md bg-secondary flex items-center justify-center shrink-0">
          {notif.channel === "push" ? (
            <BellRing className="size-4" />
          ) : (
            <MessageSquare className="size-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px]">
              {channelLabel(notif.channel)}
            </Badge>
            <Badge variant="secondary" className="text-[10px] gap-1">
              {STATUS_ICON[notif.status]}
              {STATUS_LABEL[notif.status]}
            </Badge>
            {studentName && <span className="text-xs text-muted-foreground">→ {studentName}</span>}
            <span className="text-xs text-muted-foreground ml-auto">
              {formatDateTime(notif.scheduledFor)}
            </span>
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap line-clamp-3">{notif.body}</p>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          {isScheduled && (
            <Button size="sm" onClick={sendNow}>
              <Send className="size-3.5" /> 지금 발송
            </Button>
          )}
          {isScheduled && (
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await updateNotification(notif.id, { status: "canceled" });
                toast.success("예약이 취소되었습니다.");
              }}
            >
              취소
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              if (!confirm("이 알림 기록을 삭제할까요?")) return;
              await deleteNotification(notif.id);
              toast.success("삭제되었습니다.");
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
