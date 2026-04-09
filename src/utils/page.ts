import { Request, Response, NextFunction } from "express";
export function parsePagination(query: Request["query"]): {
  page: number;
  limit: number;
  sort: string | null;
  order: "asc" | "desc";
  errors: string[];
} {
  const errors: string[] = [];

  const page = query._page ? Number(query._page) : 1;
  if (isNaN(page) || page <= 0) errors.push("_page phải là số nguyên dương");

  const limit = query._limit ? Number(query._limit) : 10;
  if (isNaN(limit) || limit <= 0) errors.push("_limit phải là số nguyên dương");
  if (limit > 100) errors.push("_limit tối đa là 100");

  const sort = (query._sort as string) || null;

  const rawOrder = ((query._order as string) || "asc").toLowerCase();
  if (rawOrder !== "asc" && rawOrder !== "desc") {
    errors.push("_order chỉ chấp nhận 'asc' hoặc 'desc'");
  }
  const order = rawOrder === "desc" ? "desc" : "asc";

  return { page, limit, sort, order, errors };
}
