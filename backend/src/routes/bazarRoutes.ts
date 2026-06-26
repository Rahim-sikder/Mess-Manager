import { Router, type Request, type Response } from "express";
import {
  listBazarEntries,
  createBazarEntry,
  editBazarEntry,
  setBazarStatus,
  removeBazarEntry,
  type EntryStatus,
} from "../services/bazarService";

const router = Router();

function parseMonthYear(q: Request["query"]): { month: number; year: number } | null {
  const month = parseInt(String(q.month), 10);
  const year  = parseInt(String(q.year), 10);
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(year)  || year  < 2000)            return null;
  return { month, year };
}

router.get("/bazar", async (req: Request, res: Response) => {
  const parsed = parseMonthYear(req.query);
  if (!parsed) {
    return res.status(400).json({ error: "month (1–12) and year (≥ 2000) are required" });
  }
  try {
    res.json(await listBazarEntries(parsed.month, parsed.year));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal error" });
  }
});

router.post("/bazar", async (req: Request, res: Response) => {
  const { memberId, date, amount, description, category, submittedBy = null } = req.body as {
    memberId?:    string;
    date?:        string;
    amount?:      number;
    description?: string;
    category?:    string;
    submittedBy?: string | null;
  };
  if (!memberId || !date || amount == null) {
    return res.status(400).json({ error: "memberId, date, and amount are required" });
  }
  try {
    res.status(201).json(
      await createBazarEntry(memberId, date, Number(amount), description, category, submittedBy ?? null)
    );
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Bad request" });
  }
});

router.put("/bazar/:id", async (req: Request, res: Response) => {
  const { memberId, date, amount, description, category } = req.body as {
    memberId?:    string;
    date?:        string;
    amount?:      number;
    description?: string;
    category?:    string;
  };
  if (!memberId || !date || amount == null) {
    return res.status(400).json({ error: "memberId, date, and amount are required" });
  }
  try {
    res.json(
      await editBazarEntry(req.params.id, memberId, date, Number(amount), description, category)
    );
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Bad request" });
  }
});

router.patch("/bazar/:id/status", async (req: Request, res: Response) => {
  const { status } = req.body as { status?: string };
  if (!status || !["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "status must be pending, approved, or rejected" });
  }
  try {
    res.json(await setBazarStatus(req.params.id, status as EntryStatus));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Bad request" });
  }
});

router.delete("/bazar/:id", async (req: Request, res: Response) => {
  try {
    await removeBazarEntry(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Bad request" });
  }
});

export { router as bazarRoutes };
