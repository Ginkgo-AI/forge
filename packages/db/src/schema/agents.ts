import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  jsonb,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.js";
import { users } from "./users.js";

export const agentStatusEnum = pgEnum("agent_status", [
  "active",
  "paused",
  "disabled",
]);

export const agents = pgTable("agents", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  // MCP tool IDs this agent can use
  tools: jsonb("tools").$type<string[]>().default([]).notNull(),
  // Trigger configuration
  triggers: jsonb("triggers")
    .$type<AgentTrigger[]>()
    .default([])
    .notNull(),
  // Safety guardrails
  guardrails: jsonb("guardrails").$type<AgentGuardrails>().default({
    requireApproval: true,
    maxActionsPerRun: 10,
  }),
  status: agentStatusEnum("status").notNull().default("active"),
  createdById: text("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const agentRunStatusEnum = pgEnum("agent_run_status", [
  "queued",
  "running",
  "waiting_approval",
  "completed",
  "failed",
  "cancelled",
]);

export const agentRuns = pgTable("agent_runs", {
  id: text("id").primaryKey(),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  triggeredBy: text("triggered_by"), // user ID or "schedule" or "event"
  status: agentRunStatusEnum("status").notNull().default("queued"),
  // Full conversation log with Claude
  messages: jsonb("messages").$type<AgentMessage[]>().default([]),
  // Tool calls made during this run
  toolCalls: jsonb("tool_calls").$type<AgentToolCall[]>().default([]),
  // Actions pending approval
  pendingActions: jsonb("pending_actions")
    .$type<AgentPendingAction[]>()
    .default([]),
  error: text("error"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// AI conversation threads (for the chat panel)
export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }),
  // Context: which board/item this conversation is about
  contextBoardId: text("context_board_id"),
  contextItemId: text("context_item_id"),
  messages: jsonb("messages").$type<ConversationMessage[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Type definitions for JSONB fields
export type AgentTrigger = {
  type: "schedule" | "event" | "manual";
  config: {
    // schedule: cron expression
    cron?: string;
    // event: board/column change
    boardId?: string;
    columnId?: string;
    eventType?: string;
    [key: string]: unknown;
  };
};

export type AgentGuardrails = {
  requireApproval: boolean;
  maxActionsPerRun: number;
  allowedBoardIds?: string[];
  blockedTools?: string[];
};

export type AgentMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: string;
};

export type AgentToolCall = {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  output: unknown;
  timestamp: string;
};

export type AgentPendingAction = {
  id: string;
  description: string;
  toolCall: AgentToolCall;
  status: "pending" | "approved" | "rejected";
};

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
  toolCalls?: AgentToolCall[];
  timestamp: string;
};
