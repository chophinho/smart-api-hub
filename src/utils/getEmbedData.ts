import { db } from "../db/knet";

export async function getEmbedData(
  resource: string,
  rows: Record<string, unknown>[],
  embedResource: string,
): Promise<Record<string, unknown>[]> {
  const fkColumn = `${resource.replace(/s$/, "")}_id`; // posts → post_id

  const childExists = await db.schema.hasTable(embedResource);
  if (!childExists) {
    throw new Error(`Bảng '${embedResource}' không tồn tại`);
  }

  const childColumnInfo = await db(embedResource).columnInfo();
  if (!childColumnInfo[fkColumn]) {
    throw new Error(
      `Không tìm thấy cột '${fkColumn}' trong bảng '${embedResource}' để embed`,
    );
  }

  const parentIds = rows.map((r) => r["id"]).filter(Boolean);
  if (parentIds.length === 0) return rows;

  const children = await db(embedResource).whereIn(
    fkColumn,
    parentIds as number[],
  );

  const childMap = new Map<number, Record<string, unknown>[]>();
  for (const child of children) {
    const key = child[fkColumn] as number;
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key)!.push(child);
  }

  return rows.map((row) => ({
    ...row,
    [embedResource]: childMap.get(row["id"] as number) ?? [],
  }));
}
