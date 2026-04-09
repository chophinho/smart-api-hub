import { Request, Response, NextFunction } from "express";
import { db } from "../db/knet";
import { validateColumns, validateId } from "../utils/validate";
import { parsePagination } from "../utils/page";
import { applyFilters, parseFilters } from "../utils/filter";
import { getExpandData } from "../utils/getExpandData";
import { getEmbedData } from "../utils/getEmbedData";

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const resource = req.params.resource as string;

    const { page, limit, sort, order, errors } = parsePagination(req.query);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    if (sort) {
      const { invalid } = await validateColumns(resource, [sort]);
      if (invalid.length > 0) {
        return res.status(400).json({
          error: `Cột sắp xếp '${sort}' không tồn tại trong bảng '${resource}'`,
        });
      }
    }

    let columns: string[] = ["*"];
    const fields = req.query._fields as string | undefined;
    if (fields) {
      const requested = fields
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
      const { valid, invalid } = await validateColumns(resource, requested);
      if (invalid.length > 0) {
        return res.status(400).json({
          error: `Các cột không tồn tại trong bảng '${resource}': ${invalid.join(", ")}`,
        });
      }
      columns = valid;
    }

    const filters = parseFilters(req.query);

    if (filters.length > 0) {
      const filterColumns = filters.map((f) => f.column);
      const { invalid } = await validateColumns(resource, filterColumns);
      if (invalid.length > 0) {
        return res.status(400).json({
          error: `Cột filter không tồn tại trong bảng '${resource}': ${invalid.join(", ")}`,
        });
      }
    }

    const q = req.query.q as string | undefined;

    const offset = (page - 1) * limit;

    const columnInfo = await db(resource).columnInfo();
    const textColumns = Object.entries(columnInfo)
      .filter(([, info]) =>
        ["text", "character varying", "varchar"].includes(info.type),
      )
      .map(([col]) => col);

    let baseQuery = db(resource);
    baseQuery = applyFilters(baseQuery, filters);

    if (q) {
      baseQuery = baseQuery.where((builder) => {
        textColumns.forEach((col, index) => {
          if (index === 0) {
            builder.whereILike(col, `%${q}%`);
          } else {
            builder.orWhereILike(col, `%${q}%`);
          }
        });
      });
    }

    const [{ count }] = await baseQuery.clone().count("id as count");
    const total = Number(count);

    let dataQuery = baseQuery
      .clone()
      .select(columns)
      .limit(limit)
      .offset(offset);
    if (sort) dataQuery = dataQuery.orderBy(sort, order);

    let data = await dataQuery;
    const expand = req.query._expand as string | undefined;
    if (expand) {
      try {
        data = await getExpandData(resource, data, expand);
      } catch (err: unknown) {
        return res.status(400).json({ error: (err as Error).message });
      }
    }

    const embed = req.query._embed as string | undefined;
    if (embed) {
      try {
        data = await getEmbedData(resource, data, embed);
      } catch (err: unknown) {
        return res.status(400).json({ error: (err as Error).message });
      }
    }

    res.setHeader("X-Total-Count", total);
    res.setHeader("Access-Control-Expose-Headers", "X-Total-Count");

    return res.status(200).json({
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  const resource = req.params.resource as string;
  const id = req.params.id as string;

  if (Number(id) < 0) {
    return res.status(400).json({ err: "ID khong dc la so am" });
  }
  const idError = validateId(id);
  if (idError) return res.status(400).json({ error: idError });

  const item = await db(resource)
    .where({ id: Number(id) })
    .first();

  if (!item) {
    return res
      .status(404)
      .json({ error: `${resource} với id=${id} không tồn tại` });
  }

  return res.status(200).json(item);
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const resource = req.params.resource as string;

    const body = req.body;
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({ error: "Body không được để trống" });
    }

    const { invalid } = await validateColumns(resource, Object.keys(body));
    if (invalid.length > 0) {
      return res.status(400).json({
        error: `Các cột không tồn tại trong bảng '${resource}': ${invalid.join(", ")}`,
      });
    }

    const [inserted] = await db(resource).insert(body).returning("*");
    return res.status(201).json(inserted);
  } catch (error) {
    next(error);
  }
}

export async function put(req: Request, res: Response, next: NextFunction) {
  try {
    const resource = req.params.resource as string;
    const id = req.params.id as string;

    const idError = validateId(id);
    if (idError) return res.status(400).json({ error: idError });

    const body = req.body;
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({ error: "Body không được để trống" });
    }

    const columnInfo = await db(resource).columnInfo();
    const writableColumns = Object.keys(columnInfo).filter(
      (col) => !["id", "created_at", "updated_at"].includes(col),
    );

    const missingColumns = writableColumns.filter((col) => !(col in body));
    if (missingColumns.length > 0) {
      return res.status(400).json({
        error: `PUT yêu cầu đầy đủ các cột. Còn thiếu: ${missingColumns.join(", ")}`,
      });
    }

    const { invalid } = await validateColumns(resource, Object.keys(body));
    if (invalid.length > 0) {
      return res.status(400).json({
        error: `Các cột không tồn tại: ${invalid.join(", ")}`,
      });
    }

    const updateData = { ...body, updated_at: new Date() };

    const [updated] = await db(resource)
      .where({ id: Number(id) })
      .update(updateData)
      .returning("*");

    if (!updated) {
      return res
        .status(404)
        .json({ error: `${resource} với id=${id} không tồn tại` });
    }

    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

export async function patch(req: Request, res: Response, next: NextFunction) {
  try {
    const resource = req.params.resource as string;
    const id = req.params.id as string;

    const idError = validateId(id);
    if (idError) return res.status(400).json({ error: idError });

    const body = req.body;
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({ error: "Body không được để trống" });
    }

    const { invalid } = await validateColumns(resource, Object.keys(body));
    if (invalid.length > 0) {
      return res.status(400).json({
        error: `Các cột không tồn tại: ${invalid.join(", ")}`,
      });
    }

    const updateData = { ...body, updated_at: new Date() };

    const [updated] = await db(resource)
      .where({ id: Number(id) })
      .update(updateData)
      .returning("*");

    if (!updated) {
      return res
        .status(404)
        .json({ error: `${resource} với id=${id} không tồn tại` });
    }

    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const resource = req.params.resource as string;
    const id = req.params.id as string;

    const idError = validateId(id);
    if (idError) return res.status(400).json({ error: idError });

    const deleted = await db(resource)
      .where({ id: Number(id) })
      .delete()
      .returning("*");

    if (!deleted.length) {
      return res
        .status(404)
        .json({ error: `${resource} với id=${id} không tồn tại` });
    }

    return res.status(200).json({
      message: `Đã xóa ${resource} id=${id} thành công`,
      deleted: deleted[0],
    });
  } catch (error) {
    next(error);
  }
}
