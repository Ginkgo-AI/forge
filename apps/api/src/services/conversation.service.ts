import { db, conversations } from "@forge/db";
import { eq, and } from "drizzle-orm";
import { generateId } from "../lib/id.js";
import type { ConversationMessage } from "@forge/db";

export async function getOrCreateConversation(
  conversationId: string | undefined,
  workspaceId: string,
  userId: string,
  context?: { boardId?: string; itemId?: string }
) {
  if (conversationId) {
    const [existing] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId)
        )
      );
    if (existing) return existing;
  }

  const id = generateId("conversation");
  await db.insert(conversations).values({
    id,
    workspaceId,
    userId,
    contextBoardId: context?.boardId ?? null,
    contextItemId: context?.itemId ?? null,
    messages: [],
  });

  const [created] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id));
  return created;
}

export async function appendMessages(
  conversationId: string,
  newMessages: ConversationMessage[]
) {
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId));
  if (!conv) return;

  const updated = [...(conv.messages ?? []), ...newMessages];
  await db
    .update(conversations)
    .set({ messages: updated, updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));
}

export async function updateConversationTitle(
  conversationId: string,
  title: string
) {
  await db
    .update(conversations)
    .set({ title, updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));
}
