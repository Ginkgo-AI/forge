import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import * as dashboardService from "../services/dashboard.service.js";
import * as aiService from "../services/ai.service.js";

const dashboardRoutes = new Hono();

// Workspace stats
dashboardRoutes.get("/stats", async (c) => {
  const workspaceId = c.req.query("workspaceId");
  if (!workspaceId) return c.json({ error: "workspaceId is required" }, 400);

  const userId = c.get("userId");
  const data = await dashboardService.getWorkspaceStats(workspaceId, userId);
  return c.json({ data });
});

// Activity feed
dashboardRoutes.get("/activity", async (c) => {
  const workspaceId = c.req.query("workspaceId");
  if (!workspaceId) return c.json({ error: "workspaceId is required" }, 400);

  const limit = parseInt(c.req.query("limit") || "20", 10);
  const userId = c.get("userId");
  const data = await dashboardService.getActivityFeed(
    workspaceId,
    userId,
    limit
  );
  return c.json({ data });
});

// Activity timeline (daily counts)
dashboardRoutes.get("/timeline", async (c) => {
  const workspaceId = c.req.query("workspaceId");
  if (!workspaceId) return c.json({ error: "workspaceId is required" }, 400);

  const days = parseInt(c.req.query("days") || "14", 10);
  const userId = c.get("userId");
  const data = await dashboardService.getActivityTimeline(
    workspaceId,
    userId,
    days
  );
  return c.json({ data });
});

// Per-board item breakdown
dashboardRoutes.get("/board-breakdown", async (c) => {
  const workspaceId = c.req.query("workspaceId");
  if (!workspaceId) return c.json({ error: "workspaceId is required" }, 400);

  const userId = c.get("userId");
  const data = await dashboardService.getBoardBreakdown(workspaceId, userId);
  return c.json({ data });
});

const reportSchema = z.object({
  workspaceId: z.string(),
  providerId: z.string().optional(),
  model: z.string().optional(),
});

// Generate AI narrative report
dashboardRoutes.post(
  "/report",
  zValidator("json", reportSchema),
  async (c) => {
    const { workspaceId, providerId, model } = c.req.valid("json");
    const userId = c.get("userId");
    const data = await aiService.generateReport(
      workspaceId,
      userId,
      providerId,
      model
    );
    return c.json({ data });
  }
);

export { dashboardRoutes };
