import { Router, type Request, type Response } from "express";
import { supabase } from "../lib/supabase";
import { getAllMembers } from "../repositories/memberRepository";

const router = Router();

// GET /api/users  — list all Supabase auth users, merged with member records
router.get("/users", async (_req: Request, res: Response) => {
  try {
    const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    if (authErr) throw new Error(`listUsers: ${authErr.message}`);

    const members = await getAllMembers();
    const memberByUserId = new Map(
      members.filter((m) => m.userId).map((m) => [m.userId!, m])
    );

    const users = (authData?.users ?? []).map((u) => {
      const member = memberByUserId.get(u.id) ?? null;
      const nameFromMeta = (u.user_metadata as Record<string, unknown>)?.full_name as string | undefined;
      const displayName  = member?.name ?? nameFromMeta ?? u.email?.split("@")[0] ?? "User";
      return {
        id:        u.id,
        email:     u.email ?? null,
        name:      displayName,
        role:      member?.role  ?? "member",
        active:    member?.active ?? true,
        memberId:  member?.id ?? null,
        createdAt: u.created_at,
      };
    });

    res.json(users);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Server error" });
  }
});

export { router as userRoutes };
