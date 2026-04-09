import { Request, Response, NextFunction } from "express";

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const requestTracker = new Map<string, RateLimitInfo>();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 4;

export const rateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const clientIp = req.ip || req.socket.remoteAddress || "unknown";
  const currentTime = Date.now();

  const record = requestTracker.get(clientIp);
  console.log("IP:", clientIp);

  if (!record || currentTime > record.resetTime) {
    requestTracker.set(clientIp, {
      count: 1,
      resetTime: currentTime + WINDOW_MS,
    });
    return next();
  }

  record.count++;

  if (record.count > MAX_REQUESTS) {
    res.status(429).json({
      status: 429,
      error: "Too Many Requests",
      message: `Bạn đã vượt quá giới hạn ${MAX_REQUESTS} request/phút. Vui lòng thử lại sau.`,
      retryAfter: Math.ceil((record.resetTime - currentTime) / 1000) + "s",
    });
    return;
  }

  next();
};

setInterval(
  () => {
    const now = Date.now();
    for (const [ip, info] of requestTracker.entries()) {
      if (now > info.resetTime) {
        requestTracker.delete(ip);
      }
    }
  },
  5 * 60 * 1000,
);
