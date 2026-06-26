import { getMealEntriesForDate } from "../repositories/mealRepository";
import { getBazarEntriesForDate } from "../repositories/bazarRepository";

export interface TodayMeal {
  memberName:  string;
  memberId:    string;
  breakfast:   number;
  lunch:       number;
  dinner:      number;
  total:       number;
  status:      string;
}

export interface TodayBazar {
  memberName:  string;
  memberId:    string;
  amount:      number;
  description: string | null;
  category:    string | null;
  status:      string;
}

export interface TodayData {
  date:        string;
  meals:       TodayMeal[];
  bazar:       TodayBazar[];
  totalMeals:  number;
  totalBazar:  number;
}

function todayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function getTodaySummary(dateOverride?: string): Promise<TodayData> {
  const date = dateOverride ?? todayDateString();

  const [mealEntries, bazarEntries] = await Promise.all([
    getMealEntriesForDate(date),
    getBazarEntriesForDate(date),
  ]);

  const meals: TodayMeal[] = mealEntries.map((e) => ({
    memberName:  e.memberName,
    memberId:    e.memberId,
    breakfast:   e.breakfast,
    lunch:       e.lunch,
    dinner:      e.dinner,
    total:       e.mealCount,
    status:      e.status,
  }));

  const bazar: TodayBazar[] = bazarEntries.map((e) => ({
    memberName:  e.memberName,
    memberId:    e.memberId,
    amount:      e.amount,
    description: e.description,
    category:    e.category,
    status:      e.status,
  }));

  const totalMeals = meals.reduce((s, m) => s + m.total, 0);
  const totalBazar = bazar.filter(b => b.status === "approved").reduce((s, b) => s + b.amount, 0);

  return { date, meals, bazar, totalMeals, totalBazar };
}
