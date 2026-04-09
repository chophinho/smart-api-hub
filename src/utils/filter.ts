import { Request, Response, NextFunction } from "express";
import { db } from "../db/knet";
type FilterOperator = "_gte" | "_lte" | "_ne" | "_like";

interface ParsedFilter {
  column: string;
  operator: FilterOperator;
  value: string;
}

export function parseFilters(query: Request["query"]): ParsedFilter[] {
  const operators: FilterOperator[] = ["_gte", "_lte", "_ne", "_like"];
  const filters: ParsedFilter[] = [];

  for (const [key, value] of Object.entries(query)) {
    // Bỏ qua các param đặc biệt
    if (["_page", "_limit", "_sort", "_order", "_fields", "q"].includes(key)) {
      continue;
    }

    for (const op of operators) {
      if (key.endsWith(op)) {
        const column = key.slice(0, -op.length); // age_gte → age
        filters.push({ column, operator: op, value: value as string });
        break;
      }
    }
  }

  return filters;
}

export function applyFilters(
  query: ReturnType<typeof db>,
  filters: ParsedFilter[],
): ReturnType<typeof db> {
  for (const { column, operator, value } of filters) {
    switch (operator) {
      case "_gte":
        query = query.where(column, ">=", value);
        break;
      case "_lte":
        query = query.where(column, "<=", value);
        break;
      case "_ne":
        query = query.whereNot({ [column]: value });
        break;
      case "_like":
        query = query.whereILike(column, `%${value}%`);
        break;
    }
  }
  return query;
}
