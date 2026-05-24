"use client";

import { useEffect, useState } from "react";
import { BellRing, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DriveCard } from "@/components/settings/drive-card";
import { BackupCard } from "@/components/settings/backup-card";
import {
  isNotificationApiSupported,
  notificationPermission,
  requestNotificationPermission,
} from "@/lib/notifications";
import { getDB } from "@/lib/db";

export default function SettingsPage() {
  const [permission, setPermission] = useState<string>("default");

  useEffect(() => {
    setPermission(notificationPermission());
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">설정</h1>
        <p className="text-muted-foreground text-sm">데이터 백업·동기화·알림 권한을 관리합니다.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">동기화</h2>
        <DriveCard />
        <BackupCard />
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">알림</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BellRing className="size-4" /> 브라우저 알림 권한
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {isNotificationApiSupported()
                ? `현재 권한 상태: ${labelOf(permission)}`
                : "이 환경은 브라우저 알림을 지원하지 않습니다."}
            </p>
            {isNotificationApiSupported() && permission !== "granted" && (
              <Button
                variant="outline"
                onClick={async () => {
                  const r = await requestNotificationPermission();
                  setPermission(r);
                  if (r === "granted") toast.success("알림 권한이 허용되었습니다.");
                }}
              >
                권한 요청
              </Button>
            )}
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">위험 영역</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <Trash2 className="size-4" /> 전체 데이터 삭제
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              모든 학생·수업·과제·알림 기록을 영구 삭제합니다. 복원할 수 없습니다.
            </p>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!confirm("정말로 모든 데이터를 삭제하시겠습니까?")) return;
                if (!confirm("복구할 수 없습니다. 정말로 진행할까요?")) return;
                try {
                  await getDB().delete();
                  toast.success("전체 데이터가 삭제되었습니다. 페이지를 새로고침합니다.");
                  setTimeout(() => location.reload(), 800);
                } catch (err) {
                  console.error(err);
                  toast.error("삭제 실패");
                }
              }}
            >
              전체 데이터 삭제
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function labelOf(p: string): string {
  if (p === "granted") return "허용됨";
  if (p === "denied") return "거부됨";
  return "미설정";
}
