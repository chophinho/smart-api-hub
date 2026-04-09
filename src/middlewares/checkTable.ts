import { Request, Response, NextFunction } from "express";
import { db } from "../db/knet";

function isValidTableName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

export const checkTable = async (
  req: Request<{ resource: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { resource } = req.params;

  if (!isValidTableName(resource)) {
    res.status(400).json({ error: `Tên resource '${resource}' không hợp lệ` });
    return;
  }

  const exists = await db.schema.hasTable(resource);
  if (!exists) {
    res.status(404).json({ error: `Resource '${resource}' not found` });
    return;
  }

  next();
};
