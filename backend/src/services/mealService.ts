import {
  getMealEntriesForMonth,
  upsertMealEntry,
  updateMealStatus,
  deleteMealEntry,
  type MealEntryFull,
  type EntryStatus,
} from "../repositories/mealRepository";
import { getMemberByUserId } from "../repositories/memberRepository";

export async function listMealEntries(month: number, year: number): Promise<MealEntryFull[]> {
  return getMealEntriesForMonth(month, year);
}

export async function saveMealEntry(
  memberId:    string,
  date:        string,
  breakfast:   number,
  lunch:       number,
  dinner:      number,
  submittedBy: string | null = null
): Promise<MealEntryFull> {
  if (!memberId)  throw new Error("memberId is required");
  if (!date)      throw new Error("date is required");
  if (breakfast < 0 || lunch < 0 || dinner < 0) throw new Error("meal counts must be ≥ 0");

  // Non-admin self-submissions start as pending
  let status: EntryStatus = "approved";
  if (submittedBy) {
    const member = await getMemberByUserId(submittedBy);
    if (member && member.role !== "admin") status = "pending";
  }

  return upsertMealEntry(memberId, date, breakfast, lunch, dinner, submittedBy, status);
}

export async function setMealStatus(id: string, status: EntryStatus): Promise<MealEntryFull> {
  if (!id) throw new Error("id is required");
  if (!["pending", "approved", "rejected"].includes(status)) {
    throw new Error("status must be pending, approved, or rejected");
  }
  return updateMealStatus(id, status);
}

export async function removeMealEntry(id: string): Promise<void> {
  if (!id) throw new Error("id is required");
  return deleteMealEntry(id);
}
