import {
  getEnrollmentsByUser,
  getEnrollmentDates,
  getUserEnrollmentDates,
  getMealSummaryByMonth,
  createEnrollment,
  updateEnrollmentDate,
  deleteEnrollment,
} from "../repositories/enrollmentRepository";

export type { Enrollment, EnrollmentDate, EnrollmentWithDates, MealUserSummary } from "../repositories/enrollmentRepository";

export const listUserEnrollments = (userId: string) =>
  getEnrollmentsByUser(userId);

export const listEnrollmentDates = (enrollmentId: string) =>
  getEnrollmentDates(enrollmentId);

export const listUserEnrollmentDates = (userId: string, month?: number, year?: number) =>
  getUserEnrollmentDates(userId, month, year);

export const getMealSummary = (month: number, year: number) =>
  getMealSummaryByMonth(month, year);

export const makeEnrollment = (payload: {
  userId:        string;
  memberId:      string | null;
  month:         number;
  year:          number;
  defaultLunch:  "yes" | "no";
  defaultDinner: "yes" | "no";
  remarks?:      string;
}) => createEnrollment(payload);

export const patchEnrollmentDate = (
  dateId:  string,
  payload: { lunchOption?: "yes" | "no"; dinnerOption?: "yes" | "no"; remarks?: string }
) => updateEnrollmentDate(dateId, payload);

export const removeEnrollment = (enrollmentId: string) =>
  deleteEnrollment(enrollmentId);
