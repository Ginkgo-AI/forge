import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import * as agentService from "../services/agent.service.js";

const agentRoutes = new Hono();

const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  workspaceId: z.string(),
  systemPrompt: z.string().max(10000),
  tools: z.array(z.string()),
  triggers: z.array(
    z.object({
      type: z.enum(["schedule", "event", "manual"]),
      config: z.record(z.unknown()),
    })
  ),
  guardrails: z
    .object({
      requireApproval: z.boolean().default(true),
      maxActionsPerRun: z.number().int().min(1).max(100).default(10),
      allowedBoardIds: z.array(z.string()).optional(),
      blockedTools: z.array(z.string()).optional(),
    })
    .optional(),
});

const updateAgentSchema = createAgentSchema.partial().extend({
  status: z.enum(["active", "paused", "disabled"]).optional(),
});

// List agents in workspace
agentRoutes.get("/", async (c) => {
  const workspaceId = c.req.query("workspaceId");
  if (!workspaceId) return c.json({ error: "workspaceId is required" }, 400);

  const userId = c.get("userId");
  const data = await agentService.listAgents(workspaceId, userId);
  return c.json({ data, total: data.length });
});

// Create agent
agentRoutes.post(
  "/",
  zValidator("json", createAgentSchema),
  async (c) => {
    const body = c.req.valid("json");
    const userId = c.get("userId");
    const agent = await agentService.createAgent(body, userId);
    return c.json({ data: agent }, 201);
  }
);

// Get agent details + run history
agentRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const agent = await agentService.getAgent(id, userId);
  return c.json({ data: agent });
});

// Update agent config
agentRoutes.patch(
  "/:id",
  zValidator("json", updateAgentSchema),
  async (c) => {
    const id = c.req.param("id");
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const agent = await agentService.updateAgent(id, userId, body);
    return c.json({ data: agent });
  }
);

// Delete agent
agentRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  await agentService.deleteAgent(id, userId);
  return c.json({ success: true });
});

// Trigger agent run manually
agentRoutes.post("/:id/run", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const result = await agentService.runAgent(
    id,
    userId,
    body.prompt,
    userId
  );
  return c.json({ data: result });
});

export { agentRoutes };
