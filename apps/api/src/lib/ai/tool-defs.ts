import type Anthropic from "@anthropic-ai/sdk";
import type { NeutralToolDef } from "./types.js";

export const neutralToolDefs: NeutralToolDef[] = [
  {
    name: "list_boards",
    description:
      "List all boards in a workspace. Returns board id, name, description, and timestamps.",
    parameters: {
      type: "object",
      properties: {
        workspaceId: {
          type: "string",
          description: "The workspace ID to list boards from",
        },
      },
      required: ["workspaceId"],
    },
  },
  {
    name: "get_board",
    description:
      "Get full details of a board including its columns (with types and config) and groups. Use this to understand the board structure before creating or updating items.",
    parameters: {
      type: "object",
      properties: {
        boardId: { type: "string", description: "The board ID" },
      },
      required: ["boardId"],
    },
  },
  {
    name: "create_board",
    description:
      "Create a new board in a workspace. By default it gets Status, Person, and Date columns plus one group.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Board name" },
        workspaceId: { type: "string", description: "Workspace ID" },
        description: {
          type: "string",
          description: "Optional board description",
        },
      },
      required: ["name", "workspaceId"],
    },
  },
  {
    name: "add_column",
    description:
      'Add a column to a board. Supported types: text, number, status, person, date, checkbox, link, dropdown, rating, tags, email, phone. For status columns, provide config.labels as an object like {"key": {"label": "Display Name", "color": "#hex"}}.',
    parameters: {
      type: "object",
      properties: {
        boardId: { type: "string", description: "Board ID" },
        title: { type: "string", description: "Column title" },
        type: {
          type: "string",
          description:
            "Column type (text, number, status, person, date, checkbox, link, dropdown, rating, tags, email, phone)",
        },
        config: {
          type: "object",
          description:
            "Column configuration (e.g. labels for status columns)",
        },
      },
      required: ["boardId", "title", "type"],
    },
  },
  {
    name: "add_group",
    description:
      "Add a group (section) to a board. Groups organize items visually.",
    parameters: {
      type: "object",
      properties: {
        boardId: { type: "string", description: "Board ID" },
        title: { type: "string", description: "Group title" },
        color: {
          type: "string",
          description: "Optional hex color for the group",
        },
      },
      required: ["boardId", "title"],
    },
  },
  {
    name: "list_items",
    description:
      "List all items in a board, optionally filtered by group.",
    parameters: {
      type: "object",
      properties: {
        boardId: { type: "string", description: "Board ID" },
        groupId: {
          type: "string",
          description: "Optional group ID to filter items",
        },
      },
      required: ["boardId"],
    },
  },
  {
    name: "get_item",
    description:
      "Get full details of an item including its column values, updates (comments), and sub-items.",
    parameters: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "Item ID" },
      },
      required: ["itemId"],
    },
  },
  {
    name: "create_item",
    description:
      'Create a new item in a board group. Column values should be an object mapping column IDs to values. For status columns use the status key (e.g. "done"), for person columns use the user ID, for date columns use ISO date strings.',
    parameters: {
      type: "object",
      properties: {
        boardId: { type: "string", description: "Board ID" },
        groupId: {
          type: "string",
          description: "Group ID to add the item to",
        },
        name: { type: "string", description: "Item name" },
        columnValues: {
          type: "object",
          description: "Optional column values as {columnId: value}",
        },
      },
      required: ["boardId", "groupId", "name"],
    },
  },
  {
    name: "update_item",
    description:
      "Update an existing item. Can change name, move to a different group, or update column values. Column values are merged with existing values.",
    parameters: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "Item ID" },
        name: { type: "string", description: "New item name" },
        groupId: {
          type: "string",
          description: "New group ID to move item to",
        },
        columnValues: {
          type: "object",
          description: "Column values to update as {columnId: value}",
        },
      },
      required: ["itemId"],
    },
  },
  {
    name: "delete_item",
    description: "Delete an item from a board.",
    parameters: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "Item ID" },
      },
      required: ["itemId"],
    },
  },
  {
    name: "add_item_update",
    description: "Add a comment/update to an item.",
    parameters: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "Item ID" },
        body: { type: "string", description: "Comment text" },
      },
      required: ["itemId", "body"],
    },
  },
  {
    name: "list_workspace_members",
    description:
      "List all members of a workspace. Returns user id, name, email, avatar, and role. Use this to find user IDs for person columns.",
    parameters: {
      type: "object",
      properties: {
        workspaceId: {
          type: "string",
          description: "Workspace ID",
        },
      },
      required: ["workspaceId"],
    },
  },
];

export function toAnthropicTools(tools: NeutralToolDef[]): Anthropic.Tool[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: {
      type: "object" as const,
      properties: t.parameters.properties,
      required: t.parameters.required,
    },
  }));
}

export function toOpenAITools(tools: NeutralToolDef[]) {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}
