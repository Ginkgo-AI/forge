import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AutomationCondition } from "@forge/db";
import * as automationService from "../services/automation.service.js";

const automationRoutes = new Hono();

const triggerSchema = z.object({
  type: z.enum([
    "status_change",
    "column_change",
    "item_created",
    "item_deleted",
    "date_arrived",
    "recurring",
    "webhook",
  ]),
  config: z.record(z.unknown()).default({}),
});

const conditionSchema: z.ZodType<AutomationCondition> = z.object({
  columnId: z.string(),
  operator: z.enum([
    "equals",
    "not_equals",
    "contains",
    "greater_than",
    "less_than",
    "is_empty",
    "is_not_empty",
  ]),
  value: z.unknown().transform((v) => v ?? null),
}) as z.ZodType<AutomationCondition>;

const actionSchema = z.object({
  type: z.enum([
    "change_column",
    "create_item",
    "move_item",
    "notify",
    "send_email",
    "webhook",
    "ai_step",
  ]),
  config: z.record(z.unknown()).default({}),
});

const createSchema = z.object({
  boardId: z.string(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  trigger: triggerSchema,
  conditions: z.array(conditionSchema).optional(),
  actions: z.array(actionSchema).min(1),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  trigger: triggerSchema.optional(),
  conditions: z.array(conditionSchema).optional(),
  actions: z.array(actionSchema).min(1).optional(),
  status: z.enum(["active", "paused", "disabled"]).optional(),
});

// List automations for a board
automationRoutes.get("/", async (c) => {
  const boardId = c.req.query("boardId");
  if (!boardId) return c.json({ error: "boardId is required" }, 400);

  const userId = c.get("userId");
  const data = await automationService.listAutomations(boardId, userId);
  return c.json({ data, total: data.length });
});

// Create automation
automationRoutes.post(
  "/",
  zValidator("json", createSchema),
  async (c) => {
    const body = c.req.valid("json");
    const userId = c.get("userId");
    const automation = await automationService.createAutomation(body, userId);
    return c.json({ data: automation }, 201);
  }
);

// Get automation with logs
automationRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const automation = await automationService.getAutomation(id, userId);
  return c.json({ data: automation });
});

// Update automation
automationRoutes.patch(
  "/:id",
  zValidator("json", updateSchema),
  async (c) => {
    const id = c.req.param("id");
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const automation = await automationService.updateAutomation(
      id,
      userId,
      body
    );
    return c.json({ data: automation });
  }
);

// Delete automation
automationRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  await automationService.deleteAutomation(id, userId);
  return c.json({ success: true });
});

// Manual trigger for testing
automationRoutes.post("/:id/trigger", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  await automationService.executeAutomation(id, body, userId);
  return c.json({ success: true, message: "Automation triggered" });
});

export { automationRoutes };
