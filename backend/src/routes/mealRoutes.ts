import { Router, type Request, type Response } from "express";
import { listMealEntries, saveMealEntry, setMealStatus, removeMealEntry } from "../services/mealService";
import type { EntryStatus } from "../repositories/mealRepository";

const router = Router();

function parseMonthYear(q: Request["query"]): { month: number; year: number } | null {
  const month = parseInt(String(q.month), 10);
  const year  = parseInt(String(q.year), 10);
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(year)  || year  < 2000)            return null;
  return { month, year };
}

router.get("/meals", async (req: Request, res: Response) => {
  const parsed = parseMonthYear(req.query);
  if (!parsed) {
    return res.status(400).json({ error: "month (1–12) and year (≥ 2000) are required" });
  }
  try {
    res.json(await listMealEntries(parsed.month, parsed.year));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal error" });
  }
});

router.post("/meals", async (req: Request, res: Response) => {
  const {
    memberId,
    date,
    breakfast   = 0,
    lunch       = 0,
    dinner      = 0,
    submittedBy = null,
  } = req.body as {
    memberId?:    string;
    date?:        string;
    breakfast?:   number;
    lunch?:       number;
    dinner?:      number;
    submittedBy?: string | null;
  };

  if (!memberId || !date) {
    return res.status(400).json({ error: "memberId and date are required" });
  }
  try {
    res.status(201).json(
      await saveMealEntry(memberId, date, Number(breakfast), Number(lunch), Number(dinner), submittedBy ?? null)
    );
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Bad request" });
  }
});

// PATCH /api/meals/:id/status — approve or reject a meal entry
router.patch("/meals/:id/status", async (req: Request, res: Response) => {
  const { status } = req.body as { status?: string };
  if (!status || !["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "status must be pending, approved, or rejected" });
  }
  try {
    res.json(await setMealStatus(req.params.id, status as EntryStatus));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Bad request" });
  }
});

router.delete("/meals/:id", async (req: Request, res: Response) => {
  try {
    await removeMealEntry(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Bad request" });
  }
});

export { router as mealRoutes };
