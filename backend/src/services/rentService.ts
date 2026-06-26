import { supabase } from "../lib/supabase";
import { DEFAULT_MONTHLY_ROOM_RENT } from "../constants";
import type { MonthlyRent } from "../types";

function validate(month: number, year: number, amount?: number): void {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("month must be an integer between 1 and 12");
  }
  if (!Number.isInteger(year) || year < 2000) {
    throw new Error("year must be an integer >= 2000");
  }
  if (amount !== undefined) {
    if (typeof amount !== "number" || !isFinite(amount) || amount < 0) {
      throw new Error("amount must be a non-negative finite number");
    }
  }
}

export async function getMonthlyRent(month: number, year: number): Promise<number> {
  validate(month, year);

  const { data, error } = await supabase
    .from("monthly_rent")
    .select("amount")
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (error) throw new Error(`Database error: ${error.message}`);
  return data != null ? Number(data.amount) : DEFAULT_MONTHLY_ROOM_RENT;
}

export async function updateMonthlyRent(
  month: number,
  year: number,
  amount: number
): Promise<MonthlyRent> {
  validate(month, year, amount);

  const { data, error } = await supabase
    .from("monthly_rent")
    .upsert({ month, year, amount }, { onConflict: "month,year" })
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return {
    id: data.id as string,
    month: data.month as number,
    year: data.year as number,
    amount: Number(data.amount),
  };
}
