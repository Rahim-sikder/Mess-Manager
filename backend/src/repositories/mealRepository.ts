import { supabase } from "../lib/supabase";

export type EntryStatus = "pending" | "approved" | "rejected";

export interface MealCount {
  memberId:   string;
  memberName: string;
  totalMeals: number;
}

export interface MealEntryFull {
  id:          string;
  memberId:    string;
  memberName:  string;
  date:        string;
  breakfast:   number;
  lunch:       number;
  dinner:      number;
  mealCount:   number;
  status:      EntryStatus;
  submittedBy: string | null;
}

type RawRow = {
  id:           string;
  member_id:    string;
  date:         string;
  meal_count:   number;
  breakfast:    number;
  lunch:        number;
  dinner:       number;
  status:       EntryStatus;
  submitted_by: string | null;
  members:      { name: string } | null;
};

const SELECT_FIELDS =
  "id, member_id, date, meal_count, breakfast, lunch, dinner, status, submitted_by, members(name)";

function monthRange(month: number, year: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = `${year}-${pad(month)}-01`;
  const endYear  = month === 12 ? year + 1 : year;
  const endMonth = month === 12 ? 1 : month + 1;
  const end = `${endYear}-${pad(endMonth)}-01`;
  return { start, end };
}

function toFull(row: RawRow): MealEntryFull {
  return {
    id:          row.id,
    memberId:    row.member_id,
    memberName:  row.members?.name ?? "Unknown",
    date:        row.date,
    breakfast:   Number(row.breakfast ?? 0),
    lunch:       Number(row.lunch ?? 0),
    dinner:      Number(row.dinner ?? 0),
    mealCount:   Number(row.meal_count),
    status:      row.status ?? "approved",
    submittedBy: row.submitted_by ?? null,
  };
}

// Only approved entries count toward the monthly summary
export async function getMealCountsForMonth(
  month: number,
  year:  number
): Promise<MealCount[]> {
  const { start, end } = monthRange(month, year);

  const { data, error } = await supabase
    .from("meal_entries")
    .select("member_id, meal_count, members(name)")
    .gte("date", start)
    .lt("date", end)
    .eq("status", "approved");

  if (error) throw new Error(`getMealCountsForMonth: ${error.message}`);

  const map = new Map<string, { memberName: string; totalMeals: number }>();
  for (const row of (data as unknown as RawRow[])) {
    const existing = map.get(row.member_id);
    const count = Number(row.meal_count);
    if (existing) existing.totalMeals += count;
    else map.set(row.member_id, { memberName: row.members?.name ?? "Unknown", totalMeals: count });
  }

  return Array.from(map.entries()).map(([memberId, { memberName, totalMeals }]) => ({
    memberId, memberName, totalMeals,
  }));
}

export async function getMealEntriesForMonth(
  month: number,
  year:  number
): Promise<MealEntryFull[]> {
  const { start, end } = monthRange(month, year);

  const { data, error } = await supabase
    .from("meal_entries")
    .select(SELECT_FIELDS)
    .gte("date", start)
    .lt("date", end)
    .order("date", { ascending: false });

  if (error) throw new Error(`getMealEntriesForMonth: ${error.message}`);
  return (data as unknown as RawRow[]).map(toFull);
}

export async function getMealEntriesForDate(date: string): Promise<MealEntryFull[]> {
  const { data, error } = await supabase
    .from("meal_entries")
    .select(SELECT_FIELDS)
    .eq("date", date)
    .order("members(name)", { ascending: true });

  if (error) throw new Error(`getMealEntriesForDate: ${error.message}`);
  return (data as unknown as RawRow[]).map(toFull);
}

export async function upsertMealEntry(
  memberId:    string,
  date:        string,
  breakfast:   number,
  lunch:       number,
  dinner:      number,
  submittedBy: string | null = null,
  status:      EntryStatus   = "approved"
): Promise<MealEntryFull> {
  const mealCount = breakfast + lunch + dinner;

  const { data, error } = await supabase
    .from("meal_entries")
    .upsert(
      { member_id: memberId, date, meal_count: mealCount, breakfast, lunch, dinner,
        submitted_by: submittedBy, status },
      { onConflict: "member_id,date" }
    )
    .select(SELECT_FIELDS)
    .single();

  if (error) throw new Error(`upsertMealEntry: ${error.message}`);
  return toFull(data as unknown as RawRow);
}

export async function updateMealStatus(
  id:     string,
  status: EntryStatus
): Promise<MealEntryFull> {
  const { data, error } = await supabase
    .from("meal_entries")
    .update({ status })
    .eq("id", id)
    .select(SELECT_FIELDS)
    .single();

  if (error) throw new Error(`updateMealStatus: ${error.message}`);
  return toFull(data as unknown as RawRow);
}

export async function deleteMealEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from("meal_entries")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`deleteMealEntry: ${error.message}`);
}
