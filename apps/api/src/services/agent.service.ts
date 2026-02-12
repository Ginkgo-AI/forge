import { db, agents, agentRuns } from "@forge/db";
import type {
  AgentTrigger,
  AgentGuardrails,
  AgentMessage,
  AgentToolCall,
} from "@forge/db";
import { eq, desc } from "drizzle-orm";
import { generateId } from "../lib/id.js";
import { logActivity } from "../lib/activity.js";
import { NotFoundError } from "../lib/errors.js";
import { checkWorkspaceAccess } from "./workspace.service.js";
import { eventBus, type ForgeEvent } from "../lib/event-bus.js";
import { getProvider, getDefaultModel } from "../lib/ai/provider-registry.js";
import { neutralToolDefs } from "../lib/ai/tool-defs.js";
import { executeTool } from "../lib/ai-tools.js";
import type {
  NeutralMessage,
  NeutralContentBlock,
  NeutralToolResultBlock,
} from "../lib/ai/types.js";

const MAX_TOKENS = 4096;

// ── CRUD ──

export async function listAgents(workspaceId: string, userId: string) {
  await checkWorkspaceAccess(workspaceId, userId);
  return db
    .select()
    .from(agents)
    .where(eq(agents.workspaceId, workspaceId))
    .orderBy(agents.createdAt);
}

export async function createAgent(
  data: {
    workspaceId: string;
    name: string;
    description?: string;
    systemPrompt: string;
    tools: string[];
    triggers: AgentTrigger[];
    guardrails?: AgentGuardrails;
  },
  userId: string
) {
  await checkWorkspaceAccess(data.workspaceId, userId);
  const id = generateId("agent");

  await db.insert(agents).values({
    id,
    workspaceId: data.workspaceId,
    name: data.name,
    description: data.description ?? null,
    systemPrompt: data.systemPrompt,
    tools: data.tools,
    triggers: data.triggers,
    guardrails: data.guardrails ?? {
      requireApproval: true,
      maxActionsPerRun: 10,
    },
    createdById: userId,
  });

  await logActivity({
    workspaceId: data.workspaceId,
    type: "agent_action",
    actorId: userId,
    changes: { description: `Created agent '${data.name}'` },
  });

  const [agent] = await db.select().from(agents).where(eq(agents.id, id));

  // Register event listeners if applicable
  registerAgentEventListeners(id);

  return agent;
}

export async function getAgent(id: string, userId: string) {
  const [agent] = await db.select().from(agents).where(eq(agents.id, id));
  if (!agent) throw new NotFoundError("Agent", id);
  await checkWorkspaceAccess(agent.workspaceId, userId);

  const runs = await db
    .select()
    .from(agentRuns)
    .where(eq(agentRuns.agentId, id))
    .orderBy(desc(agentRuns.createdAt))
    .limit(20);

  return { ...agent, runs };
}

export async function updateAgent(
  id: string,
  userId: string,
  data: {
    name?: string;
    description?: string;
    systemPrompt?: string;
    tools?: string[];
    triggers?: AgentTrigger[];
    guardrails?: AgentGuardrails;
    status?: "active" | "paused" | "disabled";
  }
) {
  const [agent] = await db.select().from(agents).where(eq(agents.id, id));
  if (!agent) throw new NotFoundError("Agent", id);
  await checkWorkspaceAccess(agent.workspaceId, userId);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.systemPrompt !== undefined)
    updateData.systemPrompt = data.systemPrompt;
  if (data.tools !== undefined) updateData.tools = data.tools;
  if (data.triggers !== undefined) updateData.triggers = data.triggers;
  if (data.guardrails !== undefined) updateData.guardrails = data.guardrails;
  if (data.status !== undefined) updateData.status = data.status;

  await db.update(agents).set(updateData).where(eq(agents.id, id));

  // Re-register event listeners
  unregisterAgentEventListeners(id);
  const [updated] = await db.select().from(agents).where(eq(agents.id, id));
  if (updated.status === "active") {
    registerAgentEventListeners(id);
  }

  return updated;
}

export async function deleteAgent(id: string, userId: string) {
  const [agent] = await db.select().from(agents).where(eq(agents.id, id));
  if (!agent) throw new NotFoundError("Agent", id);
  await checkWorkspaceAccess(agent.workspaceId, userId);
  unregisterAgentEventListeners(id);
  await db.delete(agents).where(eq(agents.id, id));
}

// ── Execution Engine ──

export async function runAgent(
  agentId: string,
  triggeredBy: string,
  userPrompt?: string,
  userId?: string
) {
  const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
  if (!agent) throw new NotFoundError("Agent", agentId);

  // Create run record
  const runId = generateId("run");
  await db.insert(agentRuns).values({
    id: runId,
    agentId,
    triggeredBy,
    status: "running",
    startedAt: new Date(),
  });

  const allToolCalls: AgentToolCall[] = [];
  const allMessages: AgentMessage[] = [];

  try {
    const provider = getProvider();
    const model = getDefaultModel();

    // Filter tools by agent configuration
    const allowedToolNames = new Set(agent.tools);
    const blockedTools = new Set(agent.guardrails?.blockedTools ?? []);
    const filteredTools = neutralToolDefs.filter(
      (t) =>
        allowedToolNames.has(t.name) && !blockedTools.has(t.name)
    );

    const maxActions = agent.guardrails?.maxActionsPerRun ?? 10;
    let actionCount = 0;

    // Build initial messages
    const prompt =
      userPrompt || "Execute your task based on your system prompt.";
    const messages: NeutralMessage[] = [{ role: "user", content: prompt }];

    allMessages.push({
      role: "user",
      content: prompt,
      timestamp: new Date().toISOString(),
    });

    // Agentic tool loop (same pattern as ai.service.ts)
    let fullAssistantText = "";

    while (true) {
      const { events, result } = provider.streamChat({
        model,
        systemPrompt: agent.systemPrompt,
        messages,
        tools: filteredTools,
        maxTokens: MAX_TOKENS,
      });

      // Consume stream
      let currentText = "";
      for await (const event of events) {
        if (event.type === "text_delta") {
          currentText += event.text;
          fullAssistantText += event.text;
        }
      }

      const streamResult = await result;

      // No tool calls — we're done
      if (
        streamResult.stopReason !== "tool_use" ||
        streamResult.toolCalls.length === 0
      ) {
        break;
      }

      // Build assistant message with content blocks
      const assistantBlocks: NeutralContentBlock[] = [];
      if (currentText) {
        assistantBlocks.push({ type: "text", text: currentText });
      }
      for (const tc of streamResult.toolCalls) {
        assistantBlocks.push({
          type: "tool_use",
          id: tc.id,
          name: tc.name,
          input: tc.input,
        });
      }
      messages.push({ role: "assistant", content: assistantBlocks });

      // Execute tool calls
      const toolResultBlocks: NeutralToolResultBlock[] = [];

      for (const tool of streamResult.toolCalls) {
        // Check action limit
        if (actionCount >= maxActions) {
          toolResultBlocks.push({
            type: "tool_result",
            toolCallId: tool.id,
            content: "Action limit reached. No more actions allowed in this run.",
            isError: true,
          });
          continue;
        }

        // Check board access guardrails
        if (agent.guardrails?.allowedBoardIds?.length) {
          const boardId =
            (tool.input.boardId as string) ?? (tool.input.itemId as string);
          // Simple check — if the tool specifies a boardId, verify it's allowed
          if (
            boardId &&
            tool.input.boardId &&
            !agent.guardrails.allowedBoardIds.includes(
              tool.input.boardId as string
            )
          ) {
            toolResultBlocks.push({
              type: "tool_result",
              toolCallId: tool.id,
              content: "Access denied: board not in allowed list.",
              isError: true,
            });
            continue;
          }
        }

        let toolResult: unknown;
        let isError = false;
        try {
          toolResult = await executeTool(
            tool.name,
            tool.input,
            userId || triggeredBy
          );
        } catch (err: unknown) {
          isError = true;
          toolResult =
            err instanceof Error ? err.message : "Tool execution failed";
        }

        actionCount++;

        allToolCalls.push({
          id: tool.id,
          tool: tool.name,
          input: tool.input,
          output: toolResult,
          timestamp: new Date().toISOString(),
        });

        toolResultBlocks.push({
          type: "tool_result",
          toolCallId: tool.id,
          content: JSON.stringify(toolResult),
          isError,
        });
      }

      messages.push({ role: "tool", content: toolResultBlocks });

      // Safety: break if we've hit the action limit
      if (actionCount >= maxActions) break;
    }

    // Save assistant response
    allMessages.push({
      role: "assistant",
      content: fullAssistantText,
      timestamp: new Date().toISOString(),
    });

    // Update run as completed
    await db
      .update(agentRuns)
      .set({
        status: "completed",
        messages: allMessages,
        toolCalls: allToolCalls,
        completedAt: new Date(),
      })
      .where(eq(agentRuns.id, runId));

    await logActivity({
      workspaceId: agent.workspaceId,
      type: "agent_action",
      actorId: userId || triggeredBy,
      actorType: "agent",
      changes: {
        description: `Agent '${agent.name}' completed run with ${allToolCalls.length} tool call(s)`,
      },
    });

    return {
      runId,
      status: "completed",
      toolCalls: allToolCalls,
      messages: allMessages,
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Agent run failed";

    await db
      .update(agentRuns)
      .set({
        status: "failed",
        error: errorMsg,
        messages: allMessages,
        toolCalls: allToolCalls,
        completedAt: new Date(),
      })
      .where(eq(agentRuns.id, runId));

    return { runId, status: "failed", error: errorMsg };
  }
}

// ── Event Listeners ──

const activeListeners = new Map<string, (event: ForgeEvent) => void>();

export function registerAgentEventListeners(id: string) {
  unregisterAgentEventListeners(id);

  const handler = async (event: ForgeEvent) => {
    try {
      const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, id));
      if (!agent || agent.status !== "active") return;

      // Check if any trigger matches this event
      const matchingTrigger = agent.triggers.find((t) => {
        if (t.type !== "event") return false;
        if (t.config.eventType && t.config.eventType !== event.type)
          return false;
        if (t.config.boardId && t.config.boardId !== event.boardId)
          return false;
        return true;
      });

      if (!matchingTrigger) return;

      const prompt = `An event occurred: ${event.type} on board ${event.boardId}, item ${event.itemId}. Take appropriate action based on your role.`;

      await runAgent(id, "event", prompt, event.actorId);
    } catch (err) {
      console.error(`[Agent ${id}] Error handling event:`, err);
    }
  };

  // Only register if agent has event triggers
  // We need to check this async, so we wrap it
  (async () => {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    if (!agent) return;

    const hasEventTriggers = agent.triggers.some((t) => t.type === "event");
    if (!hasEventTriggers) return;

    activeListeners.set(id, handler);
    eventBus.on("*", handler);
  })().catch((err) =>
    console.error(`[Agent ${id}] Failed to register listener:`, err)
  );
}

export function unregisterAgentEventListeners(id: string) {
  const handler = activeListeners.get(id);
  if (handler) {
    eventBus.off("*", handler);
    activeListeners.delete(id);
  }
}

export async function initAgentListeners() {
  const activeAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.status, "active"));

  let count = 0;
  for (const agent of activeAgents) {
    const hasEventTriggers = agent.triggers.some((t) => t.type === "event");
    if (hasEventTriggers) {
      registerAgentEventListeners(agent.id);
      count++;
    }
  }

  console.log(
    `[Agents] Registered ${count} agent event listener(s) out of ${activeAgents.length} active agent(s)`
  );
}
