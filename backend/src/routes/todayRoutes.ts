import { Router, type Request, type Response } from "express";
import { getTodaySummary } from "../services/todayService";

const router = Router();

router.get("/today", async (req: Request, res: Response) => {
  const date = req.query.date ? String(req.query.date) : undefined;
  try {
    res.json(await getTodaySummary(date));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal error" });
  }
});

export { router as todayRoutes };
