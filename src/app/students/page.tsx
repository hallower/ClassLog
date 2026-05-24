"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { getDB } from "@/lib/db";
import { StudentAvatar } from "@/components/students/student-avatar";
import { formatSchedule } from "@/lib/schedule";
import type { Student, StudentStatus } from "@/types/models";

const STATUS_LABEL: Record<StudentStatus, string> = {
  active: "재원",
  paused: "중단",
  ended: "종료",
};

const STATUS_VARIANT: Record<StudentStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  paused: "secondary",
  ended: "outline",
};

export default function StudentsPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | StudentStatus>("all");

  const students = useLiveQuery(async () => {
    const list = await getDB().students.toArray();
    return list.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, []);

  const filtered = useMemo(() => {
    if (!students) return [];
    let arr = students;
    if (tab !== "all") arr = arr.filter((s) => s.status === tab);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      arr = arr.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.school.toLowerCase().includes(q) ||
          s.grade.toLowerCase().includes(q),
      );
    }
    return arr;
  }, [students, query, tab]);

  const counts = useMemo(() => {
    const c: Record<"all" | StudentStatus, number> = { all: 0, active: 0, paused: 0, ended: 0 };
    students?.forEach((s) => {
      c.all++;
      c[s.status]++;
    });
    return c;
  }, [students]);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">학생</h1>
          <p className="text-muted-foreground text-sm">
            전체 {counts.all}명 · 재원 {counts.active} · 중단 {counts.paused} · 종료 {counts.ended}
          </p>
        </div>
        <Button asChild>
          <Link href="/students/new">
            <Plus className="size-4" /> 학생 등록
          </Link>
        </Button>
      </header>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름 / 학교 / 학년으로 검색"
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="all">전체 ({counts.all})</TabsTrigger>
          <TabsTrigger value="active">재원 ({counts.active})</TabsTrigger>
          <TabsTrigger value="paused">중단 ({counts.paused})</TabsTrigger>
          <TabsTrigger value="ended">종료 ({counts.ended})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {students === undefined ? (
            <ListSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState empty={counts.all === 0} />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => (
                <StudentCardItem key={s.id} student={s} />
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StudentCardItem({ student }: { student: Student }) {
  return (
    <li>
      <Link href={`/students/${student.id}`}>
        <Card className="hover:bg-accent/40 transition-colors cursor-pointer">
          <CardContent className="flex items-center gap-3 p-4">
            <StudentAvatar name={student.name} image={student.profileImage} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold truncate">{student.name}</span>
                <Badge variant={STATUS_VARIANT[student.status]} className="text-[10px]">
                  {STATUS_LABEL[student.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {student.school} · {student.grade}
              </p>
              {student.schedule && student.schedule.length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {formatSchedule(student.schedule)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </li>
  );
}

function ListSkeleton() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3].map((i) => (
        <li key={i}>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="size-12 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                <div className="h-3 w-32 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ empty }: { empty: boolean }) {
  return (
    <Card>
      <CardContent className="py-12 flex flex-col items-center text-center gap-3">
        <div className="size-14 rounded-full bg-secondary flex items-center justify-center">
          <Users className="size-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{empty ? "아직 등록된 학생이 없습니다" : "조건에 맞는 학생이 없습니다"}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {empty ? "오른쪽 위 \"학생 등록\" 버튼으로 첫 학생을 추가해보세요." : "검색어나 필터를 바꿔 보세요."}
          </p>
        </div>
        {empty && (
          <Button asChild>
            <Link href="/students/new">
              <Plus className="size-4" /> 학생 등록
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
