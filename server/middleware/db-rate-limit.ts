import { Request, Response, NextFunction } from "express";
import { checkQueryRateLimit, getActiveConnectionsCount } from "../services/query-rate-limiter";
import { findSessionByToken, SESSION_COOKIE, SESSION_IDLE_TIMEOUT_SECONDS } from "../store/sessions";
import { parseCookies } from "../utils/auth";

/**
 * Express middleware for database rate limiting
 * Checks query and connection limits for authenticated users
 */
export function dbRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Extract user ID from request (should be set by auth middleware)
  const userId = (req as any).userId;

  // Skip rate limiting if no user is authenticated
  if (!userId) {
    return next();
  }

  // Check query rate limit
  const rateLimitStatus = checkQueryRateLimit(userId);

  if (!rateLimitStatus.allowed) {
    const resetDate = new Date(rateLimitStatus.resetAt);
    return res.status(429).json({
      error: "Rate limit exceeded",
      code: "DB_RATE_LIMIT_EXCEEDED",
      message: `Database query limit exceeded (${rateLimitStatus.limit} queries per ${rateLimitStatus.windowSeconds}s)`,
      limit: rateLimitStatus.limit,
      windowSeconds: rateLimitStatus.windowSeconds,
      resetAt: rateLimitStatus.resetAt,
      retryAfter: Math.ceil((rateLimitStatus.resetAt - Date.now()) / 1000),
    });
  }

  // Set rate limit headers in response
  res.setHeader("X-RateLimit-Limit", rateLimitStatus.limit.toString());
  res.setHeader("X-RateLimit-Remaining", rateLimitStatus.remaining.toString());
  res.setHeader(
    "X-RateLimit-Reset",
    Math.ceil(rateLimitStatus.resetAt / 1000).toString()
  );

  // Log high usage
  if (rateLimitStatus.remaining <= 10) {
    console.warn(
      `[DB-Rate-Limit] User ${userId} approaching limit: ${rateLimitStatus.remaining} queries remaining`
    );
  }

  next();
}

/**
 * Optional: Stricter rate limiting for write operations
 * Returns 429 if too many concurrent write operations
 */
export function strictDbRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = (req as any).userId;
  if (!userId) return next();

  // Only apply strict limit to state-changing operations
  const isWriteOperation = ["POST", "PUT", "PATCH", "DELETE"].includes(
    req.method
  );

  // Exclude lightweight heartbeat/session pings from strict rate limiting
  const isHeartbeat =
    req.path === "/api/session/ping" ||
    req.path === "/api/auth/heartbeat" ||
    req.path === "/api/auth/me";

  if (isWriteOperation && !isHeartbeat) {
    const activeConnections = getActiveConnectionsCount(userId);
    // Stricter limit: max 2 concurrent writes per user
    if (activeConnections > 2) {
      return res.status(429).json({
        error: "Too many concurrent operations",
        code: "DB_CONCURRENT_OPERATION_LIMIT",
        message: "Too many concurrent write operations. Please try again.",
        activeConnections,
        maxAllowed: 2,
      });
    }
  }

  next();
}

/**
 * Middleware to extract and validate user ID from various sources
 * This should run AFTER authentication middleware
 */
export async function extractUserIdMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const userId =
      (req as any).session?.userId ||
      (req as any).user?.id ||
      (req as any).auth?.id;

    if (userId) {
      (req as any).userId = userId;
      return next();
    }

    const token = parseCookies(req.headers.cookie || "")[SESSION_COOKIE];
    if (!token) return next();

    const session = await findSessionByToken(token);
    const now = Date.now();
    if (
      session &&
      !session.revokedAt &&
      now <= session.expiresAt.getTime() &&
      now - session.lastActivityAt.getTime() <= SESSION_IDLE_TIMEOUT_SECONDS * 1000
    ) {
      (req as any).userId = session.userId;
    }

    next();
  } catch (error) {
    next(error);
  }
}
