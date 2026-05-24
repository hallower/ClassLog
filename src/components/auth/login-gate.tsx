"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkAuth, login } from "@/lib/sync/client";

interface State {
  loading: boolean;
  authRequired: boolean;
  authed: boolean;
  syncEnabled: boolean;
}

export function LoginGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({
    loading: true,
    authRequired: false,
    authed: true,
    syncEnabled: false,
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    try {
      const r = await checkAuth();
      setState({ loading: false, ...r });
    } catch {
      setState({ loading: false, authRequired: false, authed: true, syncEnabled: false });
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-svh flex items-center justify-center text-muted-foreground">
        <Loader2 className="size-4 animate-spin mr-2" /> 불러오는 중…
      </div>
    );
  }

  /* 비밀번호 미설정 (개발 모드) 또는 이미 인증됨 → 그대로 표시 */
  if (!state.authRequired || state.authed) {
    return <>{children}</>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { ok, error: err } = await login(password);
      if (!ok) {
        setError(err ?? "로그인에 실패했습니다.");
        return;
      }
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-svh flex items-center justify-center px-4 bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="size-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">클래스로그 로그인</CardTitle>
          <p className="text-xs text-muted-foreground">
            비밀번호를 입력하시면 이 기기에서 자동 로그인 됩니다.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">비밀번호</Label>
              <Input
                id="password"
                type="password"
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting || !password.trim()}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : "로그인"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
