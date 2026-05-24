"use client";

import { useEffect, useState } from "react";
import { Plus, BellRing } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NotificationList } from "@/components/notifications/notification-list";
import { TemplateEditor } from "@/components/notifications/template-editor";
import { NotificationFormDialog } from "@/components/notifications/notification-form";
import {
  isNotificationApiSupported,
  notificationPermission,
  requestNotificationPermission,
  startNotificationScheduler,
} from "@/lib/notifications";
import { ensureDefaultTemplates } from "@/lib/repositories/notifications";

export default function NotificationsPage() {
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<string>("default");

  useEffect(() => {
    void ensureDefaultTemplates();
    setPermission(notificationPermission());
    const stop = startNotificationScheduler();
    return () => stop();
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">알림</h1>
          <p className="text-muted-foreground text-sm">
            과제·수업 알림을 예약하고 메시지 템플릿을 관리합니다.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> 새 알림 예약
        </Button>
      </header>

      {isNotificationApiSupported() && permission !== "granted" && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BellRing className="size-5 text-muted-foreground" />
            <div className="flex-1 text-sm">
              브라우저 알림 권한을 허용하면 예약된 시각에 자동 알림이 표시됩니다.
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const r = await requestNotificationPermission();
                setPermission(r);
                if (r === "granted") toast.success("알림 권한이 허용되었습니다.");
              }}
            >
              권한 요청
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="scheduled">
        <TabsList>
          <TabsTrigger value="scheduled">예약됨</TabsTrigger>
          <TabsTrigger value="sent">발송 이력</TabsTrigger>
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="templates">템플릿</TabsTrigger>
        </TabsList>
        <TabsContent value="scheduled" className="mt-4">
          <NotificationList status="scheduled" />
        </TabsContent>
        <TabsContent value="sent" className="mt-4">
          <NotificationList status="sent" />
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          <NotificationList />
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
          <TemplateEditor />
        </TabsContent>
      </Tabs>

      <NotificationFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
