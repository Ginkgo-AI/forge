import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import * as workspaceService from "../services/workspace.service.js";

const workspaceRoutes = new Hono();

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

// List workspaces for current user
workspaceRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const workspaces = await workspaceService.listUserWorkspaces(userId);
  return c.json({ data: workspaces, total: workspaces.length });
});

// Create workspace
workspaceRoutes.post(
  "/",
  zValidator("json", createWorkspaceSchema),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const workspace = await workspaceService.createWorkspace(body, userId);
    return c.json({ data: workspace }, 201);
  }
);

// List workspace members
workspaceRoutes.get("/:id/members", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const members = await workspaceService.listWorkspaceMembers(id, userId);
  return c.json({ data: members, total: members.length });
});

// Get workspace by ID
workspaceRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const workspace = await workspaceService.getWorkspace(id, userId);
  return c.json({ data: workspace });
});

// Update workspace
workspaceRoutes.patch(
  "/:id",
  zValidator("json", createWorkspaceSchema.partial()),
  async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const workspace = await workspaceService.updateWorkspace(id, userId, body);
    return c.json({ data: workspace });
  }
);

// Delete workspace
workspaceRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  await workspaceService.deleteWorkspace(id, userId);
  return c.json({ success: true });
});

export { workspaceRoutes };
