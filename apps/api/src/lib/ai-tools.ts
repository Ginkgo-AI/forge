import * as boardService from "../services/board.service.js";
import * as itemService from "../services/item.service.js";
import * as workspaceService from "../services/workspace.service.js";

export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  userId: string
): Promise<unknown> {
  switch (toolName) {
    case "list_boards":
      return boardService.listBoards(
        toolInput.workspaceId as string,
        userId
      );

    case "get_board":
      return boardService.getBoard(toolInput.boardId as string, userId);

    case "create_board":
      return boardService.createBoard(
        {
          name: toolInput.name as string,
          workspaceId: toolInput.workspaceId as string,
          description: toolInput.description as string | undefined,
        },
        userId
      );

    case "add_column":
      return boardService.addColumn(
        toolInput.boardId as string,
        {
          title: toolInput.title as string,
          type: toolInput.type as string,
          config: toolInput.config as Record<string, unknown> | undefined,
        },
        userId
      );

    case "add_group":
      return boardService.addGroup(
        toolInput.boardId as string,
        {
          title: toolInput.title as string,
          color: toolInput.color as string | undefined,
        },
        userId
      );

    case "list_items":
      return itemService.listItems(
        toolInput.boardId as string,
        userId,
        toolInput.groupId
          ? { groupId: toolInput.groupId as string }
          : undefined
      );

    case "get_item":
      return itemService.getItem(toolInput.itemId as string, userId);

    case "create_item":
      return itemService.createItem(
        {
          boardId: toolInput.boardId as string,
          groupId: toolInput.groupId as string,
          name: toolInput.name as string,
          columnValues: toolInput.columnValues as
            | Record<string, unknown>
            | undefined,
        },
        userId
      );

    case "update_item":
      return itemService.updateItem(
        toolInput.itemId as string,
        userId,
        {
          name: toolInput.name as string | undefined,
          groupId: toolInput.groupId as string | undefined,
          columnValues: toolInput.columnValues as
            | Record<string, unknown>
            | undefined,
        }
      );

    case "delete_item":
      return itemService.deleteItem(toolInput.itemId as string, userId);

    case "add_item_update":
      return itemService.addItemUpdate(
        toolInput.itemId as string,
        userId,
        toolInput.body as string
      );

    case "list_workspace_members":
      return workspaceService.listWorkspaceMembers(
        toolInput.workspaceId as string,
        userId
      );

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
