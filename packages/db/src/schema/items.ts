import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { boards, groups } from "./boards.js";
import { users } from "./users.js";

export const items = pgTable("items", {
  id: text("id").primaryKey(),
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  parentItemId: text("parent_item_id"), // self-reference for sub-items
  name: varchar("name", { length: 500 }).notNull(),
  position: integer("position").notNull().default(0),
  // All column values stored as JSONB: { [columnId]: value }
  columnValues: jsonb("column_values")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  createdById: text("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Updates/comments on items (like Monday.com's update threads)
export const itemUpdates = pgTable("item_updates", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  authorId: text("author_id").references(() => users.id),
  body: text("body").notNull(),
  // Null if top-level update, set if reply to another update
  parentUpdateId: text("parent_update_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// File attachments on items
export const itemFiles = pgTable("item_files", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 500 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 255 }),
  uploadedById: text("uploaded_by_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Dependencies between items
export const itemDependencies = pgTable("item_dependencies", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  dependsOnItemId: text("depends_on_item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
