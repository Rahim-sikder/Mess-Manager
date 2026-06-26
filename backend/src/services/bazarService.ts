import {
  getBazarEntriesFullForMonth,
  addBazarEntry,
  updateBazarEntry,
  updateBazarStatus,
  deleteBazarEntry,
  type BazarEntryFull,
  type EntryStatus,
} from "../repositories/bazarRepository";
import { getMemberByUserId } from "../repositories/memberRepository";

export async function listBazarEntries(month: number, year: number): Promise<BazarEntryFull[]> {
  return getBazarEntriesFullForMonth(month, year);
}

export async function createBazarEntry(
  memberId:    string,
  date:        string,
  amount:      number,
  description?: string,
  category?:   string,
  submittedBy: string | null = null
): Promise<BazarEntryFull> {
  if (!memberId)   throw new Error("memberId is required");
  if (!date)       throw new Error("date is required");
  if (amount <= 0) throw new Error("amount must be greater than 0");

  let status: EntryStatus = "approved";
  if (submittedBy) {
    const member = await getMemberByUserId(submittedBy);
    if (member && member.role !== "admin") status = "pending";
  }

  return addBazarEntry(memberId, date, amount, description, category, submittedBy, status);
}

export async function editBazarEntry(
  id:          string,
  memberId:    string,
  date:        string,
  amount:      number,
  description?: string,
  category?:   string
): Promise<BazarEntryFull> {
  if (!id || !memberId) throw new Error("id and memberId are required");
  if (!date)            throw new Error("date is required");
  if (amount <= 0)      throw new Error("amount must be greater than 0");
  return updateBazarEntry(id, memberId, date, amount, description, category);
}

export async function setBazarStatus(id: string, status: EntryStatus): Promise<BazarEntryFull> {
  if (!id) throw new Error("id is required");
  if (!["pending", "approved", "rejected"].includes(status)) {
    throw new Error("status must be pending, approved, or rejected");
  }
  return updateBazarStatus(id, status);
}

export async function removeBazarEntry(id: string): Promise<void> {
  if (!id) throw new Error("id is required");
  return deleteBazarEntry(id);
}

// Re-export type for route usage
export type { EntryStatus };
