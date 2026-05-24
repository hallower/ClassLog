"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { checkAuth, pullFromServer, pushToServer } from "@/lib/sync/client";
import { subscribeDirty } from "@/lib/sync/dirty";

const PUSH_DEBOUNCE_MS = 5_000;
const PULL_INTERVAL_MS = 5 * 60 * 1_000; /* 5분 백그라운드 polling */
const PULL_ON_FOCUS_THROTTLE_MS = 30_000; /* 포커스 복귀 시 30초 이상 지났을 때만 pull */

/** 앱 전체에서 한 번만 마운트. 동기화 4대 트리거 일괄 관리. */
export function AutoSync() {
  const enabledRef = useRef<boolean>(false);
  const pushTimerRef = useRef<number | null>(null);
  const pendingPushRef = useRef<boolean>(false);
  const lastPullAtRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const auth = await checkAuth();
        if (cancelled) return;
        enabledRef.current = auth.authed && auth.syncEnabled;
        if (!enabledRef.current) return;

        /* 트리거 1: 앱 첫 로드 → pull */
        await safePull();

        /* 트리거 2: 데이터 변경 → 5초 debounce push */
        const unsub = subscribeDirty(() => {
          scheduleDebouncedPush();
        });

        /* 트리거 3: 탭이 가려질 때 즉시 push.  보일 때 pull */
        const onVisibility = () => {
          if (document.visibilityState === "hidden") {
            flushPush();
          } else {
            if (Date.now() - lastPullAtRef.current > PULL_ON_FOCUS_THROTTLE_MS) {
              void safePull();
            }
          }
        };
        document.addEventListener("visibilitychange", onVisibility);

        /* 트리거 4: 5분마다 백그라운드 pull */
        const pollId = window.setInterval(() => {
          if (document.visibilityState === "visible") void safePull();
        }, PULL_INTERVAL_MS);

        return () => {
          unsub();
          document.removeEventListener("visibilitychange", onVisibility);
          window.clearInterval(pollId);
        };
      } catch (err) {
        console.warn("[AutoSync] init failed:", err);
      }
    };

    const cleanupPromise = init();

    return () => {
      cancelled = true;
      void cleanupPromise.then((cleanup) => cleanup?.());
      if (pushTimerRef.current !== null) {
        window.clearTimeout(pushTimerRef.current);
        pushTimerRef.current = null;
      }
    };
  }, []);

  const scheduleDebouncedPush = () => {
    if (!enabledRef.current) return;
    pendingPushRef.current = true;
    if (pushTimerRef.current !== null) {
      window.clearTimeout(pushTimerRef.current);
    }
    pushTimerRef.current = window.setTimeout(() => {
      pushTimerRef.current = null;
      void safePush();
    }, PUSH_DEBOUNCE_MS);
  };

  const flushPush = () => {
    if (!enabledRef.current) return;
    if (pushTimerRef.current !== null) {
      window.clearTimeout(pushTimerRef.current);
      pushTimerRef.current = null;
    }
    if (pendingPushRef.current) {
      void safePush();
    }
  };

  const safePush = async () => {
    if (!enabledRef.current) return;
    try {
      pendingPushRef.current = false;
      await pushToServer();
    } catch (err) {
      console.warn("[AutoSync] push failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "unauthorized") {
        toast.error("세션이 만료되었습니다. 다시 로그인해주세요.", { duration: 6000 });
      } else if (msg !== "sync_disabled") {
        toast.error("동기화에 실패했습니다. 잠시 후 다시 시도됩니다.", { duration: 4000 });
      }
      /* 실패 시 펜딩 표시 유지해서 다음 트리거에 재시도 */
      pendingPushRef.current = true;
    }
  };

  const safePull = async () => {
    if (!enabledRef.current) return;
    try {
      lastPullAtRef.current = Date.now();
      const r = await pullFromServer();
      if (r.applied) {
        toast.message("다른 기기에서 변경된 데이터를 가져왔습니다.", { duration: 4000 });
      }
    } catch (err) {
      console.warn("[AutoSync] pull failed:", err);
    }
  };

  return null;
}
