import { db, items, itemUpdates, boards } from "@forge/db";
import { eq, and, sql } from "drizzle-orm";
import { generateId } from "../lib/id.js";
import { logActivity } from "../lib/activity.js";
import { NotFoundError } from "../lib/errors.js";
import { checkWorkspaceAccess } from "./workspace.service.js";

async function getBoardWithAccess(boardId: string, userId: string) {
  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
  if (!board) throw new NotFoundError("Board", boardId);
  await checkWorkspaceAccess(board.workspaceId, userId);
  return board;
}

export async function listItems(
  boardId: string,
  userId: string,
  filters?: { groupId?: string }
) {
  const board = await getBoardWithAccess(boardId, userId);

  let query = db
    .select()
    .from(items)
    .where(eq(items.boardId, boardId))
    .orderBy(items.position);

  if (filters?.groupId) {
    query = db
      .select()
      .from(items)
      .where(
        and(eq(items.boardId, boardId), eq(items.groupId, filters.groupId))
      )
      .orderBy(items.position);
  }

  const result = await query;
  return result;
}

export async function createItem(
  data: {
    boardId: string;
    groupId: string;
    name: string;
    columnValues?: Record<string, unknown>;
    parentItemId?: string;
  },
  userId: string
) {
  const board = await getBoardWithAccess(data.boardId, userId);

  // Auto-position
  const [maxPos] = await db
    .select({ max: sql<number>`coalesce(max(${items.position}), -1)` })
    .from(items)
    .where(
      and(eq(items.boardId, data.boardId), eq(items.groupId, data.groupId))
    );
  const position = (maxPos?.max ?? -1) + 1;

  const itemId = generateId("item");
  await db.insert(items).values({
    id: itemId,
    boardId: data.boardId,
    groupId: data.groupId,
    name: data.name,
    position,
    columnValues: data.columnValues ?? {},
    parentItemId: data.parentItemId ?? null,
    createdById: userId,
  });

  await logActivity({
    workspaceId: board.workspaceId,
    boardId: data.boardId,
    itemId,
    type: "item_created",
    actorId: userId,
    changes: { description: `Created item '${data.name}'` },
  });

  const [item] = await db.select().from(items).where(eq(items.id, itemId));
  return item;
}

export async function getItem(id: string, userId: string) {
  const [item] = await db.select().from(items).where(eq(items.id, id));
  if (!item) throw new NotFoundError("Item", id);

  await getBoardWithAccess(item.boardId, userId);

  const updates = await db
    .select()
    .from(itemUpdates)
    .where(eq(itemUpdates.itemId, id))
    .orderBy(itemUpdates.createdAt);

  const subItems = await db
    .select()
    .from(items)
    .where(eq(items.parentItemId, id))
    .orderBy(items.position);

  return { ...item, updates, subItems };
}

export async function updateItem(
  id: string,
  userId: string,
  data: {
    name?: string;
    groupId?: string;
    columnValues?: Record<string, unknown>;
    position?: number;
  }
) {
  const [item] = await db.select().from(items).where(eq(items.id, id));
  if (!item) throw new NotFoundError("Item", id);

  const board = await getBoardWithAccess(item.boardId, userId);

  // Merge column values
  const mergedColumnValues = data.columnValues
    ? { ...item.columnValues, ...data.columnValues }
    : item.columnValues;

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.groupId !== undefined) updateData.groupId = data.groupId;
  if (data.position !== undefined) updateData.position = data.position;
  if (data.columnValues) updateData.columnValues = mergedColumnValues;

  await db.update(items).set(updateData).where(eq(items.id, id));

  // Log column value changes individually
  if (data.columnValues) {
    for (const [colId, newValue] of Object.entries(data.columnValues)) {
      const oldValue = item.columnValues[colId];
      if (oldValue !== newValue) {
        await logActivity({
          workspaceId: board.workspaceId,
          boardId: item.boardId,
          itemId: id,
          type: "column_value_changed",
          actorId: userId,
          changes: { field: colId, oldValue, newValue },
        });
      }
    }
  }

  if (data.name && data.name !== item.name) {
    await logActivity({
      workspaceId: board.workspaceId,
      boardId: item.boardId,
      itemId: id,
      type: "item_updated",
      actorId: userId,
      changes: { field: "name", oldValue: item.name, newValue: data.name },
    });
  }

  const [updated] = await db.select().from(items).where(eq(items.id, id));
  return updated;
}

export async function deleteItem(id: string, userId: string) {
  const [item] = await db.select().from(items).where(eq(items.id, id));
  if (!item) throw new NotFoundError("Item", id);

  const board = await getBoardWithAccess(item.boardId, userId);

  await db.delete(items).where(eq(items.id, id));

  await logActivity({
    workspaceId: board.workspaceId,
    boardId: item.boardId,
    itemId: id,
    type: "item_deleted",
    actorId: userId,
    changes: { description: `Deleted item '${item.name}'` },
  });
}

export async function addItemUpdate(
  itemId: string,
  userId: string,
  body: string
) {
  const [item] = await db.select().from(items).where(eq(items.id, itemId));
  if (!item) throw new NotFoundError("Item", itemId);

  await getBoardWithAccess(item.boardId, userId);

  const updateId = generateId("update");
  await db.insert(itemUpdates).values({
    id: updateId,
    itemId,
    authorId: userId,
    body,
  });

  const [update] = await db
    .select()
    .from(itemUpdates)
    .where(eq(itemUpdates.id, updateId));
  return update;
}

export async function batchUpdateItems(
  updates: Array<{ id: string; updates: Record<string, unknown> }>,
  userId: string
) {
  let count = 0;
  for (const { id, updates: data } of updates) {
    await updateItem(id, userId, data);
    count++;
  }
  return count;
}
