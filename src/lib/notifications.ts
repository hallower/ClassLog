"use client";

import { updateNotification, findDueScheduledNotifications } from "@/lib/repositories/notifications";
import type { NotificationChannel, NotificationRecord } from "@/types/models";

export function isNotificationApiSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationApiSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isNotificationApiSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  const result = await Notification.requestPermission();
  return result;
}

/* 메시지 템플릿 치환: {학생} {학부모} {과제} {시간} 등을 실제 값으로 교체 */
export function applyTemplate(body: string, ctx: Record<string, string>): string {
  return body.replace(/\{([^}]+)\}/g, (_, key: string) => ctx[key.trim()] ?? `{${key}}`);
}

/* SMS 앱 호출용 URI (모바일 기기에서 동작) */
export function smsUri(phone: string | undefined, body: string): string {
  const cleanPhone = (phone ?? "").replace(/[^0-9+]/g, "");
  const encoded = encodeURIComponent(body);
  return cleanPhone ? `sms:${cleanPhone}?body=${encoded}` : `sms:?body=${encoded}`;
}

export async function sendBrowserNotification(title: string, body: string): Promise<boolean> {
  if (!isNotificationApiSupported()) return false;
  if (Notification.permission !== "granted") {
    const r = await requestNotificationPermission();
    if (r !== "granted") return false;
  }
  try {
    new Notification(title, { body, icon: "/icon.svg" });
    return true;
  } catch {
    return false;
  }
}

export async function dispatchNotification(record: NotificationRecord, opts?: { title?: string }): Promise<boolean> {
  let ok = true;
  const title = opts?.title ?? "ClassLog 알림";
  if (record.channel === "push") {
    ok = await sendBrowserNotification(title, record.body);
  }
  /* sms/kakao는 사용자 액션이 필요하므로 디스패처는 상태만 갱신 */
  await updateNotification(record.id, {
    status: ok ? "sent" : "failed",
    sentAt: Date.now(),
  });
  return ok;
}

export function channelLabel(c: NotificationChannel): string {
  if (c === "push") return "앱 푸시";
  if (c === "sms") return "SMS";
  return "카카오톡";
}

/* 주기적으로 due 알림을 검사 후 push만 자동 발송. SMS/카카오는 사용자가 직접 처리 */
export function startNotificationScheduler() {
  if (typeof window === "undefined") return () => {};
  let timer: number | undefined;
  const tick = async () => {
    try {
      const now = new Date().toISOString();
      const due = await findDueScheduledNotifications(now);
      for (const n of due) {
        if (n.channel === "push") {
          await dispatchNotification(n);
        }
      }
    } catch (err) {
      console.error("notification scheduler error", err);
    }
  };
  void tick();
  timer = window.setInterval(tick, 30_000);
  return () => {
    if (timer !== undefined) window.clearInterval(timer);
  };
}
