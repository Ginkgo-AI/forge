import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import * as itemService from "../services/item.service.js";

const itemRoutes = new Hono();

const createItemSchema = z.object({
  boardId: z.string(),
  groupId: z.string(),
  name: z.string().min(1).max(500),
  columnValues: z.record(z.unknown()).optional(),
  parentItemId: z.string().optional(),
});

const updateItemSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  groupId: z.string().optional(),
  columnValues: z.record(z.unknown()).optional(),
  position: z.number().int().min(0).optional(),
});

// List items for a board
itemRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const boardId = c.req.query("boardId");
  const groupId = c.req.query("groupId");
  if (!boardId) {
    return c.json({ error: "boardId query parameter is required" }, 400);
  }
  const items = await itemService.listItems(boardId, userId, {
    groupId: groupId || undefined,
  });
  return c.json({ data: items, total: items.length });
});

// Create item
itemRoutes.post(
  "/",
  zValidator("json", createItemSchema),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const item = await itemService.createItem(body, userId);
    return c.json({ data: item }, 201);
  }
);

// Get item with full details
itemRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const item = await itemService.getItem(id, userId);
  return c.json({ data: item });
});

// Update item
itemRoutes.patch(
  "/:id",
  zValidator("json", updateItemSchema),
  async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const item = await itemService.updateItem(id, userId, body);
    return c.json({ data: item });
  }
);

// Batch update items
itemRoutes.patch(
  "/batch",
  zValidator(
    "json",
    z.object({
      items: z.array(
        z.object({
          id: z.string(),
          updates: updateItemSchema,
        })
      ),
    })
  ),
  async (c) => {
    const userId = c.get("userId");
    const { items } = c.req.valid("json");
    const count = await itemService.batchUpdateItems(items, userId);
    return c.json({ data: { updated: count } });
  }
);

// Delete item
itemRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  await itemService.deleteItem(id, userId);
  return c.json({ success: true });
});

// Add update/comment to item
itemRoutes.post(
  "/:id/updates",
  zValidator(
    "json",
    z.object({
      body: z.string().min(1).max(10000),
    })
  ),
  async (c) => {
    const userId = c.get("userId");
    const itemId = c.req.param("id");
    const { body } = c.req.valid("json");
    const update = await itemService.addItemUpdate(itemId, userId, body);
    return c.json({ data: update }, 201);
  }
);

export { itemRoutes };
