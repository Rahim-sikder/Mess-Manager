export interface MonthlyRent {
  id: string;
  month: number;
  year: number;
  amount: number;
}

export type MemberStatus = "GET" | "PAY" | "SETTLED";

export interface MemberSummary {
  memberName: string;
  totalMeals: number;
  mealCost: number;
  roomRentShare: number;
  totalCost: number;
  bazarPaid: number;
  finalBalance: number;
  status: MemberStatus;
}

export interface MonthlySummaryResult {
  totalBazar: number;
  totalMeals: number;
  mealRate: number;
  monthlyRoomRent: number;
  roomRentPerPerson: number;
  activeMembersCount: number;
  members: MemberSummary[];
}
