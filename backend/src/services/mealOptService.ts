import {
  getMealOptsByUser,
  upsertMealOpt,
  deleteMealOpt,
  type MealOpt,
  type MealStatus,
} from "../repositories/mealOptRepository";

export async function getUserMealOpts(
  userId: string,
  month:  number,
  year:   number
): Promise<MealOpt[]> {
  return getMealOptsByUser(userId, month, year);
}

export async function upsertUserMealOpt(
  userId:     string,
  memberId:   string | null,
  date:       string,
  mealStatus: MealStatus
): Promise<MealOpt> {
  return upsertMealOpt({ userId, memberId, date, mealStatus });
}

export async function deleteUserMealOpt(id: string): Promise<void> {
  return deleteMealOpt(id);
}
