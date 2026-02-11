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
import { boards } from "./boards.js";
import { users } from "./users.js";

export const automationStatusEnum = pgEnum("automation_status", [
  "active",
  "paused",
  "disabled",
]);

export const automations = pgTable("automations", {
  id: text("id").primaryKey(),
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // The trigger that starts this automation
  trigger: jsonb("trigger").$type<AutomationTrigger>().notNull(),
  // Conditions that must be met
  conditions: jsonb("conditions")
    .$type<AutomationCondition[]>()
    .default([]),
  // Actions to execute
  actions: jsonb("actions").$type<AutomationAction[]>().notNull(),
  status: automationStatusEnum("status").notNull().default("active"),
  runCount: integer("run_count").default(0).notNull(),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  createdById: text("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const automationLogs = pgTable("automation_logs", {
  id: text("id").primaryKey(),
  automationId: text("automation_id")
    .notNull()
    .references(() => automations.id, { onDelete: "cascade" }),
  triggerData: jsonb("trigger_data"),
  actionsExecuted: jsonb("actions_executed").$type<
    Array<{ action: string; result: unknown; error?: string }>
  >(),
  success: boolean("success").notNull(),
  error: text("error"),
  executedAt: timestamp("executed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Type definitions
export type AutomationTrigger = {
  type:
    | "status_change"
    | "column_change"
    | "item_created"
    | "item_deleted"
    | "date_arrived"
    | "recurring"
    | "webhook";
  config: {
    columnId?: string;
    fromValue?: unknown;
    toValue?: unknown;
    cron?: string;
    webhookPath?: string;
    [key: string]: unknown;
  };
};

export type AutomationCondition = {
  columnId: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "is_empty" | "is_not_empty";
  value: unknown;
};

export type AutomationAction = {
  type:
    | "change_column"
    | "create_item"
    | "move_item"
    | "notify"
    | "send_email"
    | "webhook"
    | "ai_step"; // AI as an automation action
  config: {
    columnId?: string;
    value?: unknown;
    boardId?: string;
    groupId?: string;
    userId?: string;
    message?: string;
    webhookUrl?: string;
    // For ai_step: the prompt to run
    aiPrompt?: string;
    aiTools?: string[];
    [key: string]: unknown;
  };
};
