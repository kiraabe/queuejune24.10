import type { RequestHandler } from "express";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { getPool, isDbEnabled } from "../store/db";
import { hashPassword } from "../utils/auth";

/**
 * Setup endpoint to create/reset admin user
 * This should only be available on first setup
 */
export const setupAdmin: RequestHandler = async (req, res) => {
  const setupSecret = process.env.ADMIN_SETUP_SECRET;
  const suppliedSecret = req.get("x-admin-setup-secret");
  if (!setupSecret) {
    return res.status(503).json({ error: "Admin setup is not configured" });
  }
  const suppliedSecretBytes = Buffer.from(suppliedSecret || "");
  const setupSecretBytes = Buffer.from(setupSecret || "");
  if (
    !suppliedSecret ||
    suppliedSecretBytes.length !== setupSecretBytes.length ||
    !timingSafeEqual(suppliedSecretBytes, setupSecretBytes)
  ) {
    return res.status(403).json({ error: "Invalid setup credentials" });
  }
  if (!isDbEnabled) {
    return res.status(400).json({
      error: "Database not enabled",
      message: "Database connection is required for setup",
    });
  }

  try {
    const { username, password } = req.body ?? {};
    if (
      typeof username !== "string" || username.trim().length < 3 || username.trim().length > 100 ||
      typeof password !== "string" || password.length < 12
    ) {
      return res.status(400).json({
        error: "A username and password of at least 12 characters are required",
      });
    }

    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext('queue-admin-bootstrap'))");
      const { rows } = await client.query(`SELECT COUNT(*)::int AS c FROM users`);
      if (Number(rows[0]?.c || 0) > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Users already exist" });
      }

      const userId = randomUUID();
      await client.query(
        `INSERT INTO users (id, username, password_hash, window_id, disabled, job_title_id)
         VALUES ($1, $2, $3, NULL, false, NULL)`,
        [userId, username.trim(), hashPassword(password)],
      );
      await client.query(
        `INSERT INTO user_roles (user_id, role, is_primary) VALUES ($1, 'admin', true)`,
        [userId],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    res.json({
      ok: true,
      message: "Admin user created successfully",
      user: { username: username.trim(), role: "admin" },
    });
  } catch (error) {
    console.error("Setup error:", error);
    res.status(500).json({
      error: "Setup failed",
      message: (error as any)?.message || "An error occurred during setup",
      details:
        process.env.NODE_ENV === "development" ? String(error) : undefined,
    });
  }
};
