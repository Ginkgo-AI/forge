import {
  db,
  boards,
  items,
  columns,
  groups,
  agents,
  automations,
  automationLogs,
  agentRuns,
  activityLog,
  users,
} from "@forge/db";
import { eq, and, count, sql, desc, gte } from "drizzle-orm";
import { checkWorkspaceAccess } from "./workspace.service.js";

export async function getWorkspaceStats(workspaceId: string, userId: string) {
  await checkWorkspaceAccess(workspaceId, userId);

  const [[boardCount], [itemCount], [activeAgentCount], [activeAutomationCount]] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(boards)
        .where(eq(boards.workspaceId, workspaceId)),
      db
        .select({ value: count() })
        .from(items)
        .innerJoin(boards, eq(items.boardId, boards.id))
        .where(eq(boards.workspaceId, workspaceId)),
      db
        .select({ value: count() })
        .from(agents)
        .where(
          and(
            eq(agents.workspaceId, workspaceId),
            eq(agents.status, "active")
          )
        ),
      db
        .select({ value: count() })
        .from(automations)
        .innerJoin(boards, eq(automations.boardId, boards.id))
        .where(
          and(
            eq(boards.workspaceId, workspaceId),
            eq(automations.status, "active")
          )
        ),
    ]);

  // Runs in the last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [[automationRunCount], [agentRunCount]] = await Promise.all([
    db
      .select({ value: count() })
      .from(automationLogs)
      .innerJoin(automations, eq(automationLogs.automationId, automations.id))
      .innerJoin(boards, eq(automations.boardId, boards.id))
      .where(
        and(
          eq(boards.workspaceId, workspaceId),
          gte(automationLogs.executedAt, weekAgo)
        )
      ),
    db
      .select({ value: count() })
      .from(agentRuns)
      .innerJoin(agents, eq(agentRuns.agentId, agents.id))
      .where(
        and(
          eq(agents.workspaceId, workspaceId),
          gte(agentRuns.createdAt, weekAgo)
        )
      ),
  ]);

  // Items by status — aggregate across all boards' status columns
  const statusRows = await db.execute<{
    status_value: string;
    item_count: number;
  }>(sql`
    SELECT
      cv.value::text AS status_value,
      COUNT(*)::int AS item_count
    FROM items i
    JOIN boards b ON i.board_id = b.id
    JOIN columns c ON c.board_id = b.id AND c.type = 'status'
    CROSS JOIN LATERAL jsonb_each(i.column_values) AS cv(key, value)
    WHERE b.workspace_id = ${workspaceId}
      AND cv.key = c.id
      AND cv.value IS NOT NULL
      AND cv.value != 'null'::jsonb
    GROUP BY cv.value::text
    ORDER BY item_count DESC
  `);

  const itemsByStatus: Record<string, number> = {};
  for (const row of statusRows) {
    // Strip surrounding quotes from JSONB text
    const key = row.status_value.replace(/^"|"$/g, "");
    itemsByStatus[key] = row.item_count;
  }

  return {
    totalBoards: boardCount.value,
    totalItems: itemCount.value,
    activeAgents: activeAgentCount.value,
    activeAutomations: activeAutomationCount.value,
    automationRunsThisWeek: automationRunCount.value,
    agentRunsThisWeek: agentRunCount.value,
    itemsByStatus,
  };
}

export async function getActivityFeed(
  workspaceId: string,
  userId: string,
  limit = 20
) {
  await checkWorkspaceAccess(workspaceId, userId);

  const rows = await db
    .select({
      id: activityLog.id,
      type: activityLog.type,
      boardId: activityLog.boardId,
      itemId: activityLog.itemId,
      actorId: activityLog.actorId,
      actorType: activityLog.actorType,
      changes: activityLog.changes,
      createdAt: activityLog.createdAt,
      actorName: users.name,
    })
    .from(activityLog)
    .leftJoin(users, eq(activityLog.actorId, users.id))
    .where(eq(activityLog.workspaceId, workspaceId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);

  return rows;
}

export async function getActivityTimeline(
  workspaceId: string,
  userId: string,
  days = 14
) {
  await checkWorkspaceAccess(workspaceId, userId);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const rows = await db.execute<{ date: string; count: number }>(sql`
    SELECT
      date_trunc('day', created_at)::date::text AS date,
      COUNT(*)::int AS count
    FROM activity_log
    WHERE workspace_id = ${workspaceId}
      AND created_at >= ${startDate.toISOString()}
    GROUP BY date_trunc('day', created_at)
    ORDER BY date ASC
  `);

  return rows;
}

export async function getBoardBreakdown(workspaceId: string, userId: string) {
  await checkWorkspaceAccess(workspaceId, userId);

  const rows = await db
    .select({
      boardId: boards.id,
      boardName: boards.name,
      itemCount: count(items.id),
    })
    .from(boards)
    .leftJoin(items, eq(items.boardId, boards.id))
    .where(eq(boards.workspaceId, workspaceId))
    .groupBy(boards.id, boards.name)
    .orderBy(desc(count(items.id)));

  return rows;
}
