import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const userRoutes = new Hono();

// Get current user profile
userRoutes.get("/me", async (c) => {
  const user = c.get("user");
  return c.json({ data: user });
});

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
