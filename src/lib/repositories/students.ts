import { getDB } from "@/lib/db";
import { uuid } from "@/lib/utils";
import type { Student, StudentStatus } from "@/types/models";

export async function listStudents(filter?: { status?: StudentStatus | "all"; query?: string }): Promise<Student[]> {
  const db = getDB();
  let collection = db.students.orderBy("name");
  let arr = await collection.toArray();
  if (filter?.status && filter.status !== "all") {
    arr = arr.filter((s) => s.status === filter.status);
  }
  if (filter?.query) {
    const q = filter.query.trim().toLowerCase();
    arr = arr.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.school.toLowerCase().includes(q) ||
        s.grade.toLowerCase().includes(q),
    );
  }
  return arr;
}

export async function getStudent(id: string): Promise<Student | undefined> {
  return getDB().students.get(id);
}

export async function createStudent(input: Omit<Student, "id" | "createdAt" | "updatedAt">): Promise<Student> {
  const now = Date.now();
  const student: Student = { ...input, id: uuid(), createdAt: now, updatedAt: now };
  await getDB().students.add(student);
  return student;
}

export async function updateStudent(id: string, patch: Partial<Omit<Student, "id" | "createdAt">>): Promise<void> {
  await getDB().students.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteStudent(id: string): Promise<void> {
  const db = getDB();
  await db.transaction("rw", db.students, db.sessions, db.assignments, db.notifications, async () => {
    await db.assignments.where("studentId").equals(id).delete();
    await db.sessions.where("studentId").equals(id).delete();
    await db.notifications.where("studentId").equals(id).delete();
    await db.students.delete(id);
  });
}
