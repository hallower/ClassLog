"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StudentForm } from "@/components/students/student-form";
import { getDB } from "@/lib/db";

export default function EditStudentPage() {
  const params = useParams<{ id: string }>();
  const student = useLiveQuery(async () => getDB().students.get(params.id), [params.id]);

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
      <header className="space-y-2">
        <Link
          href={`/students/${params.id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> 학생 상세
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">학생 정보 수정</h1>
      </header>

      {student === undefined ? (
        <div className="h-64 rounded-md bg-muted animate-pulse" />
      ) : !student ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            존재하지 않는 학생입니다.
          </CardContent>
        </Card>
      ) : (
        <StudentForm initial={student} />
      )}
    </div>
  );
}
