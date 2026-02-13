import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  index,
} from "drizzle-orm/pg-core";

export const documents = pgTable(
  "documents",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    content: text("content").default("").notNull(),
    createdById: text("created_by_id").notNull(),
    parentDocId: text("parent_doc_id"),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("documents_workspace_idx").on(table.workspaceId)]
);
