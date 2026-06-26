import { Router, type Request, type Response } from "express";
import { getUserMealOpts, upsertUserMealOpt, deleteUserMealOpt } from "../services/mealOptService";
import type { MealStatus } from "../repositories/mealOptRepository";

const router = Router();

router.get("/meal-opts", async (req: Request, res: Response) => {
  const { userId } = req.query as { userId?: string };
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const month = parseInt(String(req.query.month), 10);
  const year  = parseInt(String(req.query.year),  10);

  try {
    res.json(await getUserMealOpts(userId, month, year));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal error" });
  }
});

router.post("/meal-opts", async (req: Request, res: Response) => {
  const {
    userId,
    memberId   = null,
    date,
    mealStatus,
  } = req.body as {
    userId?:     string;
    memberId?:   string | null;
    date?:       string;
    mealStatus?: string;
  };

  if (!userId || !date || !mealStatus) {
    return res.status(400).json({ error: "userId, date, and mealStatus are required" });
  }
  if (!["yes", "no"].includes(mealStatus)) {
    return res.status(400).json({ error: "mealStatus must be 'yes' or 'no'" });
  }

  try {
    res.status(200).json(
      await upsertUserMealOpt(userId, memberId ?? null, date, mealStatus as MealStatus)
    );
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Bad request" });
  }
});

router.delete("/meal-opts/:id", async (req: Request, res: Response) => {
  try {
    await deleteUserMealOpt(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Bad request" });
  }
});

export { router as mealOptRoutes };
