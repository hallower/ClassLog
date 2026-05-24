"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Cloud,
  CloudOff,
  ArrowUpFromLine,
  ArrowDownToLine,
  RefreshCw,
  Save,
  LogIn,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  getDriveClientId,
  setDriveClientId,
  getLastSyncedAt,
  syncWithDrive,
  signInToDrive,
  signOutDrive,
  isClientIdFromEnv,
  isSignedInToDrive,
} from "@/lib/sync/drive";
import { formatDateTime } from "@/lib/utils";

type SyncMode = "auto" | "push" | "pull";

export function DriveCard() {
  const envManaged = isClientIdFromEnv();
  const [clientIdInput, setClientIdInput] = useState("");
  const [savingId, setSavingId] = useState(false);
  const [syncing, setSyncing] = useState<null | SyncMode>(null);
  const [signedIn, setSignedIn] = useState(false);

  const stored = useLiveQuery(async () => {
    const [clientId, lastSyncedAt] = await Promise.all([getDriveClientId(), getLastSyncedAt()]);
    return { clientId, lastSyncedAt };
  }, []);

  useEffect(() => {
    if (!envManaged && stored?.clientId) setClientIdInput(stored.clientId);
  }, [envManaged, stored?.clientId]);

  useEffect(() => {
    setSignedIn(isSignedInToDrive());
  }, []);

  const configured = !!stored?.clientId;

  const saveClientId = async () => {
    setSavingId(true);
    try {
      const v = clientIdInput.trim();
      await setDriveClientId(v || null);
      toast.success(v ? "Client ID가 저장되었습니다." : "Client ID가 제거되었습니다.");
      if (!v) signOutDrive();
    } catch (err) {
      console.error(err);
      toast.error("저장 실패");
    } finally {
      setSavingId(false);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInToDrive();
      setSignedIn(true);
      toast.success("구글 계정에 연결되었습니다.");
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "로그인 실패";
      toast.error(msg);
    }
  };

  const handleSignOut = () => {
    signOutDrive();
    setSignedIn(false);
    toast.success("연결이 해제되었습니다.");
  };

  const runSync = async (mode: SyncMode) => {
    setSyncing(mode);
    try {
      const result = await syncWithDrive(mode === "auto" ? undefined : { force: mode });
      setSignedIn(true);
      toast.success(result.message);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "동기화 실패";
      toast.error(msg);
    } finally {
      setSyncing(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {configured ? <Cloud className="size-4" /> : <CloudOff className="size-4" />}
          Google Drive 동기화
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          본인 Google 계정의 Drive에 <code className="text-xs bg-muted px-1 rounded">classlog-db.json</code> 파일 하나로
          전체 데이터를 동기화합니다. 다른 기기에서도 같은 구글 계정으로 로그인하면 자동으로 같은 파일을 사용합니다.
        </p>

        {envManaged ? (
          <div className="space-y-3">
            <div className="rounded-md border bg-muted/30 p-3 text-xs leading-relaxed">
              <p>
                별도 설정 없이 <strong>구글 로그인 한 번</strong>으로 동기화할 수 있습니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {signedIn ? (
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="size-4" /> 로그아웃
                </Button>
              ) : (
                <Button onClick={handleSignIn}>
                  <LogIn className="size-4" /> 구글로 로그인
                </Button>
              )}
              <Button onClick={() => runSync("auto")} disabled={syncing !== null}>
                <RefreshCw className={`size-4 ${syncing === "auto" ? "animate-spin" : ""}`} />
                지금 동기화
              </Button>
              <Button
                variant="outline"
                onClick={() => runSync("push")}
                disabled={syncing !== null}
              >
                <ArrowUpFromLine className="size-4" /> 강제 업로드
              </Button>
              <Button
                variant="outline"
                onClick={() => runSync("pull")}
                disabled={syncing !== null}
              >
                <ArrowDownToLine className="size-4" /> 강제 다운로드
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-xs leading-relaxed">
              <p className="font-medium">자체 호스팅 안내</p>
              <p className="text-muted-foreground">
                기본 권장은 배포 시 <code className="bg-background px-1 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> 환경변수를 미리 넣어두는 방식입니다. 그러면 선생님은 입력 없이 "구글로 로그인"만 누르시면 됩니다.
              </p>
              <p className="font-medium pt-2">직접 등록하시는 경우</p>
              <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>
                  <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="underline">Google Cloud Console</a>에서 프로젝트 생성
                </li>
                <li>"API 및 서비스 → 사용자 인증 정보"에서 OAuth 클라이언트 ID(웹 애플리케이션) 생성</li>
                <li>승인된 JavaScript 원본에 현재 도메인(예: <code className="bg-background px-1 rounded">http://localhost:3000</code>) 추가</li>
                <li>"Google Drive API" 사용 설정 + OAuth 동의 화면에서 본인 이메일을 테스트 사용자에 추가</li>
                <li>발급된 Client ID를 아래 입력 후 저장</li>
              </ol>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">OAuth Client ID</Label>
              <div className="flex gap-2">
                <Input
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="xxxxxxxxxxxx.apps.googleusercontent.com"
                />
                <Button size="sm" onClick={saveClientId} disabled={savingId}>
                  <Save className="size-4" /> 저장
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => runSync("auto")} disabled={!configured || syncing !== null}>
                <RefreshCw className={`size-4 ${syncing === "auto" ? "animate-spin" : ""}`} />
                지금 동기화
              </Button>
              <Button
                variant="outline"
                onClick={() => runSync("push")}
                disabled={!configured || syncing !== null}
              >
                <ArrowUpFromLine className="size-4" /> 강제 업로드
              </Button>
              <Button
                variant="outline"
                onClick={() => runSync("pull")}
                disabled={!configured || syncing !== null}
              >
                <ArrowDownToLine className="size-4" /> 강제 다운로드
              </Button>
              {signedIn && (
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  세션 초기화
                </Button>
              )}
            </div>
          </>
        )}

        <Separator />

        <div className="text-xs text-muted-foreground">
          {signedIn && <span className="text-foreground font-medium mr-2">● 연결됨</span>}
          {stored?.lastSyncedAt
            ? `마지막 동기화: ${formatDateTime(stored.lastSyncedAt)}`
            : "아직 동기화 기록이 없습니다."}
        </div>
      </CardContent>
    </Card>
  );
}
