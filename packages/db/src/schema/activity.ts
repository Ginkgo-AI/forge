import {
  pgTable,
  text,
  timestamp,
  varchar,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const activityTypeEnum = pgEnum("activity_type", [
  "item_created",
  "item_updated",
  "item_deleted",
  "item_moved",
  "column_value_changed",
  "board_created",
  "board_updated",
  "member_added",
  "member_removed",
  "automation_triggered",
  "agent_action",
  "ai_chat",
]);

export const activityLog = pgTable(
  "activity_log",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    boardId: text("board_id"),
    itemId: text("item_id"),
    type: activityTypeEnum("type").notNull(),
    // Who performed the action: user ID or agent ID
    actorId: text("actor_id"),
    actorType: varchar("actor_type", { length: 20 }), // "user" | "agent" | "automation"
    // What changed
    changes: jsonb("changes").$type<{
      field?: string;
      oldValue?: unknown;
      newValue?: unknown;
      description?: string;
    }>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("activity_workspace_idx").on(table.workspaceId),
    index("activity_board_idx").on(table.boardId),
    index("activity_item_idx").on(table.itemId),
    index("activity_created_at_idx").on(table.createdAt),
  ]
);
