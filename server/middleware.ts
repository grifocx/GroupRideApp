import type { Request, Response, NextFunction } from "express";

export function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (!(req.user as any).isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}
