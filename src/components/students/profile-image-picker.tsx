"use client";

import { useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fileToResizedDataURL, PRESET_AVATARS, getPreset, isPreset } from "@/lib/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ProfileImagePicker({
  value,
  onChange,
  name,
}: {
  value?: string | null;
  onChange: (v: string | null) => void;
  name?: string;
}) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const preset = getPreset(value);
  const initial = name?.trim().slice(0, 1) ?? "?";

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div
          className={cn(
            "size-20 rounded-full overflow-hidden flex items-center justify-center text-2xl font-semibold ring-2 ring-border",
          )}
          style={{ background: preset?.color ?? "oklch(0.92 0 0)" }}
        >
          {!value && <span className="text-muted-foreground">{initial}</span>}
          {preset && <span aria-hidden>{preset.emoji}</span>}
          {value && !isPreset(value) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="프로필" className="size-full object-cover" />
          )}
        </div>
        {value && (
          <button
            type="button"
            aria-label="이미지 제거"
            className="absolute -top-1 -right-1 size-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
            onClick={() => onChange(null)}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline">
            <Camera className="size-4" /> 사진 선택
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로필 이미지</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="preset" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="preset" className="flex-1">캐릭터 프리셋</TabsTrigger>
              <TabsTrigger value="upload" className="flex-1">파일 업로드</TabsTrigger>
            </TabsList>
            <TabsContent value="preset" className="mt-4">
              <div className="grid grid-cols-6 gap-2">
                {PRESET_AVATARS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onChange(`preset:${p.id}`);
                      setOpen(false);
                    }}
                    className={cn(
                      "size-14 rounded-full flex items-center justify-center text-2xl ring-2 ring-transparent hover:ring-primary transition",
                      value === `preset:${p.id}` && "ring-primary",
                    )}
                    style={{ background: p.color }}
                  >
                    <span aria-hidden>{p.emoji}</span>
                    <span className="sr-only">{p.id}</span>
                  </button>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="upload" className="mt-4 space-y-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const dataURL = await fileToResizedDataURL(file, 512);
                    onChange(dataURL);
                    setOpen(false);
                  } catch (err) {
                    toast.error("이미지를 처리하지 못했습니다.");
                    console.error(err);
                  } finally {
                    if (fileRef.current) fileRef.current.value = "";
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-4" /> 파일에서 선택
              </Button>
              <p className="text-xs text-muted-foreground">
                512px 이내로 자동 축소되어 로컬에 저장됩니다.
              </p>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
