import express from "express";
import "dotenv/config";
import resourceRouter from "./routes/resource.route";
import authRouter from "./routes/auth.route";
import { runMigrate } from "./db/migrate";
import { errorHandler } from "./middlewares/error.handler";
import { rateLimiter } from "./middlewares/rate.limit";

const app = express();
app.use(express.json());

app.get("/health", rateLimiter, (req, res) => {
  res.json({ message: "pg-json-server đang chạy! " });
});

app.use("/auth", authRouter);
app.use("/", resourceRouter);

app.use(errorHandler);

const PORT = 3000;

app.listen(PORT, async () => {
  try {
    await runMigrate();
  } catch (error) {
    console.error(">>> Migration Error:", error);
  }
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
