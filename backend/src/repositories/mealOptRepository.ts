import { supabase } from "../lib/supabase";

export type MealStatus = "yes" | "no";

export interface MealOpt {
  id:          string;
  userId:      string;
  memberId:    string | null;
  date:        string;
  mealStatus:  MealStatus;
  createdAt:   string;
  updatedAt:   string;
}

type RawRow = {
  id:          string;
  user_id:     string;
  member_id:   string | null;
  date:        string;
  meal_status: MealStatus;
  created_at:  string;
  updated_at:  string;
};

const SELECT_FIELDS = "id, user_id, member_id, date, meal_status, created_at, updated_at";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toMealOpt(row: RawRow): MealOpt {
  return {
    id:         row.id,
    userId:     row.user_id,
    memberId:   row.member_id ?? null,
    date:       row.date,
    mealStatus: row.meal_status,
    createdAt:  row.created_at,
    updatedAt:  row.updated_at,
  };
}

export async function getMealOptsByUser(
  userId: string,
  month:  number,
  year:   number
): Promise<MealOpt[]> {
  const prefix = `${year}-${pad(month)}`;

  const { data, error } = await supabase
    .from("meal_opts")
    .select(SELECT_FIELDS)
    .eq("user_id", userId)
    .like("date", `${prefix}%`)
    .order("date", { ascending: true });

  if (error) throw new Error(`getMealOptsByUser: ${error.message}`);
  return (data as unknown as RawRow[]).map(toMealOpt);
}

export async function getAllMealOpts(
  month: number,
  year:  number
): Promise<MealOpt[]> {
  const prefix = `${year}-${pad(month)}`;

  const { data, error } = await supabase
    .from("meal_opts")
    .select(SELECT_FIELDS)
    .like("date", `${prefix}%`)
    .order("date", { ascending: true });

  if (error) throw new Error(`getAllMealOpts: ${error.message}`);
  return (data as unknown as RawRow[]).map(toMealOpt);
}

export async function upsertMealOpt(payload: {
  userId:     string;
  memberId:   string | null;
  date:       string;
  mealStatus: MealStatus;
}): Promise<MealOpt> {
  const { data, error } = await supabase
    .from("meal_opts")
    .upsert(
      {
        user_id:     payload.userId,
        member_id:   payload.memberId,
        date:        payload.date,
        meal_status: payload.mealStatus,
        updated_at:  new Date().toISOString(),
      },
      { onConflict: "user_id,date" }
    )
    .select(SELECT_FIELDS)
    .single();

  if (error) throw new Error(`upsertMealOpt: ${error.message}`);
  return toMealOpt(data as unknown as RawRow);
}

export async function deleteMealOpt(id: string): Promise<void> {
  const { error } = await supabase
    .from("meal_opts")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`deleteMealOpt: ${error.message}`);
}
