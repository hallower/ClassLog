"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadBackupAsFile, importBackupFromFile } from "@/lib/sync/backup";

export function BackupCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">데이터 백업 / 복원 (수동)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          전체 데이터를 JSON 파일로 내보내거나, 백업 파일에서 복원합니다.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await downloadBackupAsFile();
                toast.success("백업 파일이 저장되었습니다.");
              } catch (err) {
                console.error(err);
                toast.error("백업에 실패했습니다.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <Download className="size-4" /> JSON으로 내보내기
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" /> JSON에서 복원
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const ok = confirm(
                "복원하면 현재 데이터가 백업 파일의 내용으로 대체됩니다. 계속할까요?",
              );
              if (!ok) {
                if (fileRef.current) fileRef.current.value = "";
                return;
              }
              setBusy(true);
              try {
                const { imported } = await importBackupFromFile(file, "replace");
                const total = Object.values(imported).reduce((a, b) => a + b, 0);
                toast.success(`${total}건 복원되었습니다.`);
              } catch (err) {
                console.error(err);
                toast.error("복원에 실패했습니다.");
              } finally {
                setBusy(false);
                if (fileRef.current) fileRef.current.value = "";
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
