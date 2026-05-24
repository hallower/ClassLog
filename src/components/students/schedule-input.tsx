"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DAY_LABELS_FULL, sortSlots } from "@/lib/schedule";
import type { ScheduleSlot } from "@/types/models";

export function ScheduleInput({
  value,
  onChange,
}: {
  value: ScheduleSlot[];
  onChange: (next: ScheduleSlot[]) => void;
}) {
  const sorted = sortSlots(value);

  const update = (idx: number, patch: Partial<ScheduleSlot>) => {
    const next = sorted.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    onChange(next);
  };

  const remove = (idx: number) => {
    onChange(sorted.filter((_, i) => i !== idx));
  };

  const add = () => {
    const next: ScheduleSlot = { dayOfWeek: 1, time: "16:00" };
    onChange([...sorted, next]);
  };

  return (
    <div className="space-y-2">
      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          정기 수업 요일·시간을 추가하세요. 여러 개 등록할 수 있어요 (예: 월/목 16:00).
        </p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((slot, idx) => (
            <li key={idx} className="flex gap-2 items-center">
              <Select
                value={String(slot.dayOfWeek)}
                onValueChange={(v) =>
                  update(idx, { dayOfWeek: Number(v) as ScheduleSlot["dayOfWeek"] })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_LABELS_FULL.map((label, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="time"
                value={slot.time}
                onChange={(e) => update(idx, { time: e.target.value || "00:00" })}
                className="w-32"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(idx)}
                aria-label="삭제"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-4" /> 시간 추가
      </Button>
    </div>
  );
}
