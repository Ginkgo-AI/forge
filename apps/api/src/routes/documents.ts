import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import * as documentService from "../services/document.service.js";

const documentRoutes = new Hono();

// List documents for a workspace
documentRoutes.get("/", async (c) => {
  const workspaceId = c.req.query("workspaceId");
  if (!workspaceId) return c.json({ error: "workspaceId required" }, 400);
  const userId = c.get("userId");
  const docs = await documentService.listDocuments(workspaceId, userId);
  return c.json({ data: docs });
});

// Get single document
documentRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const doc = await documentService.getDocument(c.req.param("id"), userId);
  return c.json({ data: doc });
});

// Create document
documentRoutes.post(
  "/",
  zValidator(
    "json",
    z.object({
      workspaceId: z.string(),
      title: z.string().min(1).max(500),
      content: z.string().optional(),
      parentDocId: z.string().optional(),
    })
  ),
  async (c) => {
    const userId = c.get("userId");
    const doc = await documentService.createDocument(c.req.valid("json"), userId);
    return c.json({ data: doc }, 201);
  }
);

// Update document
documentRoutes.patch(
  "/:id",
  zValidator(
    "json",
    z.object({
      title: z.string().min(1).max(500).optional(),
      content: z.string().optional(),
    })
  ),
  async (c) => {
    const userId = c.get("userId");
    const doc = await documentService.updateDocument(
      c.req.param("id"),
      c.req.valid("json"),
      userId
    );
    return c.json({ data: doc });
  }
);

// Delete document
documentRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");
  await documentService.deleteDocument(c.req.param("id"), userId);
  return c.json({ data: { deleted: true } });
});

export { documentRoutes };
