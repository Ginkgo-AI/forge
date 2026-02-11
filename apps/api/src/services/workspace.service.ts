import { db, workspaces, workspaceMembers, users } from "@forge/db";
import { eq, and } from "drizzle-orm";
import { generateId } from "../lib/id.js";
import { NotFoundError, ForbiddenError } from "../lib/errors.js";

export async function listUserWorkspaces(userId: string) {
  const rows = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      description: workspaces.description,
      iconUrl: workspaces.iconUrl,
      ownerId: workspaces.ownerId,
      createdAt: workspaces.createdAt,
      updatedAt: workspaces.updatedAt,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId));

  return rows;
}

export async function createWorkspace(
  data: { name: string; description?: string },
  ownerId: string
) {
  const wsId = generateId("workspace");
  const memberId = generateId("workspace");

  await db.transaction(async (tx) => {
    await tx.insert(workspaces).values({
      id: wsId,
      name: data.name,
      description: data.description ?? null,
      ownerId,
    });
    await tx.insert(workspaceMembers).values({
      id: memberId,
      workspaceId: wsId,
      userId: ownerId,
      role: "owner",
    });
  });

  const [ws] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, wsId));
  return ws;
}

export async function getWorkspace(id: string, userId: string) {
  await checkWorkspaceAccess(id, userId);
  const [ws] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, id));
  if (!ws) throw new NotFoundError("Workspace", id);
  return ws;
}

export async function updateWorkspace(
  id: string,
  userId: string,
  data: { name?: string; description?: string }
) {
  const role = await checkWorkspaceAccess(id, userId);
  if (role !== "owner" && role !== "admin") {
    throw new ForbiddenError("Only owners and admins can update workspaces");
  }

  await db
    .update(workspaces)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(workspaces.id, id));

  const [updated] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, id));
  return updated;
}

export async function deleteWorkspace(id: string, userId: string) {
  const role = await checkWorkspaceAccess(id, userId);
  if (role !== "owner") {
    throw new ForbiddenError("Only the workspace owner can delete it");
  }

  await db.delete(workspaces).where(eq(workspaces.id, id));
}

export async function checkWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<string> {
  const [member] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      )
    )
    .limit(1);

  if (!member) {
    throw new ForbiddenError("You are not a member of this workspace");
  }
  return member.role;
}
