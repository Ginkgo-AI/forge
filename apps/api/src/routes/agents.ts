import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const agentRoutes = new Hono();

const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  workspaceId: z.string(),
  systemPrompt: z.string().max(10000),
  tools: z.array(z.string()), // MCP tool IDs
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
    })
    .optional(),
});

// List agents in workspace
agentRoutes.get("/", async (c) => {
  const workspaceId = c.req.query("workspaceId");
  return c.json({ data: [], total: 0 });
});

// Create agent
agentRoutes.post(
  "/",
  zValidator("json", createAgentSchema),
  async (c) => {
    const body = c.req.valid("json");
    return c.json(
      {
        data: {
          id: "agent_placeholder",
          ...body,
          status: "active",
          createdAt: new Date(),
        },
      },
      201
    );
  }
);

// Get agent details + run history
agentRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  return c.json({
    data: { id, name: "Placeholder Agent", runs: [] },
  });
});

// Trigger agent run manually
agentRoutes.post("/:id/run", async (c) => {
  const id = c.req.param("id");
  // TODO: Queue agent run via BullMQ
  return c.json({
    data: { runId: "run_placeholder", agentId: id, status: "queued" },
  });
});

// Update agent config
agentRoutes.patch(
  "/:id",
  zValidator("json", createAgentSchema.partial()),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    return c.json({ data: { id, ...body } });
  }
);

// Delete agent
agentRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  return c.json({ success: true });
});

export { agentRoutes };
