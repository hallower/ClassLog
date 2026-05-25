"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Cloud,
  CloudOff,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  checkAuth,
  getLastSyncedAt,
  logout,
  pullFromServer,
  pushToServer,
} from "@/lib/sync/client";
import { formatDateTime } from "@/lib/utils";

export function SyncCard() {
  const [authRequired, setAuthRequired] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [busy, setBusy] = useState<null | "push" | "pull">(null);

  const refresh = async () => {
    try {
      const r = await checkAuth();
      setAuthRequired(r.authRequired);
      setSyncEnabled(r.syncEnabled);
    } catch {
      /* noop */
    }
    setLastSyncedAt(await getLastSyncedAt());
  };

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(id);
  }, []);

  const handlePush = async () => {
    setBusy("push");
    try {
      await pushToServer();
      toast.success("서버에 업로드했습니다.");
      await refresh();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setBusy(null);
    }
  };

  const handlePull = async () => {
    if (!confirm("서버에서 데이터를 가져와 현재 기기 데이터를 대체합니다. 계속할까요?")) return;
    setBusy("pull");
    try {
      const r = await pullFromServer();
      toast.success(r.applied ? "서버 데이터를 가져왔습니다." : "최신 상태입니다.");
      await refresh();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "다운로드 실패");
    } finally {
      setBusy(null);
    }
  };

  const handleLogout = async () => {
    if (!confirm("이 기기에서 로그아웃합니다.")) return;
    await logout();
    location.reload();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {syncEnabled ? <Cloud className="size-4" /> : <CloudOff className="size-4" />}
          클라우드 동기화
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!syncEnabled ? (
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              현재 환경은 로컬 전용으로 동작 중입니다 (Vercel Redis 미설정). 데이터는 이 기기 안에만 저장됩니다.
            </p>
            <p>
              여러 기기에서 동기화하려면 Vercel 프로젝트의 Storage 탭에서 Upstash Redis를 추가하세요.
              연결 시 다음 환경변수가 자동 주입됩니다:
            </p>
            <ul className="list-disc pl-5 text-xs">
              <li><code className="bg-muted px-1 rounded">REDIS_URL</code> (rediss:// 또는 redis://)</li>
              <li>또는 <code className="bg-muted px-1 rounded">UPSTASH_REDIS_REST_URL</code> + <code className="bg-muted px-1 rounded">UPSTASH_REDIS_REST_TOKEN</code></li>
              <li>또는 <code className="bg-muted px-1 rounded">KV_REST_API_URL</code> + <code className="bg-muted px-1 rounded">KV_REST_API_TOKEN</code> (구 KV 방식)</li>
            </ul>
            <p className="text-xs">추가 후 반드시 <strong>Redeploy</strong>해야 적용됩니다.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              평소엔 자동으로 동기화됩니다. 변경 5초 후, 탭을 닫거나 가릴 때, 다시 열 때 자동 push/pull.
              아래 버튼은 수동 강제 실행용입니다.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handlePush}
                disabled={busy !== null}
              >
                <ArrowUpFromLine className="size-4" />
                {busy === "push" ? "업로드 중…" : "지금 업로드"}
              </Button>
              <Button
                variant="outline"
                onClick={handlePull}
                disabled={busy !== null}
              >
                <ArrowDownToLine className="size-4" />
                {busy === "pull" ? "다운로드 중…" : "서버에서 가져오기"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                disabled={busy !== null}
                aria-label="상태 새로고침"
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </>
        )}

        <Separator />

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {lastSyncedAt
              ? `마지막 동기화: ${formatDateTime(lastSyncedAt)}`
              : "아직 동기화 기록이 없습니다."}
          </div>
          {authRequired && (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="size-3.5" /> 로그아웃
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
