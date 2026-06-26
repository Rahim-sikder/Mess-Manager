import { Router, Request, Response } from "express";
import { getMonthlySummary } from "../services/calculationService";

const router = Router();

router.get("/summary", async (req: Request, res: Response) => {
  const month = parseInt(String(req.query.month), 10);
  const year = parseInt(String(req.query.year), 10);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: "month must be 1–12" });
  }
  if (!Number.isInteger(year) || year < 2000) {
    return res.status(400).json({ error: "year must be >= 2000" });
  }

  try {
    const summary = await getMonthlySummary(month, year);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
  }
});

export { router as summaryRoutes };
