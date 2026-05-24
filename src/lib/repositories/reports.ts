import { getDB } from "@/lib/db";
import { uuid } from "@/lib/utils";
import { markDirty } from "@/lib/sync/dirty";
import type { Report, ReportPeriod } from "@/types/models";

export async function listReports(): Promise<Report[]> {
  const arr = await getDB().reports.toArray();
  return arr.sort((a, b) => b.createdAt - a.createdAt);
}

export async function listReportsByStudent(studentId: string): Promise<Report[]> {
  const arr = await getDB().reports.where("studentId").equals(studentId).toArray();
  return arr.sort((a, b) => b.createdAt - a.createdAt);
}

export async function createReport(input: {
  studentId: string;
  period: ReportPeriod;
  fromDate: string;
  toDate: string;
  comment: string;
}): Promise<Report> {
  const report: Report = {
    id: uuid(),
    ...input,
    createdAt: Date.now(),
  };
  await getDB().reports.add(report);
  markDirty();
  return report;
}

export async function deleteReport(id: string): Promise<void> {
  await getDB().reports.delete(id);
  markDirty();
}
