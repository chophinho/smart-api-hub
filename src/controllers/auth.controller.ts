import { Request, Response, NextFunction } from "express";
import { db } from "../db/knet";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "1d";
const SALT_ROUNDS = 10;

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email và password là bắt buộc" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password phải ít nhất 6 ký tự" });
    }

    const existing = await db("user").where({ email }).first();
    if (existing) {
      return res.status(409).json({ error: "email đã tồn tại" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [user] = await db("user")
      .insert({
        email,
        password: hashedPassword,
        role: role === "admin" ? "admin" : "user",
      })
      .returning(["id", "email", "role", "created_at"]);

    return res.status(201).json({ message: "Đăng ký thành công", user });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email và password là bắt buộc" });
    }

    // Tìm user
    const user = await db("user").where({ email }).first();
    if (!user) {
      return res.status(401).json({ error: "Sai email hoặc password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Sai email hoặc password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES } as jwt.SignOptions,
    );

    return res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
}
