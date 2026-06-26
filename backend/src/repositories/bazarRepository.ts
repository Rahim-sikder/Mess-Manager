import { supabase } from "../lib/supabase";
import type { EntryStatus } from "./mealRepository";

export interface BazarEntryBase {
  memberId:   string;
  memberName: string;
  amount:     number;
}

export interface BazarEntryFull extends BazarEntryBase {
  id:          string;
  date:        string;
  description: string | null;
  category:    string | null;
  status:      EntryStatus;
  submittedBy: string | null;
}

type RawRow = {
  id:           string;
  member_id:    string;
  date:         string;
  amount:       number;
  note:         string | null;
  description:  string | null;
  category:     string | null;
  status:       EntryStatus;
  submitted_by: string | null;
  members:      { name: string } | null;
};

const SELECT_FIELDS =
  "id, member_id, date, amount, note, description, category, status, submitted_by, members(name)";

function monthRange(month: number, year: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = `${year}-${pad(month)}-01`;
  const endYear  = month === 12 ? year + 1 : year;
  const endMonth = month === 12 ? 1 : month + 1;
  const end = `${endYear}-${pad(endMonth)}-01`;
  return { start, end };
}

function toFull(row: RawRow): BazarEntryFull {
  return {
    id:          row.id,
    memberId:    row.member_id,
    memberName:  row.members?.name ?? "Unknown",
    date:        row.date,
    amount:      Number(row.amount),
    description: row.description ?? row.note ?? null,
    category:    row.category ?? null,
    status:      row.status ?? "approved",
    submittedBy: row.submitted_by ?? null,
  };
}

// Only approved entries count toward the monthly summary
export async function getBazarEntriesForMonth(
  month: number,
  year:  number
): Promise<BazarEntryBase[]> {
  const { start, end } = monthRange(month, year);

  const { data, error } = await supabase
    .from("bazar_entries")
    .select("member_id, amount, members(name)")
    .gte("date", start)
    .lt("date", end)
    .eq("status", "approved");

  if (error) throw new Error(`getBazarEntriesForMonth: ${error.message}`);

  return (data as unknown as Pick<RawRow, "member_id" | "amount" | "members">[]).map((row) => ({
    memberId:   row.member_id,
    memberName: row.members?.name ?? "Unknown",
    amount:     Number(row.amount),
  }));
}

export async function getBazarEntriesFullForMonth(
  month: number,
  year:  number
): Promise<BazarEntryFull[]> {
  const { start, end } = monthRange(month, year);

  const { data, error } = await supabase
    .from("bazar_entries")
    .select(SELECT_FIELDS)
    .gte("date", start)
    .lt("date", end)
    .order("date", { ascending: false });

  if (error) throw new Error(`getBazarEntriesFullForMonth: ${error.message}`);
  return (data as unknown as RawRow[]).map(toFull);
}

export async function getBazarEntriesForDate(date: string): Promise<BazarEntryFull[]> {
  const { data, error } = await supabase
    .from("bazar_entries")
    .select(SELECT_FIELDS)
    .eq("date", date)
    .order("amount", { ascending: false });

  if (error) throw new Error(`getBazarEntriesForDate: ${error.message}`);
  return (data as unknown as RawRow[]).map(toFull);
}

export async function addBazarEntry(
  memberId:    string,
  date:        string,
  amount:      number,
  description?: string,
  category?:   string,
  submittedBy: string | null = null,
  status:      EntryStatus   = "approved"
): Promise<BazarEntryFull> {
  const { data, error } = await supabase
    .from("bazar_entries")
    .insert({
      member_id:    memberId,
      date,
      amount,
      note:         description ?? null,
      description:  description ?? null,
      category:     category ?? null,
      submitted_by: submittedBy,
      status,
    })
    .select(SELECT_FIELDS)
    .single();

  if (error) throw new Error(`addBazarEntry: ${error.message}`);
  return toFull(data as unknown as RawRow);
}

export async function updateBazarEntry(
  id:          string,
  memberId:    string,
  date:        string,
  amount:      number,
  description?: string,
  category?:   string
): Promise<BazarEntryFull> {
  const { data, error } = await supabase
    .from("bazar_entries")
    .update({
      member_id:   memberId,
      date,
      amount,
      note:        description ?? null,
      description: description ?? null,
      category:    category ?? null,
    })
    .eq("id", id)
    .select(SELECT_FIELDS)
    .single();

  if (error) throw new Error(`updateBazarEntry: ${error.message}`);
  return toFull(data as unknown as RawRow);
}

export async function updateBazarStatus(
  id:     string,
  status: EntryStatus
): Promise<BazarEntryFull> {
  const { data, error } = await supabase
    .from("bazar_entries")
    .update({ status })
    .eq("id", id)
    .select(SELECT_FIELDS)
    .single();

  if (error) throw new Error(`updateBazarStatus: ${error.message}`);
  return toFull(data as unknown as RawRow);
}

export async function deleteBazarEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from("bazar_entries")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`deleteBazarEntry: ${error.message}`);
}
