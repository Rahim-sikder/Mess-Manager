import { Router, Request, Response } from "express";
import {
  listMembers,
  addMember,
  toggleMemberActive,
  changeMemberRole,
  linkMember,
  getMemberForUser,
} from "../services/memberService";

const router = Router();

router.get("/members", async (_req: Request, res: Response) => {
  try {
    res.json(await listMembers());
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal error" });
  }
});

router.post("/members", async (req: Request, res: Response) => {
  const { name } = req.body as { name?: string };
  if (!name) return res.status(400).json({ error: "name is required" });
  try {
    res.status(201).json(await addMember(name));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Bad request" });
  }
});

router.patch("/members/:id", async (req: Request, res: Response) => {
  const { active } = req.body as { active?: boolean };
  if (typeof active !== "boolean") {
    return res.status(400).json({ error: "active (boolean) is required in body" });
  }
  try {
    res.json(await toggleMemberActive(req.params.id, active));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Bad request" });
  }
});

// PATCH /api/members/:id/role — set admin or member role
router.patch("/members/:id/role", async (req: Request, res: Response) => {
  const { role } = req.body as { role?: string };
  if (role !== "admin" && role !== "member") {
    return res.status(400).json({ error: "role must be 'admin' or 'member'" });
  }
  try {
    res.json(await changeMemberRole(req.params.id, role));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Bad request" });
  }
});

// GET /api/me?userId=<uid> — get member linked to auth user
router.get("/me", async (req: Request, res: Response) => {
  const userId = String(req.query.userId ?? "");
  if (!userId) return res.status(400).json({ error: "userId query param is required" });
  try {
    const member = await getMemberForUser(userId);
    if (!member) return res.status(404).json({ error: "No member linked to this user" });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal error" });
  }
});

// POST /api/me/link — link auth user to a member
router.post("/me/link", async (req: Request, res: Response) => {
  const { userId, memberId } = req.body as { userId?: string; memberId?: string };
  if (!userId || !memberId) {
    return res.status(400).json({ error: "userId and memberId are required" });
  }
  try {
    res.json(await linkMember(memberId, userId));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Bad request" });
  }
});

export { router as memberRoutes };
