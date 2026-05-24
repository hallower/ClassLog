"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { seedIfEmpty } from "@/lib/dev/seed";

/**
 * 개발 모드 첫 부팅 시 한 번만 테스트 데이터를 채워 넣음.
 * 프로덕션 빌드에서는 노옵.
 * 한 번 시드 후에는 settings 플래그로 재실행 차단.
 * 데이터 리셋하려면 설정 → 전체 데이터 삭제.
 */
export function SeedBootstrap() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (async () => {
      try {
        const did = await seedIfEmpty();
        if (did) {
          console.info("[ClassLog] 테스트 데이터가 시드되었습니다.");
          toast.success("테스트 데이터가 자동으로 채워졌습니다.", { duration: 4000 });
        }
      } catch (err) {
        console.error("[ClassLog] 시드 실패:", err);
        toast.error(
          `테스트 데이터 시드 실패: ${err instanceof Error ? err.message : String(err)}`,
          { duration: 8000 },
        );
      }
    })();
  }, []);
  return null;
}
