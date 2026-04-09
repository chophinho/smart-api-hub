import { db } from "../db/knet";

export async function tableExists(tableName: string) {
  const result = await db("information_schema.tables")
    .where({
      table_schema: "public",
      table_name: tableName,
    })
    .count("table_name as count")
    .first();
  return Number(result?.count) > 0;
}
export async function validateColumns(
  tableName: string,
  columns: string[],
): Promise<{ valid: string[]; invalid: string[] }> {
  const columnInfo = await db(tableName).columnInfo();
  const existingColumns = Object.keys(columnInfo);

  const valid = columns.filter((col) => existingColumns.includes(col));
  const invalid = columns.filter((col) => !existingColumns.includes(col));

  return { valid, invalid };
}
export function validateId(id: string): string | null {
  if (!/^\d+$/.test(id)) return "ID phải là số nguyên hợp lệ";
  if (Number(id) <= 0) return "ID phải là số nguyên dương (> 0)";
  return null;
}
