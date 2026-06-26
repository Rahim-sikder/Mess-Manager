import { getMonthlyRent } from "./rentService";
import { getBazarEntriesForMonth } from "../repositories/bazarRepository";
import { getMealCountsForMonth } from "../repositories/mealRepository";
import { getActiveMembersForMonth } from "../repositories/memberRepository";
import type { MonthlySummaryResult, MemberSummary, MemberStatus } from "../types";

export async function getMonthlySummary(
  month: number,
  year: number
): Promise<MonthlySummaryResult> {
  const [bazarEntries, mealCounts, activeMembers, monthlyRoomRent] = await Promise.all([
    getBazarEntriesForMonth(month, year),
    getMealCountsForMonth(month, year),
    getActiveMembersForMonth(month, year),
    getMonthlyRent(month, year),
  ]);

  const totalBazar = bazarEntries.reduce((sum, e) => sum + e.amount, 0);
  const totalMeals = mealCounts.reduce((sum, m) => sum + m.totalMeals, 0);
  const mealRate = totalMeals > 0 ? totalBazar / totalMeals : 0;
  const activeMembersCount = activeMembers.length;
  const roomRentPerPerson = activeMembersCount > 0 ? monthlyRoomRent / activeMembersCount : 0;

  // Aggregate bazar paid per member from individual entries
  const bazarByMember = new Map<string, number>();
  for (const entry of bazarEntries) {
    bazarByMember.set(entry.memberId, (bazarByMember.get(entry.memberId) ?? 0) + entry.amount);
  }

  // Meal count per member
  const mealsByMember = new Map<string, number>();
  for (const m of mealCounts) {
    mealsByMember.set(m.memberId, m.totalMeals);
  }

  // Name fallback from meal records
  const nameByMember = new Map<string, string>();
  for (const m of mealCounts) {
    nameByMember.set(m.memberId, m.memberName);
  }

  const members: MemberSummary[] = activeMembers.map((member) => {
    const personTotalMeals = mealsByMember.get(member.id) ?? 0;
    const personBazarPaid = bazarByMember.get(member.id) ?? 0;
    const personMealCost = personTotalMeals * mealRate;
    const personTotalCost = personMealCost + roomRentPerPerson;
    const finalBalance = personBazarPaid - personTotalCost;

    let status: MemberStatus;
    if (finalBalance > 0) status = "GET";
    else if (finalBalance < 0) status = "PAY";
    else status = "SETTLED";

    return {
      memberName: nameByMember.get(member.id) ?? member.name,
      totalMeals: personTotalMeals,
      mealCost: personMealCost,
      roomRentShare: roomRentPerPerson,
      totalCost: personTotalCost,
      bazarPaid: personBazarPaid,
      finalBalance,
      status,
    };
  });

  return {
    totalBazar,
    totalMeals,
    mealRate,
    monthlyRoomRent,
    roomRentPerPerson,
    activeMembersCount,
    members,
  };
}
