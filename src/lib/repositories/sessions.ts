import { getDB } from "@/lib/db";
import { uuid } from "@/lib/utils";
import { markDirty } from "@/lib/sync/dirty";
import type { Session } from "@/types/models";

export async function listSessionsByStudent(studentId: string): Promise<Session[]> {
  const arr = await getDB().sessions.where("studentId").equals(studentId).toArray();
  return arr.sort((a, b) => (a.sessionDate < b.sessionDate ? 1 : a.sessionDate > b.sessionDate ? -1 : b.createdAt - a.createdAt));
}

export async function listRecentSessions(limit = 5): Promise<Session[]> {
  const arr = await getDB().sessions.orderBy("sessionDate").reverse().limit(limit).toArray();
  return arr;
}

export async function getSession(id: string): Promise<Session | undefined> {
  return getDB().sessions.get(id);
}

export async function createSession(input: Omit<Session, "id" | "createdAt" | "updatedAt">): Promise<Session> {
  const now = Date.now();
  const session: Session = { ...input, id: uuid(), createdAt: now, updatedAt: now };
  await getDB().sessions.add(session);
  markDirty();
  return session;
}

export async function updateSession(id: string, patch: Partial<Omit<Session, "id" | "createdAt">>): Promise<void> {
  await getDB().sessions.update(id, { ...patch, updatedAt: Date.now() });
  markDirty();
}

export async function deleteSession(id: string): Promise<void> {
  const db = getDB();
  await db.transaction("rw", db.sessions, db.assignments, async () => {
    await db.assignments.where("sessionId").equals(id).delete();
    await db.sessions.delete(id);
  });
  markDirty();
}
