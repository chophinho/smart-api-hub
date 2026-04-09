import { Router } from "express";
import {
  create,
  getAll,
  getById,
  patch,
  put,
  remove,
} from "../controllers/resource.controller";
import { checkTable } from "../middlewares/checkTable";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";

const router = Router();
router.use("/:resource", checkTable);
router.get("/:resource", getAll);
router.get("/:resource/:id", getById);
router.put("/:resource/:id", authenticate, put);
router.patch("/:resource/:id", authenticate, patch);
router.post("/:resource", authenticate, create);
router.delete("/:resource/:id", authenticate, requireAdmin, remove);

export default router;
