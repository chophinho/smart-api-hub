import { db } from "../db/knet";

export async function getExpandData(
  resource: string,
  rows: Record<string, unknown>[],
  expandResource: string,
): Promise<Record<string, unknown>[]> {
  const fkColumn = `${expandResource}_id`;
  const columnInfo = await db(resource).columnInfo();

  if (!columnInfo[fkColumn]) {
    throw new Error(
      `Không tìm thấy cột '${fkColumn}' trong bảng '${resource}' để expand '${expandResource}'`,
    );
  }

  const parentIds = [...new Set(rows.map((r) => r[fkColumn]))].filter(Boolean);
  if (parentIds.length === 0) return rows;

  const parentExists = await db.schema.hasTable(expandResource);
  if (!parentExists) {
    throw new Error(`Bảng '${expandResource}' không tồn tại`);
  }

  const parents = await db(expandResource).whereIn("id", parentIds as number[]);

  const parentMap = new Map(parents.map((p) => [p.id, p]));

  return rows.map((row) => ({
    ...row,
    [expandResource]: parentMap.get(row[fkColumn] as number) ?? null,
  }));
}
