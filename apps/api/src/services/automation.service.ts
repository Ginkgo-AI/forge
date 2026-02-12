import {
  db,
  automations,
  automationLogs,
  boards,
} from "@forge/db";
import type {
  AutomationTrigger,
  AutomationCondition,
  AutomationAction,
} from "@forge/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { generateId } from "../lib/id.js";
import { logActivity } from "../lib/activity.js";
import { NotFoundError } from "../lib/errors.js";
import { checkWorkspaceAccess } from "./workspace.service.js";
import { eventBus, type ForgeEvent } from "../lib/event-bus.js";
import { getProvider, getDefaultModel } from "../lib/ai/provider-registry.js";
import * as itemService from "./item.service.js";

// ── Helpers ──

async function getBoardWithAccess(boardId: string, userId: string) {
  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
  if (!board) throw new NotFoundError("Board", boardId);
  await checkWorkspaceAccess(board.workspaceId, userId);
  return board;
}

async function getAutomationWithAccess(id: string, userId: string) {
  const [automation] = await db
    .select()
    .from(automations)
    .where(eq(automations.id, id));
  if (!automation) throw new NotFoundError("Automation", id);
  await getBoardWithAccess(automation.boardId, userId);
  return automation;
}

// ── CRUD ──

export async function listAutomations(boardId: string, userId: string) {
  await getBoardWithAccess(boardId, userId);
  return db
    .select()
    .from(automations)
    .where(eq(automations.boardId, boardId))
    .orderBy(automations.createdAt);
}

export async function createAutomation(
  data: {
    boardId: string;
    name: string;
    description?: string;
    trigger: AutomationTrigger;
    conditions?: AutomationCondition[];
    actions: AutomationAction[];
  },
  userId: string
) {
  const board = await getBoardWithAccess(data.boardId, userId);
  const id = generateId("automation");

  await db.insert(automations).values({
    id,
    boardId: data.boardId,
    name: data.name,
    description: data.description ?? null,
    trigger: data.trigger,
    conditions: data.conditions ?? [],
    actions: data.actions,
    createdById: userId,
  });

  await logActivity({
    workspaceId: board.workspaceId,
    boardId: data.boardId,
    type: "automation_triggered",
    actorId: userId,
    changes: { description: `Created automation '${data.name}'` },
  });

  const [automation] = await db
    .select()
    .from(automations)
    .where(eq(automations.id, id));

  // Register listener for the new automation
  registerAutomationListener(id);

  return automation;
}

export async function getAutomation(id: string, userId: string) {
  const automation = await getAutomationWithAccess(id, userId);

  const logs = await db
    .select()
    .from(automationLogs)
    .where(eq(automationLogs.automationId, id))
    .orderBy(desc(automationLogs.executedAt))
    .limit(20);

  return { ...automation, logs };
}

export async function updateAutomation(
  id: string,
  userId: string,
  data: {
    name?: string;
    description?: string;
    trigger?: AutomationTrigger;
    conditions?: AutomationCondition[];
    actions?: AutomationAction[];
    status?: "active" | "paused" | "disabled";
  }
) {
  await getAutomationWithAccess(id, userId);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.trigger !== undefined) updateData.trigger = data.trigger;
  if (data.conditions !== undefined) updateData.conditions = data.conditions;
  if (data.actions !== undefined) updateData.actions = data.actions;
  if (data.status !== undefined) updateData.status = data.status;

  await db.update(automations).set(updateData).where(eq(automations.id, id));

  // Re-register listener with updated config
  unregisterAutomationListener(id);
  const [updated] = await db
    .select()
    .from(automations)
    .where(eq(automations.id, id));

  if (updated.status === "active") {
    registerAutomationListener(id);
  }

  return updated;
}

export async function deleteAutomation(id: string, userId: string) {
  await getAutomationWithAccess(id, userId);
  unregisterAutomationListener(id);
  await db.delete(automations).where(eq(automations.id, id));
}

// ── Execution Engine ──

export async function executeAutomation(
  id: string,
  triggerData: Record<string, unknown>,
  userId: string
) {
  const [automation] = await db
    .select()
    .from(automations)
    .where(eq(automations.id, id));
  if (!automation) return;

  const actionsExecuted: Array<{
    action: string;
    result: unknown;
    error?: string;
  }> = [];
  let success = true;
  let errorMsg: string | undefined;

  try {
    // Evaluate conditions against current column values
    if (
      automation.conditions &&
      automation.conditions.length > 0 &&
      triggerData.columnValues
    ) {
      const passes = evaluateConditions(
        automation.conditions,
        triggerData.columnValues as Record<string, unknown>
      );
      if (!passes) return;
    }

    // Execute actions sequentially
    for (const action of automation.actions) {
      try {
        const result = await executeAction(action, triggerData, userId);
        actionsExecuted.push({ action: action.type, result });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Action failed";
        actionsExecuted.push({ action: action.type, result: null, error: msg });
        success = false;
        errorMsg = msg;
        break;
      }
    }
  } catch (err: unknown) {
    success = false;
    errorMsg = err instanceof Error ? err.message : "Automation execution failed";
  }

  // Log execution
  await db.insert(automationLogs).values({
    id: generateId("activity"),
    automationId: id,
    triggerData,
    actionsExecuted,
    success,
    error: errorMsg ?? null,
  });

  // Update run count and last run time
  await db
    .update(automations)
    .set({
      runCount: sql`${automations.runCount} + 1`,
      lastRunAt: new Date(),
    })
    .where(eq(automations.id, id));
}

function evaluateConditions(
  conditions: AutomationCondition[],
  columnValues: Record<string, unknown>
): boolean {
  // AND logic: all conditions must pass
  return conditions.every((cond) => {
    const actual = columnValues[cond.columnId];

    switch (cond.operator) {
      case "equals":
        return actual === cond.value;
      case "not_equals":
        return actual !== cond.value;
      case "contains":
        return String(actual ?? "").includes(String(cond.value));
      case "greater_than":
        return Number(actual) > Number(cond.value);
      case "less_than":
        return Number(actual) < Number(cond.value);
      case "is_empty":
        return actual == null || actual === "";
      case "is_not_empty":
        return actual != null && actual !== "";
      default:
        return true;
    }
  });
}

async function executeAction(
  action: AutomationAction,
  context: Record<string, unknown>,
  userId: string
): Promise<unknown> {
  const { type, config } = action;

  switch (type) {
    case "change_column":
      return itemService.updateItem(
        context.itemId as string,
        userId,
        { columnValues: { [config.columnId as string]: config.value } },
        { emitEvents: false }
      );

    case "create_item":
      return itemService.createItem(
        {
          boardId: (config.boardId as string) || (context.boardId as string),
          groupId: config.groupId as string,
          name: config.value as string,
          columnValues: config.columnValues as
            | Record<string, unknown>
            | undefined,
        },
        userId,
        { emitEvents: false }
      );

    case "move_item":
      return itemService.updateItem(
        context.itemId as string,
        userId,
        { groupId: config.groupId as string },
        { emitEvents: false }
      );

    case "ai_step": {
      const provider = getProvider();
      const model = getDefaultModel();
      const { text } = await provider.complete({
        model,
        messages: [{ role: "user", content: config.aiPrompt as string }],
        maxTokens: 2048,
      });
      return { aiResponse: text };
    }

    case "notify":
      console.log(`[Automation] Notify: ${config.message}`);
      return { notified: true, message: config.message };

    case "send_email":
      console.log(`[Automation] Send email to ${config.userId}: ${config.message}`);
      return { sent: true };

    case "webhook":
      console.log(`[Automation] Webhook to ${config.webhookUrl}`);
      return { webhookFired: true };

    default:
      throw new Error(`Unknown action type: ${type}`);
  }
}

// ── Listener Lifecycle ──

const activeListeners = new Map<string, (event: ForgeEvent) => void>();

function matchesTrigger(
  trigger: AutomationTrigger,
  event: ForgeEvent
): boolean {
  switch (trigger.type) {
    case "status_change":
      if (event.type !== "column_value_changed") return false;
      if (trigger.config.columnId && trigger.config.columnId !== event.columnId)
        return false;
      if (
        trigger.config.fromValue !== undefined &&
        trigger.config.fromValue !== event.oldValue
      )
        return false;
      if (
        trigger.config.toValue !== undefined &&
        trigger.config.toValue !== event.newValue
      )
        return false;
      return true;

    case "column_change":
      if (event.type !== "column_value_changed") return false;
      if (trigger.config.columnId && trigger.config.columnId !== event.columnId)
        return false;
      return true;

    case "item_created":
      return event.type === "item_created";

    case "item_deleted":
      return event.type === "item_deleted";

    default:
      return false;
  }
}

export function registerAutomationListener(id: string) {
  // Remove any existing listener first
  unregisterAutomationListener(id);

  const handler = async (event: ForgeEvent) => {
    try {
      const [automation] = await db
        .select()
        .from(automations)
        .where(eq(automations.id, id));

      if (!automation || automation.status !== "active") return;
      if (automation.boardId !== event.boardId) return;
      if (!matchesTrigger(automation.trigger, event)) return;

      const triggerData: Record<string, unknown> = {
        eventType: event.type,
        boardId: event.boardId,
        itemId: event.itemId,
        actorId: event.actorId,
      };

      // Add column-specific data
      if (event.type === "column_value_changed") {
        triggerData.columnId = event.columnId;
        triggerData.oldValue = event.oldValue;
        triggerData.newValue = event.newValue;
      }

      await executeAutomation(id, triggerData, event.actorId);
    } catch (err) {
      console.error(`[Automation ${id}] Error handling event:`, err);
    }
  };

  activeListeners.set(id, handler);
  eventBus.on("*", handler);
}

export function unregisterAutomationListener(id: string) {
  const handler = activeListeners.get(id);
  if (handler) {
    eventBus.off("*", handler);
    activeListeners.delete(id);
  }
}

export async function initAutomationListeners() {
  const activeAutomations = await db
    .select()
    .from(automations)
    .where(eq(automations.status, "active"));

  for (const automation of activeAutomations) {
    registerAutomationListener(automation.id);
  }

  console.log(
    `[Automations] Registered ${activeAutomations.length} automation listener(s)`
  );
}
