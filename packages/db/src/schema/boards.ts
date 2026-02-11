import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  jsonb,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.js";
import { users } from "./users.js";

export const columnTypeEnum = pgEnum("column_type", [
  "text",
  "number",
  "status",
  "person",
  "date",
  "timeline",
  "checkbox",
  "link",
  "file",
  "formula",
  "ai_generated",
  "dropdown",
  "rating",
  "tags",
  "email",
  "phone",
  "location",
  "dependency",
]);

export const boards = pgTable("boards", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdById: text("created_by_id").references(() => users.id),
  isTemplate: boolean("is_template").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const columns = pgTable("columns", {
  id: text("id").primaryKey(),
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  type: columnTypeEnum("type").notNull(),
  position: integer("position").notNull().default(0),
  config: jsonb("config").$type<ColumnConfig>().default({}),
  // For AI columns: the prompt template that generates the value
  aiPrompt: text("ai_prompt"),
  // For status columns: the label/color mapping
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const groups = pgTable("groups", {
  id: text("id").primaryKey(),
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  color: varchar("color", { length: 7 }).default("#579BFC"),
  position: integer("position").notNull().default(0),
  collapsed: boolean("collapsed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Saved views (Kanban, Gantt, Calendar, etc.)
export const boardViewTypeEnum = pgEnum("board_view_type", [
  "table",
  "kanban",
  "gantt",
  "timeline",
  "calendar",
  "chart",
  "cards",
]);

export const boardViews = pgTable("board_views", {
  id: text("id").primaryKey(),
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: boardViewTypeEnum("type").notNull(),
  config: jsonb("config").$type<ViewConfig>().default({}),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Type helpers for JSONB configs
export type ColumnConfig = {
  // Status column: labels with colors
  labels?: Record<string, { label: string; color: string }>;
  // Dropdown: options list
  options?: string[];
  // Number: unit, precision
  unit?: string;
  precision?: number;
  // Formula: expression
  formula?: string;
  // AI: which columns to read as context
  aiSourceColumns?: string[];
  [key: string]: unknown;
};

export type ViewConfig = {
  filters?: Array<{
    columnId: string;
    operator: string;
    value: unknown;
  }>;
  sortBy?: Array<{
    columnId: string;
    direction: "asc" | "desc";
  }>;
  groupBy?: string;
  hiddenColumns?: string[];
  [key: string]: unknown;
};
