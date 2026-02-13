import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  getWorkspace,
  updateWorkspace,
  listWorkspaceMembers,
  checkWorkspaceAccess,
} from "../services/workspace.service.js";
import { getAvailableProviders } from "../lib/ai/provider-registry.js";

const settingsRoutes = new Hono();

// Workspace settings
settingsRoutes.get("/workspace/:id", async (c) => {
  const userId = c.get("userId");
  const ws = await getWorkspace(c.req.param("id"), userId);
  const members = await listWorkspaceMembers(c.req.param("id"), userId);
  return c.json({ data: { ...ws, members } });
});

settingsRoutes.patch(
  "/workspace/:id",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1).max(255).optional(),
      description: z.string().max(1000).optional(),
    })
  ),
  async (c) => {
    const userId = c.get("userId");
    const updated = await updateWorkspace(c.req.param("id"), userId, c.req.valid("json"));
    return c.json({ data: updated });
  }
);

// AI settings
settingsRoutes.get("/ai", async (c) => {
  const providers = getAvailableProviders();
  return c.json({
    data: {
      providers,
      defaultProvider: providers.find((p) => p.isDefault)?.providerId ?? null,
      defaultModel: providers.find((p) => p.isDefault)?.defaultModel ?? null,
    },
  });
});

settingsRoutes.patch(
  "/ai",
  zValidator(
    "json",
    z.object({
      defaultProvider: z.string().optional(),
      defaultModel: z.string().optional(),
    })
  ),
  async (c) => {
    // AI settings are env-based for now, return current config
    const providers = getAvailableProviders();
    return c.json({
      data: {
        providers,
        defaultProvider: providers.find((p) => p.isDefault)?.providerId ?? null,
        defaultModel: providers.find((p) => p.isDefault)?.defaultModel ?? null,
      },
    });
  }
);

export { settingsRoutes };
