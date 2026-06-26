import { Router, Request, Response } from "express";
import { getMonthlyRent, updateMonthlyRent } from "../services/rentService";

const router = Router();

function parseMonth(v: unknown): number | null {
  const n = parseInt(String(v), 10);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
}

function parseYear(v: unknown): number | null {
  const n = parseInt(String(v), 10);
  return Number.isInteger(n) && n >= 2000 ? n : null;
}

function parseAmount(v: unknown): number | null {
  const n = Number(v);
  return isFinite(n) && n >= 0 ? n : null;
}

router.get("/rent", async (req: Request, res: Response) => {
  const month = parseMonth(req.query.month);
  const year = parseYear(req.query.year);

  if (month === null || year === null) {
    return res.status(400).json({ error: "month (1–12) and year (≥ 2000) are required query params" });
  }

  try {
    const amount = await getMonthlyRent(month, year);
    res.json({ amount });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
  }
});

router.put("/rent", async (req: Request, res: Response) => {
  const month = parseMonth(req.body.month);
  const year = parseYear(req.body.year);
  const amount = parseAmount(req.body.amount);

  if (month === null || year === null || amount === null) {
    return res.status(400).json({
      error: "body must include month (1–12), year (≥ 2000), and amount (≥ 0)",
    });
  }

  try {
    const rent = await updateMonthlyRent(month, year, amount);
    res.json(rent);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
  }
});

export { router as rentRoutes };
