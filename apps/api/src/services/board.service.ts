import { db, boards, columns, groups, items } from "@forge/db";
import { eq, and, sql } from "drizzle-orm";
import { generateId } from "../lib/id.js";
import { logActivity } from "../lib/activity.js";
import { NotFoundError, ForbiddenError } from "../lib/errors.js";
import { checkWorkspaceAccess } from "./workspace.service.js";
import { DEFAULT_STATUS_LABELS, GROUP_COLORS } from "@forge/shared";

export async function listBoards(workspaceId: string, userId: string) {
  await checkWorkspaceAccess(workspaceId, userId);

  const result = await db
    .select()
    .from(boards)
    .where(eq(boards.workspaceId, workspaceId))
    .orderBy(boards.createdAt);

  return result;
}

export async function createBoard(
  data: { name: string; workspaceId: string; description?: string },
  userId: string
) {
  await checkWorkspaceAccess(data.workspaceId, userId);

  const boardId = generateId("board");
  const colStatusId = generateId("column");
  const colPersonId = generateId("column");
  const colDateId = generateId("column");
  const groupId = generateId("group");

  await db.transaction(async (tx) => {
    await tx.insert(boards).values({
      id: boardId,
      workspaceId: data.workspaceId,
      name: data.name,
      description: data.description ?? null,
      createdById: userId,
    });

    // Default columns: Status, Person, Date
    await tx.insert(columns).values([
      {
        id: colStatusId,
        boardId,
        title: "Status",
        type: "status",
        position: 0,
        config: { labels: DEFAULT_STATUS_LABELS },
      },
      {
        id: colPersonId,
        boardId,
        title: "Person",
        type: "person",
        position: 1,
        config: {},
      },
      {
        id: colDateId,
        boardId,
        title: "Date",
        type: "date",
        position: 2,
        config: {},
      },
    ]);

    // Default group
    await tx.insert(groups).values({
      id: groupId,
      boardId,
      title: "New Group",
      color: GROUP_COLORS[0],
      position: 0,
    });
  });

  await logActivity({
    workspaceId: data.workspaceId,
    boardId,
    type: "board_created",
    actorId: userId,
    changes: { description: `Created board '${data.name}'` },
  });

  return getBoard(boardId, userId);
}

export async function getBoard(id: string, userId: string) {
  const [board] = await db.select().from(boards).where(eq(boards.id, id));
  if (!board) throw new NotFoundError("Board", id);

  await checkWorkspaceAccess(board.workspaceId, userId);

  const boardColumns = await db
    .select()
    .from(columns)
    .where(eq(columns.boardId, id))
    .orderBy(columns.position);

  const boardGroups = await db
    .select()
    .from(groups)
    .where(eq(groups.boardId, id))
    .orderBy(groups.position);

  return {
    ...board,
    columns: boardColumns,
    groups: boardGroups,
  };
}

export async function addColumn(
  boardId: string,
  data: { title: string; type: string; config?: Record<string, unknown>; position?: number },
  userId: string
) {
  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
  if (!board) throw new NotFoundError("Board", boardId);
  await checkWorkspaceAccess(board.workspaceId, userId);

  // Auto-position: find max position and add 1
  let position = data.position;
  if (position === undefined) {
    const [maxPos] = await db
      .select({ max: sql<number>`coalesce(max(${columns.position}), -1)` })
      .from(columns)
      .where(eq(columns.boardId, boardId));
    position = (maxPos?.max ?? -1) + 1;
  }

  const colId = generateId("column");
  await db.insert(columns).values({
    id: colId,
    boardId,
    title: data.title,
    type: data.type as any,
    position,
    config: data.config ?? {},
  });

  const [col] = await db.select().from(columns).where(eq(columns.id, colId));
  return col;
}

export async function addGroup(
  boardId: string,
  data: { title: string; color?: string },
  userId: string
) {
  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
  if (!board) throw new NotFoundError("Board", boardId);
  await checkWorkspaceAccess(board.workspaceId, userId);

  // Auto-position
  const [maxPos] = await db
    .select({ max: sql<number>`coalesce(max(${groups.position}), -1)` })
    .from(groups)
    .where(eq(groups.boardId, boardId));
  const position = (maxPos?.max ?? -1) + 1;

  // Cycle through group colors
  const color = data.color ?? GROUP_COLORS[position % GROUP_COLORS.length];

  const grpId = generateId("group");
  await db.insert(groups).values({
    id: grpId,
    boardId,
    title: data.title,
    color,
    position,
  });

  const [grp] = await db.select().from(groups).where(eq(groups.id, grpId));
  return grp;
}

export async function updateBoard(
  id: string,
  userId: string,
  data: { name?: string; description?: string }
) {
  const [board] = await db.select().from(boards).where(eq(boards.id, id));
  if (!board) throw new NotFoundError("Board", id);

  const role = await checkWorkspaceAccess(board.workspaceId, userId);

  await db
    .update(boards)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(boards.id, id));

  await logActivity({
    workspaceId: board.workspaceId,
    boardId: id,
    type: "board_updated",
    actorId: userId,
    changes: { description: `Updated board '${data.name || board.name}'` },
  });

  const [updated] = await db.select().from(boards).where(eq(boards.id, id));
  return updated;
}

export async function deleteBoard(id: string, userId: string) {
  const [board] = await db.select().from(boards).where(eq(boards.id, id));
  if (!board) throw new NotFoundError("Board", id);

  const role = await checkWorkspaceAccess(board.workspaceId, userId);
  if (role !== "owner" && role !== "admin") {
    throw new ForbiddenError("Only owners and admins can delete boards");
  }

  await db.delete(boards).where(eq(boards.id, id));
}
