// ── Summary ──────────────────────────────────────────────────────────────────
export type MemberStatus = "GET" | "PAY" | "SETTLED";

export interface MemberSummary {
  memberName:    string;
  totalMeals:    number;
  mealCost:      number;
  roomRentShare: number;
  totalCost:     number;
  bazarPaid:     number;
  finalBalance:  number;
  status:        MemberStatus;
}

export interface MonthlySummary {
  totalBazar:         number;
  totalMeals:         number;
  mealRate:           number;
  monthlyRoomRent:    number;
  roomRentPerPerson:  number;
  activeMembersCount: number;
  members:            MemberSummary[];
}

export interface RentResponse {
  amount: number;
}

// ── Members ───────────────────────────────────────────────────────────────────
export type MemberRole = "admin" | "member";

export interface Member {
  id:     string;
  name:   string;
  active: boolean;
  role:   MemberRole;
  userId: string | null;
}

// ── Entry status ──────────────────────────────────────────────────────────────
export type EntryStatus = "pending" | "approved" | "rejected";

// ── Bazar ─────────────────────────────────────────────────────────────────────
export interface BazarEntry {
  id:          string;
  memberId:    string;
  memberName:  string;
  date:        string;
  amount:      number;
  description: string | null;
  category:    string | null;
  status:      EntryStatus;
  submittedBy: string | null;
}

// ── Meals ─────────────────────────────────────────────────────────────────────
export interface MealEntry {
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

// ── Meal Enrollment ───────────────────────────────────────────────────────────
export interface Enrollment {
  id:        string;
  userId:    string;
  memberId:  string | null;
  month:     number;
  year:      number;
  remarks:   string | null;
  createdAt: string;
  updatedAt: string;
}

export type LunchDinnerOption = "yes" | "no";

export interface EnrollmentDate {
  id:           string;
  enrollmentId: string;
  userId:       string;
  date:         string;
  dayName:      string;
  lunchOption:  LunchDinnerOption;
  dinnerOption: LunchDinnerOption;
  remarks:      string | null;
  createdAt:    string;
  updatedAt:    string;
}

export interface EnrollmentWithDates extends Enrollment {
  dates: EnrollmentDate[];
}

// ── Meal opts (personal Yes/No per day) ──────────────────────────────────────
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

// ── My Bazar (product-level personal entries) ────────────────────────────────
export interface MyBazarProduct {
  id:          string;
  entryId:     string;
  productName: string;
  quantity:    number;
  unit:        string;
  unitPrice:   number;
  totalPrice:  number;
  sortOrder:   number;
  createdAt:   string;
}

export interface MyBazarEntry {
  id:         string;
  userId:     string;
  memberId:   string | null;
  memberName: string | null;
  date:       string;
  note:       string | null;
  grandTotal: number;
  createdAt:  string;
  updatedAt:  string;
  products:   MyBazarProduct[];
}

// ── Meal summary (all-users monthly, from /api/meal-summary) ─────────────────
export interface MealUserSummary {
  userId:       string;
  memberId:     string | null;
  userName:     string;
  userEmail:    string | null;
  enrolledDays: number;
  lunchCount:   number;
  dinnerCount:  number;
  totalMeals:   number;
}

// ── Auth users (from /api/users) ──────────────────────────────────────────────
export interface AuthUser {
  id:        string;
  email:     string | null;
  name:      string;
  role:      "admin" | "member";
  active:    boolean;
  memberId:  string | null;
  createdAt: string;
}

export interface MyBazarProductPayload {
  productName: string;
  quantity:    number;
  unit?:       string;
  unitPrice:   number;
  totalPrice:  number;
}

export interface MyBazarPayload {
  userId:     string;
  memberId?:  string | null;
  date:       string;
  note?:      string;
  grandTotal: number;
  products:   MyBazarProductPayload[];
}

// ── Today ─────────────────────────────────────────────────────────────────────
export interface TodayMeal {
  memberName: string;
  memberId:   string;
  breakfast:  number;
  lunch:      number;
  dinner:     number;
  total:      number;
  status:     EntryStatus;
}

export interface TodayBazar {
  memberName:  string;
  memberId:    string;
  amount:      number;
  description: string | null;
  category:    string | null;
  status:      EntryStatus;
}

export interface TodayData {
  date:       string;
  meals:      TodayMeal[];
  bazar:      TodayBazar[];
  totalMeals: number;
  totalBazar: number;
}
