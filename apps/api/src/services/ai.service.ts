import { getProvider, getDefaultModel } from "../lib/ai/provider-registry.js";
import { neutralToolDefs } from "../lib/ai/tool-defs.js";
import { executeTool } from "../lib/ai-tools.js";
import * as conversationService from "./conversation.service.js";
import * as boardService from "./board.service.js";
import * as itemService from "./item.service.js";
import type { ConversationMessage, AgentToolCall } from "@forge/db";
import type {
  NeutralMessage,
  NeutralContentBlock,
  NeutralToolResultBlock,
} from "../lib/ai/types.js";

const MAX_TOKENS = 4096;

// SSE event types
export type SSEEvent =
  | { type: "text_delta"; content: string }
  | { type: "tool_call_start"; toolName: string; toolCallId: string }
  | {
      type: "tool_call_result";
      toolCallId: string;
      toolName: string;
      result: unknown;
    }
  | {
      type: "done";
      conversationId: string;
      toolCalls: AgentToolCall[];
    }
  | { type: "error"; error: string };

type StreamChatParams = {
  message: string;
  workspaceId: string;
  userId: string;
  conversationId?: string;
  boardId?: string;
  itemId?: string;
  providerId?: string;
  model?: string;
};

const SYSTEM_PROMPT = `You are Forge AI, an intelligent assistant built into the Forge work management platform. You help users manage their boards, items, and workflows through natural conversation.

Capabilities:
- List, create, and inspect boards
- Add columns and groups to boards
- Create, update, delete, and list items
- Add comments to items
- Look up workspace members

Guidelines:
- Be concise and helpful. When you perform actions, briefly confirm what you did.
- When creating items, always get the board structure first (get_board) so you know the column IDs and group IDs.
- For status columns, use the status key (e.g. "done", "working", "stuck", "not_started") as the column value.
- For person columns, use the user's ID as the value. Use list_workspace_members to find user IDs if needed.
- For date columns, use ISO date strings (YYYY-MM-DD).
- When the user asks to create multiple items, create them one at a time.
- If you're unsure about something, ask the user for clarification rather than guessing.
- When referring to boards or items, use their names rather than IDs in your responses to the user.`;

function buildContextBlock(boardData?: unknown, itemData?: unknown): string {
  const parts: string[] = [];
  if (boardData) {
    parts.push(`Current board context:\n${JSON.stringify(boardData, null, 2)}`);
  }
  if (itemData) {
    parts.push(
      `Current item context:\n${JSON.stringify(itemData, null, 2)}`
    );
  }
  return parts.length > 0
    ? `\n\nContext injected from the user's current view:\n${parts.join("\n\n")}`
    : "";
}

export async function* streamChat(
  params: StreamChatParams
): AsyncGenerator<SSEEvent> {
  const {
    message,
    workspaceId,
    userId,
    conversationId,
    boardId,
    itemId,
    providerId,
    model,
  } = params;

  try {
    // 1. Resolve provider and model
    const provider = getProvider(providerId);
    const resolvedModel = model || getDefaultModel(providerId);

    // 2. Load/create conversation
    const conversation = await conversationService.getOrCreateConversation(
      conversationId,
      workspaceId,
      userId,
      { boardId, itemId }
    );

    // 3. Load context data
    let boardData: unknown;
    let itemData: unknown;
    const contextBoardId = boardId || conversation.contextBoardId;
    const contextItemId = itemId || conversation.contextItemId;

    if (contextBoardId) {
      try {
        boardData = await boardService.getBoard(contextBoardId, userId);
      } catch {
        // Board may have been deleted
      }
    }
    if (contextItemId) {
      try {
        itemData = await itemService.getItem(contextItemId, userId);
      } catch {
        // Item may have been deleted
      }
    }

    // 4. Build system prompt
    const systemPrompt =
      SYSTEM_PROMPT +
      `\n\nThe user's workspace ID is: ${workspaceId}` +
      buildContextBlock(boardData, itemData);

    // 5. Convert conversation history to neutral format
    const messages: NeutralMessage[] = (conversation.messages ?? []).map(
      (m: ConversationMessage) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })
    );

    // Add the new user message
    messages.push({ role: "user", content: message });

    // 6. Agentic loop
    const allToolCalls: AgentToolCall[] = [];
    let fullAssistantText = "";

    while (true) {
      const { events, result } = provider.streamChat({
        model: resolvedModel,
        systemPrompt,
        messages,
        tools: neutralToolDefs,
        maxTokens: MAX_TOKENS,
      });

      // Stream text deltas
      let currentText = "";
      for await (const event of events) {
        if (event.type === "text_delta") {
          currentText += event.text;
          fullAssistantText += event.text;
          yield { type: "text_delta", content: event.text };
        }
      }

      const streamResult = await result;

      // If no tool calls, we're done
      if (
        streamResult.stopReason !== "tool_use" ||
        streamResult.toolCalls.length === 0
      ) {
        break;
      }

      // 7. Build assistant message with content blocks for the tool loop
      const assistantBlocks: NeutralContentBlock[] = [];
      if (currentText) {
        assistantBlocks.push({ type: "text", text: currentText });
      }
      for (const tc of streamResult.toolCalls) {
        assistantBlocks.push({
          type: "tool_use",
          id: tc.id,
          name: tc.name,
          input: tc.input,
        });
      }
      messages.push({ role: "assistant", content: assistantBlocks });

      // 8. Execute tool calls and build tool result message
      const toolResultBlocks: NeutralToolResultBlock[] = [];

      for (const tool of streamResult.toolCalls) {
        yield {
          type: "tool_call_start",
          toolName: tool.name,
          toolCallId: tool.id,
        };

        let toolResult: unknown;
        let isError = false;
        try {
          toolResult = await executeTool(tool.name, tool.input, userId);
        } catch (err: unknown) {
          isError = true;
          toolResult =
            err instanceof Error ? err.message : "Tool execution failed";
        }

        allToolCalls.push({
          id: tool.id,
          tool: tool.name,
          input: tool.input,
          output: toolResult,
          timestamp: new Date().toISOString(),
        });

        yield {
          type: "tool_call_result",
          toolCallId: tool.id,
          toolName: tool.name,
          result: toolResult,
        };

        toolResultBlocks.push({
          type: "tool_result",
          toolCallId: tool.id,
          content: JSON.stringify(toolResult),
          isError,
        });
      }

      // Feed tool results back for next iteration
      messages.push({ role: "tool", content: toolResultBlocks });

      // Reset per-iteration text
      fullAssistantText = fullAssistantText; // keep accumulated
    }

    // 9. Persist messages
    const newMessages: ConversationMessage[] = [
      {
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      },
      {
        role: "assistant",
        content: fullAssistantText,
        toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
        timestamp: new Date().toISOString(),
      },
    ];
    await conversationService.appendMessages(conversation.id, newMessages);

    // Auto-title from first message
    if (!conversation.title) {
      const title =
        message.length > 60 ? message.slice(0, 57) + "..." : message;
      await conversationService.updateConversationTitle(
        conversation.id,
        title
      );
    }

    // 10. Done
    yield {
      type: "done",
      conversationId: conversation.id,
      toolCalls: allToolCalls,
    };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    yield { type: "error", error: errorMessage };
  }
}

// Non-streaming: Generate a board from a description
export async function generateBoard(
  description: string,
  workspaceId: string,
  userId: string,
  providerId?: string,
  model?: string
) {
  const provider = getProvider(providerId);
  const resolvedModel = model || getDefaultModel(providerId);

  const prompt = `Based on the following description, generate a board specification as JSON. The JSON should have:
- "name": A concise board name
- "description": A brief description
- "columns": Array of {title, type, config?} where type is one of: text, number, status, person, date, checkbox, dropdown, rating, tags
  - For status columns, include config.labels as {"key": {"label": "Display", "color": "#hex"}}
  - For dropdown columns, include config.options as ["option1", "option2"]
- "groups": Array of {title, color?} — 2-4 logical groupings
- "sampleItems": Array of {name, groupIndex, columnValues: {columnTitle: value}} — 3-5 example items
  - Use column titles (not IDs) as keys in columnValues for the sample items
  - For status values, use the status key (e.g. "working", "done")

Respond with ONLY valid JSON, no markdown code fences.

Description: ${description}`;

  const { text } = await provider.complete({
    model: resolvedModel,
    messages: [{ role: "user", content: prompt }],
    maxTokens: MAX_TOKENS,
  });

  const spec = JSON.parse(text);

  // Create the board
  const board = await boardService.createBoard(
    {
      name: spec.name,
      workspaceId,
      description: spec.description,
    },
    userId
  );

  // Add custom columns (beyond the defaults)
  const columnIdMap: Record<string, string> = {};
  // Map default columns by title
  for (const col of board.columns) {
    columnIdMap[col.title.toLowerCase()] = col.id;
  }

  for (const colSpec of spec.columns || []) {
    const existingTitle = colSpec.title.toLowerCase();
    if (columnIdMap[existingTitle]) continue; // Skip if default column matches

    const col = await boardService.addColumn(
      board.id,
      {
        title: colSpec.title,
        type: colSpec.type,
        config: colSpec.config,
      },
      userId
    );
    columnIdMap[colSpec.title.toLowerCase()] = col.id;
  }

  // Add custom groups
  const groupIds: string[] = [board.groups[0].id]; // Default group
  for (const grpSpec of (spec.groups || []).slice(1)) {
    const grp = await boardService.addGroup(
      board.id,
      { title: grpSpec.title, color: grpSpec.color },
      userId
    );
    groupIds.push(grp.id);
  }

  // Create sample items
  const createdItems = [];
  for (const itemSpec of spec.sampleItems || []) {
    const groupIndex = itemSpec.groupIndex ?? 0;
    const groupId = groupIds[groupIndex] ?? groupIds[0];

    // Convert column title-based values to column ID-based values
    const columnValues: Record<string, unknown> = {};
    for (const [colTitle, value] of Object.entries(
      itemSpec.columnValues || {}
    )) {
      const colId = columnIdMap[colTitle.toLowerCase()];
      if (colId) {
        columnValues[colId] = value;
      }
    }

    const item = await itemService.createItem(
      {
        boardId: board.id,
        groupId,
        name: itemSpec.name,
        columnValues,
      },
      userId
    );
    createdItems.push(item);
  }

  // Return the full board
  return boardService.getBoard(board.id, userId);
}

// Non-streaming: Extract items from text
export async function extractItems(
  text: string,
  boardId: string,
  userId: string,
  providerId?: string,
  model?: string
) {
  const provider = getProvider(providerId);
  const resolvedModel = model || getDefaultModel(providerId);

  const board = await boardService.getBoard(boardId, userId);

  const columnInfo = board.columns
    .map(
      (c) =>
        `- "${c.title}" (id: ${c.id}, type: ${c.type}${
          c.type === "status" && c.config
            ? `, status keys: ${Object.keys(c.config.labels || {}).join(", ")}`
            : ""
        })`
    )
    .join("\n");

  const groupInfo = board.groups
    .map((g) => `- "${g.title}" (id: ${g.id})`)
    .join("\n");

  const prompt = `Extract action items from the following text and return them as a JSON array. Each item should have:
- "name": The item/task name
- "groupId": One of the group IDs below (pick the most appropriate)
- "columnValues": Object mapping column IDs to values based on what you can infer from the text

Board columns:
${columnInfo}

Board groups:
${groupInfo}

Respond with ONLY a valid JSON array, no markdown code fences.

Text to extract from:
${text}`;

  const { text: responseText } = await provider.complete({
    model: resolvedModel,
    messages: [{ role: "user", content: prompt }],
    maxTokens: MAX_TOKENS,
  });

  const itemSpecs = JSON.parse(responseText);

  const createdItems = [];
  for (const spec of itemSpecs) {
    const item = await itemService.createItem(
      {
        boardId,
        groupId: spec.groupId || board.groups[0].id,
        name: spec.name,
        columnValues: spec.columnValues,
      },
      userId
    );
    createdItems.push(item);
  }

  return createdItems;
}
