import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, users } from "@forge/db";
import { eq } from "drizzle-orm";
import { auth } from "../lib/auth.js";

const userRoutes = new Hono();

// Get current user profile
userRoutes.get("/me", async (c) => {
  const user = c.get("user");
  return c.json({ data: user });
});

// Update current user profile
userRoutes.patch(
  "/me",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1).max(255).optional(),
      avatarUrl: z.string().url().nullable().optional(),
    })
  ),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");

    await db
      .update(users)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(users.id, userId));

    const [updated] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, userId));

    return c.json({ data: updated });
  }
);

// Change password (via Better Auth)
userRoutes.post(
  "/me/password",
  zValidator(
    "json",
    z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    })
  ),
  async (c) => {
    const body = c.req.valid("json");

    try {
      await auth.api.changePassword({
        headers: c.req.raw.headers,
        body: {
          currentPassword: body.currentPassword,
          newPassword: body.newPassword,
        },
      });
      return c.json({ data: { success: true } });
    } catch {
      return c.json({ error: "Failed to change password. Check your current password." }, 400);
    }
  }
);

// List team members in a workspace
userRoutes.get("/", async (c) => {
  const workspaceId = c.req.query("workspaceId");
  return c.json({ data: [], total: 0 });
});

// Invite user to workspace
userRoutes.post(
  "/invite",
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
      workspaceId: z.string(),
      role: z.enum(["admin", "member", "viewer"]).default("member"),
    })
  ),
  async (c) => {
    const body = c.req.valid("json");
    // TODO: Send invite email, create pending membership
    return c.json({ data: { invited: body.email } }, 201);
  }
);

export { userRoutes };
