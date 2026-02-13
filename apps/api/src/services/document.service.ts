import { db, documents } from "@forge/db";
import { eq, and, isNull, asc } from "drizzle-orm";
import { generateId } from "../lib/id.js";
import { NotFoundError } from "../lib/errors.js";
import { checkWorkspaceAccess } from "./workspace.service.js";

export async function listDocuments(workspaceId: string, userId: string) {
  await checkWorkspaceAccess(workspaceId, userId);

  return db
    .select()
    .from(documents)
    .where(eq(documents.workspaceId, workspaceId))
    .orderBy(asc(documents.position), asc(documents.createdAt));
}

export async function getDocument(id: string, userId: string) {
  const [doc] = await db.select().from(documents).where(eq(documents.id, id));
  if (!doc) throw new NotFoundError("Document", id);
  await checkWorkspaceAccess(doc.workspaceId, userId);
  return doc;
}

export async function createDocument(
  data: {
    workspaceId: string;
    title: string;
    content?: string;
    parentDocId?: string;
  },
  userId: string
) {
  await checkWorkspaceAccess(data.workspaceId, userId);

  const id = generateId("document");
  await db.insert(documents).values({
    id,
    workspaceId: data.workspaceId,
    title: data.title,
    content: data.content ?? "",
    createdById: userId,
    parentDocId: data.parentDocId ?? null,
  });

  const [doc] = await db.select().from(documents).where(eq(documents.id, id));
  return doc;
}

export async function updateDocument(
  id: string,
  data: { title?: string; content?: string },
  userId: string
) {
  const [doc] = await db.select().from(documents).where(eq(documents.id, id));
  if (!doc) throw new NotFoundError("Document", id);
  await checkWorkspaceAccess(doc.workspaceId, userId);

  await db
    .update(documents)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(documents.id, id));

  const [updated] = await db.select().from(documents).where(eq(documents.id, id));
  return updated;
}

export async function deleteDocument(id: string, userId: string) {
  const [doc] = await db.select().from(documents).where(eq(documents.id, id));
  if (!doc) throw new NotFoundError("Document", id);
  await checkWorkspaceAccess(doc.workspaceId, userId);

  // Delete child documents too
  await db.delete(documents).where(eq(documents.parentDocId, id));
  await db.delete(documents).where(eq(documents.id, id));
}
