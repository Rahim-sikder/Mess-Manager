import type {
  MonthlySummary,
  RentResponse,
  Member,
  BazarEntry,
  MealEntry,
  MealOpt,
  MealStatus,
  Enrollment,
  EnrollmentDate,
  EnrollmentWithDates,
  LunchDinnerOption,
  TodayData,
  EntryStatus,
} from "../types/api";

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${url}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Network error — check your connection and try again.");
  }

  if (res.status === 204) return undefined as unknown as T;

  const text = await res.text();

  if (!res.ok) {
    let message: string;
    try {
      const body = JSON.parse(text) as { error?: string };
      message = body.error ?? `HTTP ${res.status}`;
    } catch {
      console.error(`[api] Non-JSON error response (${res.status}):`, text);
      message = "Couldn't load data — please try again.";
    }
    throw new Error(message);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    console.error("[api] Non-JSON success response:", text);
    throw new Error("Couldn't load data — please try again.");
  }
}

// ── Rent ──────────────────────────────────────────────────────────────────────
export const fetchRent = (month: number, year: number) =>
  request<RentResponse>(`/api/rent?month=${month}&year=${year}`);

export const updateRent = (month: number, year: number, amount: number) =>
  request(`/api/rent`, { method: "PUT", body: JSON.stringify({ month, year, amount }) });

// ── Summary ───────────────────────────────────────────────────────────────────
export const fetchSummary = (month: number, year: number) =>
  request<MonthlySummary>(`/api/summary?month=${month}&year=${year}`);

// ── Today ─────────────────────────────────────────────────────────────────────
export const fetchToday = (date?: string) =>
  request<TodayData>(`/api/today${date ? `?date=${date}` : ""}`);

// ── Members ───────────────────────────────────────────────────────────────────
export const fetchMembers = () =>
  request<Member[]>("/api/members");

export const createMember = (name: string) =>
  request<Member>("/api/members", { method: "POST", body: JSON.stringify({ name }) });

export const patchMember = (id: string, active: boolean) =>
  request<Member>(`/api/members/${id}`, { method: "PATCH", body: JSON.stringify({ active }) });

export const patchMemberRole = (id: string, role: "admin" | "member") =>
  request<Member>(`/api/members/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) });

export const fetchMyMember = (userId: string) =>
  request<Member>(`/api/me?userId=${encodeURIComponent(userId)}`);

export const linkMyMember = (userId: string, memberId: string) =>
  request<Member>("/api/me/link", { method: "POST", body: JSON.stringify({ userId, memberId }) });

// ── Bazar ─────────────────────────────────────────────────────────────────────
export const fetchBazar = (month: number, year: number) =>
  request<BazarEntry[]>(`/api/bazar?month=${month}&year=${year}`);

export const createBazarEntry = (payload: {
  memberId:     string;
  date:         string;
  amount:       number;
  description?: string;
  category?:    string;
  submittedBy?: string | null;
}) => request<BazarEntry>("/api/bazar", { method: "POST", body: JSON.stringify(payload) });

export const updateBazarEntry = (id: string, payload: {
  memberId:     string;
  date:         string;
  amount:       number;
  description?: string;
  category?:    string;
}) => request<BazarEntry>(`/api/bazar/${id}`, { method: "PUT", body: JSON.stringify(payload) });

export const patchBazarStatus = (id: string, status: EntryStatus) =>
  request<BazarEntry>(`/api/bazar/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });

export const deleteBazarEntry = (id: string) =>
  request<void>(`/api/bazar/${id}`, { method: "DELETE" });

// ── Meals ─────────────────────────────────────────────────────────────────────
export const fetchMeals = (month: number, year: number) =>
  request<MealEntry[]>(`/api/meals?month=${month}&year=${year}`);

export const saveMealEntry = (payload: {
  memberId:     string;
  date:         string;
  breakfast:    number;
  lunch:        number;
  dinner:       number;
  submittedBy?: string | null;
}) => request<MealEntry>("/api/meals", { method: "POST", body: JSON.stringify(payload) });

export const patchMealStatus = (id: string, status: EntryStatus) =>
  request<MealEntry>(`/api/meals/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });

export const deleteMealEntry = (id: string) =>
  request<void>(`/api/meals/${id}`, { method: "DELETE" });

// ── Enrollments ───────────────────────────────────────────────────────────────
export const fetchEnrollments = (userId: string) =>
  request<Enrollment[]>(`/api/enrollments?userId=${encodeURIComponent(userId)}`);

export const fetchEnrollmentDates = (enrollmentId: string) =>
  request<EnrollmentDate[]>(`/api/enrollments/${enrollmentId}/dates`);

export const createEnrollment = (payload: {
  userId:        string;
  memberId?:     string | null;
  month:         number;
  year:          number;
  defaultLunch:  LunchDinnerOption;
  defaultDinner: LunchDinnerOption;
  remarks?:      string;
}) => request<EnrollmentWithDates>("/api/enrollments", { method: "POST", body: JSON.stringify(payload) });

export const patchEnrollmentDate = (id: string, payload: {
  lunchOption?:  LunchDinnerOption;
  dinnerOption?: LunchDinnerOption;
  remarks?:      string;
}) => request<EnrollmentDate>(`/api/enrollment-dates/${id}`, { method: "PATCH", body: JSON.stringify(payload) });

export const deleteEnrollment = (id: string) =>
  request<void>(`/api/enrollments/${id}`, { method: "DELETE" });

// ── My Bazar (product-level) ──────────────────────────────────────────────────
export const fetchMyBazar = (userId: string) =>
  request<import("../types/api").MyBazarEntry[]>(
    `/api/my-bazar?userId=${encodeURIComponent(userId)}`
  );

export const fetchAllBazar = () =>
  request<import("../types/api").MyBazarEntry[]>("/api/my-bazar?all=true");

export const createMyBazarEntry = (payload: import("../types/api").MyBazarPayload) =>
  request<import("../types/api").MyBazarEntry>("/api/my-bazar", { method: "POST", body: JSON.stringify(payload) });

export const updateMyBazarEntry = (id: string, payload: import("../types/api").MyBazarPayload) =>
  request<import("../types/api").MyBazarEntry>(`/api/my-bazar/${id}`, { method: "PUT", body: JSON.stringify(payload) });

export const deleteMyBazarEntry = (id: string) =>
  request<void>(`/api/my-bazar/${id}`, { method: "DELETE" });

// ── Meal summary (all users, monthly) ────────────────────────────────────────
export const fetchMealSummary = (month: number, year: number) =>
  request<import("../types/api").MealUserSummary[]>(
    `/api/meal-summary?month=${month}&year=${year}`
  );

// ── My Meal Dates (enrollment dates by user) ──────────────────────────────────
export const fetchMyMealDates = (userId: string, month: number, year: number) =>
  request<import("../types/api").EnrollmentDate[]>(
    `/api/my-meal-dates?userId=${encodeURIComponent(userId)}&month=${month}&year=${year}`
  );

// ── Auth users ────────────────────────────────────────────────────────────────
export const fetchUsers = () =>
  request<import("../types/api").AuthUser[]>("/api/users");

// ── Meal Opts (personal Yes/No) ───────────────────────────────────────────────
export const fetchMealOpts = (userId: string, month: number, year: number) =>
  request<MealOpt[]>(`/api/meal-opts?userId=${encodeURIComponent(userId)}&month=${month}&year=${year}`);

export const upsertMealOpt = (payload: {
  userId:      string;
  memberId?:   string | null;
  date:        string;
  mealStatus:  MealStatus;
}) => request<MealOpt>("/api/meal-opts", { method: "POST", body: JSON.stringify(payload) });

export const deleteMealOpt = (id: string) =>
  request<void>(`/api/meal-opts/${id}`, { method: "DELETE" });
