import { db, activityLog } from "@forge/db";
import { generateId } from "./id.js";

type ActivityType =
  | "item_created"
  | "item_updated"
  | "item_deleted"
  | "item_moved"
  | "column_value_changed"
  | "board_created"
  | "board_updated"
  | "member_added"
  | "member_removed"
  | "automation_triggered"
  | "agent_action"
  | "ai_chat";

type LogActivityParams = {
  workspaceId: string;
  type: ActivityType;
  actorId: string;
  actorType?: "user" | "agent" | "automation";
  boardId?: string;
  itemId?: string;
  changes?: {
    field?: string;
    oldValue?: unknown;
    newValue?: unknown;
    description?: string;
  };
};

export async function logActivity(params: LogActivityParams) {
  await db.insert(activityLog).values({
    id: generateId("activity"),
    workspaceId: params.workspaceId,
    type: params.type,
    actorId: params.actorId,
    actorType: params.actorType ?? "user",
    boardId: params.boardId ?? null,
    itemId: params.itemId ?? null,
    changes: params.changes ?? null,
  });
}
