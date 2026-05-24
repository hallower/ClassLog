"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfileImagePicker } from "@/components/students/profile-image-picker";
import { ScheduleInput } from "@/components/students/schedule-input";
import { createStudent, updateStudent, deleteStudent } from "@/lib/repositories/students";
import type { Student, ScheduleSlot } from "@/types/models";

const scheduleSlotSchema = z.object({
  dayOfWeek: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]),
  time: z.string().regex(/^\d{2}:\d{2}$/, "시간 형식이 올바르지 않습니다."),
});

const schema = z.object({
  name: z.string().trim().min(1, "이름을 입력하세요."),
  school: z.string().trim().min(1, "학교명을 입력하세요."),
  grade: z.string().trim().min(1, "학년을 입력하세요."),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  kakaoId: z.string().trim().optional(),
  status: z.enum(["active", "paused", "ended"]),
  profileImage: z.string().nullable().optional(),
  memo: z.string().trim().optional(),
  schedule: z.array(scheduleSlotSchema).default([]),
});

type FormValues = z.infer<typeof schema>;

export function StudentForm({ initial }: { initial?: Student }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const editing = !!initial;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      school: initial?.school ?? "",
      grade: initial?.grade ?? "",
      address: initial?.address ?? "",
      phone: initial?.phone ?? "",
      kakaoId: initial?.kakaoId ?? "",
      status: initial?.status ?? "active",
      profileImage: initial?.profileImage ?? null,
      memo: initial?.memo ?? "",
      schedule: (initial?.schedule ?? []) as ScheduleSlot[],
    },
  });

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        name: data.name.trim(),
        school: data.school.trim(),
        grade: data.grade.trim(),
        address: data.address?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        kakaoId: data.kakaoId?.trim() || undefined,
        status: data.status,
        profileImage: data.profileImage ?? undefined,
        memo: data.memo?.trim() || undefined,
        schedule: data.schedule.length > 0 ? data.schedule : undefined,
      };
      if (editing) {
        await updateStudent(initial!.id, payload);
        toast.success("학생 정보가 수정되었습니다.");
        router.push(`/students/${initial!.id}`);
      } else {
        const s = await createStudent(payload);
        toast.success(`${s.name} 학생이 등록되었습니다.`);
        router.push(`/students/${s.id}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!initial) return;
    if (!confirm(`${initial.name} 학생과 모든 수업 기록을 삭제합니다. 계속할까요?`)) return;
    setSubmitting(true);
    try {
      await deleteStudent(initial.id);
      toast.success("학생이 삭제되었습니다.");
      router.push("/students");
    } catch (err) {
      console.error(err);
      toast.error("삭제에 실패했습니다.");
      setSubmitting(false);
    }
  };

  const profileImage = form.watch("profileImage");
  const nameVal = form.watch("name");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>프로필</Label>
        <ProfileImagePicker
          value={profileImage}
          name={nameVal}
          onChange={(v) => form.setValue("profileImage", v, { shouldDirty: true })}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="이름" required>
          <Input autoFocus {...form.register("name")} placeholder="홍길동" />
          <FieldError message={form.formState.errors.name?.message} />
        </Field>
        <Field label="상태" required>
          <Select
            value={form.watch("status")}
            onValueChange={(v) =>
              form.setValue("status", v as FormValues["status"], { shouldDirty: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="상태 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">재원</SelectItem>
              <SelectItem value="paused">중단</SelectItem>
              <SelectItem value="ended">종료</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="학교" required>
          <Input {...form.register("school")} placeholder="○○고등학교" />
          <FieldError message={form.formState.errors.school?.message} />
        </Field>
        <Field label="학년" required>
          <Input {...form.register("grade")} placeholder="고2" />
          <FieldError message={form.formState.errors.grade?.message} />
        </Field>
        <Field label="전화번호">
          <Input {...form.register("phone")} placeholder="010-0000-0000" inputMode="tel" />
        </Field>
        <Field label="카카오톡 ID">
          <Input {...form.register("kakaoId")} placeholder="(선택)" />
        </Field>
        <Field label="주소" className="md:col-span-2">
          <Input
            {...form.register("address")}
            placeholder="네이버/카카오맵으로 바로 찾아갈 수 있어요"
          />
        </Field>
        <Field label="수업 일정" className="md:col-span-2">
          <ScheduleInput
            value={form.watch("schedule") ?? []}
            onChange={(next) =>
              form.setValue("schedule", next, { shouldDirty: true, shouldValidate: true })
            }
          />
        </Field>
        <Field label="비고" className="md:col-span-2">
          <Textarea rows={3} {...form.register("memo")} placeholder="학습 성향, 가족 사항 등 자유 메모" />
        </Field>
      </div>

      <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-3">
        {editing ? (
          <Button type="button" variant="destructive" onClick={onDelete} disabled={submitting}>
            학생 삭제
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={submitting}
          >
            취소
          </Button>
          <Button type="submit" disabled={submitting}>
            {editing ? "저장" : "등록"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
