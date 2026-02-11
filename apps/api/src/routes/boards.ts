import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import * as boardService from "../services/board.service.js";

const boardRoutes = new Hono();

const createBoardSchema = z.object({
  name: z.string().min(1).max(200),
  workspaceId: z.string(),
  description: z.string().max(1000).optional(),
  templateId: z.string().optional(),
});

const createColumnSchema = z.object({
  title: z.string().min(1).max(100),
  type: z.enum([
    "text",
    "number",
    "status",
    "person",
    "date",
    "timeline",
    "checkbox",
    "link",
    "file",
    "formula",
    "ai_generated",
    "dropdown",
    "rating",
    "tags",
  ]),
  config: z.record(z.unknown()).optional(),
  position: z.number().int().min(0).optional(),
});

const createGroupSchema = z.object({
  title: z.string().min(1).max(200),
  color: z.string().max(7).optional(),
});

// List boards in a workspace
boardRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const workspaceId = c.req.query("workspaceId");
  if (!workspaceId) {
    return c.json({ error: "workspaceId query parameter is required" }, 400);
  }
  const boards = await boardService.listBoards(workspaceId, userId);
  return c.json({ data: boards, total: boards.length });
});

// Create board
boardRoutes.post(
  "/",
  zValidator("json", createBoardSchema),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const board = await boardService.createBoard(body, userId);
    return c.json({ data: board }, 201);
  }
);

// Get board with columns, groups
boardRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const board = await boardService.getBoard(id, userId);
  return c.json({ data: board });
});

// Add column to board
boardRoutes.post(
  "/:id/columns",
  zValidator("json", createColumnSchema),
  async (c) => {
    const userId = c.get("userId");
    const boardId = c.req.param("id");
    const body = c.req.valid("json");
    const column = await boardService.addColumn(boardId, body, userId);
    return c.json({ data: column }, 201);
  }
);

// Add group to board
boardRoutes.post(
  "/:id/groups",
  zValidator("json", createGroupSchema),
  async (c) => {
    const userId = c.get("userId");
    const boardId = c.req.param("id");
    const body = c.req.valid("json");
    const group = await boardService.addGroup(boardId, body, userId);
    return c.json({ data: group }, 201);
  }
);

// Update board
boardRoutes.patch(
  "/:id",
  zValidator("json", createBoardSchema.partial()),
  async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const board = await boardService.updateBoard(id, userId, body);
    return c.json({ data: board });
  }
);

// Delete board
boardRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  await boardService.deleteBoard(id, userId);
  return c.json({ success: true });
});

export { boardRoutes };
