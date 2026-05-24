import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { StudentForm } from "@/components/students/student-form";

export default function NewStudentPage() {
  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
      <header className="space-y-2">
        <Link
          href="/students"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> 학생 목록
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">학생 등록</h1>
        <p className="text-muted-foreground text-sm">이름·학교·학년만 입력하면 시작할 수 있습니다.</p>
      </header>
      <StudentForm />
    </div>
  );
}
