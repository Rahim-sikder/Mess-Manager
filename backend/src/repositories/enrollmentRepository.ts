import { supabase } from "../lib/supabase";

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

export interface EnrollmentDate {
  id:            string;
  enrollmentId:  string;
  userId:        string;
  date:          string;
  dayName:       string;
  lunchOption:   "yes" | "no";
  dinnerOption:  "yes" | "no";
  remarks:       string | null;
  createdAt:     string;
  updatedAt:     string;
}

export interface EnrollmentWithDates extends Enrollment {
  dates: EnrollmentDate[];
}

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

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function pad(n: number): string { return String(n).padStart(2, "0"); }

function datesForMonth(year: number, month: number): { date: string; dayName: string }[] {
  const result: { date: string; dayName: string }[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month - 1, d);
    result.push({
      date:    `${year}-${pad(month)}-${pad(d)}`,
      dayName: DAY_NAMES[dt.getDay()],
    });
  }
  return result;
}

function toEnrollment(row: Record<string, unknown>): Enrollment {
  return {
    id:        row.id as string,
    userId:    row.user_id as string,
    memberId:  (row.member_id as string | null) ?? null,
    month:     row.month as number,
    year:      row.year as number,
    remarks:   (row.remarks as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toEnrollmentDate(row: Record<string, unknown>): EnrollmentDate {
  return {
    id:           row.id as string,
    enrollmentId: row.enrollment_id as string,
    userId:       row.user_id as string,
    date:         row.date as string,
    dayName:      row.day_name as string,
    lunchOption:  (row.lunch_option as "yes" | "no") ?? "yes",
    dinnerOption: (row.dinner_option as "yes" | "no") ?? "yes",
    remarks:      (row.remarks as string | null) ?? null,
    createdAt:    row.created_at as string,
    updatedAt:    row.updated_at as string,
  };
}

export async function getMealSummaryByMonth(month: number, year: number): Promise<MealUserSummary[]> {
  // 1. All enrollments for this month/year
  const { data: enrollments, error: ee } = await supabase
    .from("meal_enrollments")
    .select("id, user_id, member_id")
    .eq("month", month)
    .eq("year", year);

  if (ee) throw new Error(`getMealSummaryByMonth enrollments: ${ee.message}`);
  if (!enrollments?.length) return [];

  const rows = enrollments as Array<{ id: string; user_id: string; member_id: string | null }>;
  const enrollmentIds = rows.map((r) => r.id);

  // 2. All date entries for these enrollments
  const { data: dates, error: de } = await supabase
    .from("meal_enrollment_dates")
    .select("enrollment_id, lunch_option, dinner_option")
    .in("enrollment_id", enrollmentIds);

  if (de) throw new Error(`getMealSummaryByMonth dates: ${de.message}`);

  const dateRows = (dates ?? []) as Array<{
    enrollment_id: string;
    lunch_option:  string;
    dinner_option: string;
  }>;

  // 3. Aggregate per enrollment in JS
  const countsById = new Map<string, { enrolled: number; lunch: number; dinner: number }>();
  for (const d of dateRows) {
    const cur = countsById.get(d.enrollment_id) ?? { enrolled: 0, lunch: 0, dinner: 0 };
    cur.enrolled++;
    if (d.lunch_option  === "yes") cur.lunch++;
    if (d.dinner_option === "yes") cur.dinner++;
    countsById.set(d.enrollment_id, cur);
  }

  // 4. Member names for linked members
  const memberIds = [...new Set(rows.filter((r) => r.member_id).map((r) => r.member_id!))] as string[];
  const memberNameById = new Map<string, string>();
  if (memberIds.length) {
    const { data: members } = await supabase
      .from("members")
      .select("id, name")
      .in("id", memberIds);
    for (const m of (members ?? []) as Array<{ id: string; name: string }>) {
      memberNameById.set(m.id, m.name);
    }
  }

  // 5. Auth user info (display name + email for unlinked users)
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const authUserById = new Map(
    (authData?.users ?? [])
      .filter((u) => userIds.includes(u.id))
      .map((u) => [u.id, u]),
  );

  // 6. Build one summary per enrollment row
  return rows.map((row) => {
    const counts     = countsById.get(row.id) ?? { enrolled: 0, lunch: 0, dinner: 0 };
    const authUser   = authUserById.get(row.user_id);
    const memberName = row.member_id ? (memberNameById.get(row.member_id) ?? null) : null;
    const nameMeta   = (authUser?.user_metadata as Record<string, unknown>)?.full_name as string | undefined;
    const displayName = memberName ?? nameMeta ?? authUser?.email?.split("@")[0] ?? "User";

    return {
      userId:       row.user_id,
      memberId:     row.member_id,
      userName:     displayName,
      userEmail:    authUser?.email ?? null,
      enrolledDays: counts.enrolled,
      lunchCount:   counts.lunch,
      dinnerCount:  counts.dinner,
      totalMeals:   counts.lunch + counts.dinner,
    };
  });
}

export async function getUserEnrollmentDates(
  userId: string,
  month?: number,
  year?:  number,
): Promise<EnrollmentDate[]> {
  let q = supabase
    .from("meal_enrollments")
    .select("id")
    .eq("user_id", userId);
  if (month) q = q.eq("month", month);
  if (year)  q = q.eq("year",  year);

  const { data: enrollments, error: ee } = await q;
  if (ee) throw new Error(`getUserEnrollments: ${ee.message}`);
  if (!enrollments?.length) return [];

  const ids = (enrollments as Record<string, unknown>[]).map((e) => e.id as string);
  const { data, error } = await supabase
    .from("meal_enrollment_dates")
    .select("id, enrollment_id, user_id, date, day_name, lunch_option, dinner_option, remarks, created_at, updated_at")
    .in("enrollment_id", ids)
    .order("date", { ascending: true });

  if (error) throw new Error(`getUserEnrollmentDates: ${error.message}`);
  return (data ?? []).map(toEnrollmentDate);
}

export async function getEnrollmentsByUser(userId: string): Promise<Enrollment[]> {
  const { data, error } = await supabase
    .from("meal_enrollments")
    .select("id, user_id, member_id, month, year, remarks, created_at, updated_at")
    .eq("user_id", userId)
    .order("year",  { ascending: false })
    .order("month", { ascending: false });

  if (error) throw new Error(`getEnrollmentsByUser: ${error.message}`);
  return (data ?? []).map(toEnrollment);
}

export async function getEnrollmentDates(enrollmentId: string): Promise<EnrollmentDate[]> {
  const { data, error } = await supabase
    .from("meal_enrollment_dates")
    .select("id, enrollment_id, user_id, date, day_name, lunch_option, dinner_option, remarks, created_at, updated_at")
    .eq("enrollment_id", enrollmentId)
    .order("date", { ascending: true });

  if (error) throw new Error(`getEnrollmentDates: ${error.message}`);
  return (data ?? []).map(toEnrollmentDate);
}

export async function createEnrollment(payload: {
  userId:         string;
  memberId:       string | null;
  month:          number;
  year:           number;
  defaultLunch:   "yes" | "no";
  defaultDinner:  "yes" | "no";
  remarks?:       string;
}): Promise<EnrollmentWithDates> {
  const { userId, memberId, month, year, defaultLunch, defaultDinner, remarks } = payload;

  // Check for duplicate
  const { data: existing } = await supabase
    .from("meal_enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (existing) throw new Error(`Enrollment already exists for ${month}/${year}`);

  // Insert enrollment header
  const { data: enrollment, error: enrErr } = await supabase
    .from("meal_enrollments")
    .insert({ user_id: userId, member_id: memberId, month, year, remarks: remarks ?? null })
    .select("id, user_id, member_id, month, year, remarks, created_at, updated_at")
    .single();

  if (enrErr || !enrollment) throw new Error(`createEnrollment header: ${enrErr?.message}`);

  // Generate all dates for the month
  const dateDefs = datesForMonth(year, month);
  const dateRows = dateDefs.map(({ date, dayName }) => ({
    enrollment_id: enrollment.id as string,
    user_id:       userId,
    date,
    day_name:      dayName,
    lunch_option:  defaultLunch,
    dinner_option: defaultDinner,
    remarks:       null,
  }));

  const { data: dates, error: datesErr } = await supabase
    .from("meal_enrollment_dates")
    .insert(dateRows)
    .select("id, enrollment_id, user_id, date, day_name, lunch_option, dinner_option, remarks, created_at, updated_at");

  if (datesErr) throw new Error(`createEnrollment dates: ${datesErr.message}`);

  return {
    ...toEnrollment(enrollment as Record<string, unknown>),
    dates: (dates ?? []).map(toEnrollmentDate),
  };
}

export async function updateEnrollmentDate(
  dateId: string,
  payload: { lunchOption?: "yes" | "no"; dinnerOption?: "yes" | "no"; remarks?: string }
): Promise<EnrollmentDate> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.lunchOption  !== undefined) updates.lunch_option  = payload.lunchOption;
  if (payload.dinnerOption !== undefined) updates.dinner_option = payload.dinnerOption;
  if (payload.remarks      !== undefined) updates.remarks       = payload.remarks;

  const { data, error } = await supabase
    .from("meal_enrollment_dates")
    .update(updates)
    .eq("id", dateId)
    .select("id, enrollment_id, user_id, date, day_name, lunch_option, dinner_option, remarks, created_at, updated_at")
    .single();

  if (error || !data) throw new Error(`updateEnrollmentDate: ${error?.message}`);
  return toEnrollmentDate(data as Record<string, unknown>);
}

export async function deleteEnrollment(enrollmentId: string): Promise<void> {
  const { error } = await supabase
    .from("meal_enrollments")
    .delete()
    .eq("id", enrollmentId);

  if (error) throw new Error(`deleteEnrollment: ${error.message}`);
}
