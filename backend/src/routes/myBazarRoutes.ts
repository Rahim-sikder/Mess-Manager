import { Router } from "express";
import {
  listMyBazarEntries, listAllMyBazarEntries,
  makeMyBazarEntry, editMyBazarEntry, removeMyBazarEntry,
} from "../services/myBazarService";

export const myBazarRoutes = Router();

myBazarRoutes.get("/my-bazar", async (req, res) => {
  try {
    const { userId, all } = req.query;
    if (all === "true") {
      return res.json(await listAllMyBazarEntries());
    }
    if (!userId) return res.status(400).json({ error: "userId required" });
    res.json(await listMyBazarEntries(userId as string));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Server error" });
  }
});

myBazarRoutes.post("/my-bazar", async (req, res) => {
  try {
    const entry = await makeMyBazarEntry(req.body);
    res.status(201).json(entry);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Server error" });
  }
});

myBazarRoutes.put("/my-bazar/:id", async (req, res) => {
  try {
    const entry = await editMyBazarEntry(req.params.id, req.body);
    res.json(entry);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Server error" });
  }
});

myBazarRoutes.delete("/my-bazar/:id", async (req, res) => {
  try {
    await removeMyBazarEntry(req.params.id);
    res.status(204).send();
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Server error" });
  }
});
