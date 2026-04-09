import fs from "fs";
import { db } from "./knet";

export async function runMigrate() {
  const raw = fs.readFileSync("src/db/db.json", "utf-8");
  console.log(`raw ${raw}`);
  const schema = JSON.parse(raw);

  for (const tableName of Object.keys(schema)) {
    const exists = await db.schema.hasTable(tableName);

    if (!exists) {
      const sample = schema[tableName][0];
      await db.schema.createTable(tableName, (table) => {
        table.increments("id");
        Object.entries(sample).forEach(([col, val]) => {
          if (col === "id") return;

          if (typeof val === "number") table.integer(col);
          else if (typeof val === "boolean") table.boolean(col);
          else table.text(col);
        });
        table.timestamps(true, true);
      });
      console.log(`Đã tạo bảng "${tableName}"`);

      const rows = schema[tableName].map((row: Record<string, unknown>) => {
        const { id, ...rest } = row;
        return rest;
      });

      await db(tableName).insert(rows);
      console.log(`Đã insert ${rows.length} dòng vào "${tableName}"`);
    } else {
      console.log(`  Bảng "${tableName}" đã tồn tại, bỏ qua.`);
    }
  }
}
