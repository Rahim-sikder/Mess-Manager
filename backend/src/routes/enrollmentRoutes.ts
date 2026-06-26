import { Router, type Request, type Response } from "express";
import {
  listUserEnrollments,
  listEnrollmentDates,
  listUserEnrollmentDates,
  getMealSummary,
  makeEnrollment,
  patchEnrollmentDate,
  removeEnrollment,
} from "../services/enrollmentService";

const router = Router();

// GET /api/meal-summary?month=<m>&year=<y>  — all-users monthly meal counts
router.get("/meal-summary", async (req: Request, res: Response) => {
  const month = req.query.month ? Number(req.query.month) : undefined;
  const year  = req.query.year  ? Number(req.query.year)  : undefined;
  if (!month || !year) return res.status(400).json({ error: "month and year are required" });
  try {
    res.json(await getMealSummary(month, year));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal error" });
  }
});

// GET /api/my-meal-dates?userId=<uid>&month=<m>&year=<y>
router.get("/my-meal-dates", async (req: Request, res: Response) => {
  const userId = String(req.query.userId ?? "").trim();
  if (!userId) return res.status(400).json({ error: "userId is required" });
  const month = req.query.month ? Number(req.query.month) : undefined;
  const year  = req.query.year  ? Number(req.query.year)  : undefined;
  try {
    res.json(await listUserEnrollmentDates(userId, month, year));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal error" });
  }
});

// GET /api/enrollments?userId=<uid>
router.get("/enrollments", async (req: Request, res: Response) => {
  const userId = String(req.query.userId ?? "").trim();
  if (!userId) return res.status(400).json({ error: "userId is required" });
  try {
    res.json(await listUserEnrollments(userId));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal error" });
  }
});

// GET /api/enrollments/:id/dates
router.get("/enrollments/:id/dates", async (req: Request, res: Response) => {
  try {
    res.json(await listEnrollmentDates(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal error" });
  }
});

// POST /api/enrollments
router.post("/enrollments", async (req: Request, res: Response) => {
  const {
    userId, memberId = null, month, year,
    defaultLunch = "yes", defaultDinner = "yes", remarks,
  } = req.body as {
    userId?:        string;
    memberId?:      string | null;
    month?:         number;
    year?:          number;
    defaultLunch?:  "yes" | "no";
    defaultDinner?: "yes" | "no";
    remarks?:       string;
  };

  if (!userId)                                        return res.status(400).json({ error: "userId is required" });
  if (!month || month < 1 || month > 12)              return res.status(400).json({ error: "month (1–12) is required" });
  if (!year  || year < 2020)                          return res.status(400).json({ error: "year (≥ 2020) is required" });
  if (!["yes","no"].includes(defaultLunch))           return res.status(400).json({ error: "defaultLunch must be yes or no" });
  if (!["yes","no"].includes(defaultDinner))          return res.status(400).json({ error: "defaultDinner must be yes or no" });

  try {
    const result = await makeEnrollment({
      userId, memberId: memberId ?? null, month, year,
      defaultLunch: defaultLunch as "yes" | "no",
      defaultDinner: defaultDinner as "yes" | "no",
      remarks,
    });
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = msg.includes("already exists") ? 409 : 500;
    res.status(status).json({ error: msg });
  }
});

// PATCH /api/enrollment-dates/:id
router.patch("/enrollment-dates/:id", async (req: Request, res: Response) => {
  const { lunchOption, dinnerOption, remarks } = req.body as {
    lunchOption?:  "yes" | "no";
    dinnerOption?: "yes" | "no";
    remarks?:      string;
  };
  if (!lunchOption && !dinnerOption && remarks === undefined) {
    return res.status(400).json({ error: "At least one field required" });
  }
  try {
    res.json(await patchEnrollmentDate(req.params.id, { lunchOption, dinnerOption, remarks }));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal error" });
  }
});

// DELETE /api/enrollments/:id
router.delete("/enrollments/:id", async (req: Request, res: Response) => {
  try {
    await removeEnrollment(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal error" });
  }
});

export { router as enrollmentRoutes };
