import { getDB } from "@/lib/db";
import { uuid } from "@/lib/utils";
import type { Assignment } from "@/types/models";

export async function listAssignmentsByStudent(studentId: string): Promise<Assignment[]> {
  return getDB().assignments.where("studentId").equals(studentId).toArray();
}

export async function listAssignmentsBySession(sessionId: string): Promise<Assignment[]> {
  return getDB().assignments.where("sessionId").equals(sessionId).toArray();
}

export async function createAssignment(input: Omit<Assignment, "id" | "createdAt" | "updatedAt">): Promise<Assignment> {
  const now = Date.now();
  const a: Assignment = { ...input, id: uuid(), createdAt: now, updatedAt: now };
  await getDB().assignments.add(a);
  return a;
}

export async function updateAssignment(id: string, patch: Partial<Omit<Assignment, "id" | "createdAt">>): Promise<void> {
  await getDB().assignments.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteAssignment(id: string): Promise<void> {
  await getDB().assignments.delete(id);
}
