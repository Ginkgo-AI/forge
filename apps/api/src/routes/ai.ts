import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import * as aiService from "../services/ai.service.js";
import { getAvailableProviders } from "../lib/ai/provider-registry.js";

const aiRoutes = new Hono();

// List available AI providers and models
aiRoutes.get("/providers", (c) => {
  const providers = getAvailableProviders();
  return c.json({ data: providers });
});

// Chat with AI (streaming SSE)
aiRoutes.post(
  "/chat",
  zValidator(
    "json",
    z.object({
      message: z.string().min(1).max(10000),
      workspaceId: z.string(),
      conversationId: z.string().optional(),
      boardId: z.string().optional(),
      itemId: z.string().optional(),
      providerId: z.string().optional(),
      model: z.string().optional(),
    })
  ),
  async (c) => {
    const body = c.req.valid("json");
    const userId = c.get("userId");

    return streamSSE(c, async (stream) => {
      const generator = aiService.streamChat({
        message: body.message,
        workspaceId: body.workspaceId,
        userId,
        conversationId: body.conversationId,
        boardId: body.boardId,
        itemId: body.itemId,
        providerId: body.providerId,
        model: body.model,
      });

      for await (const event of generator) {
        await stream.writeSSE({
          event: event.type,
          data: JSON.stringify(event),
        });
      }
    });
  }
);

// Generate board from natural language description
aiRoutes.post(
  "/generate-board",
  zValidator(
    "json",
    z.object({
      description: z.string().min(10).max(5000),
      workspaceId: z.string(),
      providerId: z.string().optional(),
      model: z.string().optional(),
    })
  ),
  async (c) => {
    const body = c.req.valid("json");
    const userId = c.get("userId");

    const board = await aiService.generateBoard(
      body.description,
      body.workspaceId,
      userId,
      body.providerId,
      body.model
    );

    return c.json({ data: board });
  }
);

// Extract action items from text
aiRoutes.post(
  "/extract-items",
  zValidator(
    "json",
    z.object({
      text: z.string().min(10).max(50000),
      boardId: z.string(),
      providerId: z.string().optional(),
      model: z.string().optional(),
    })
  ),
  async (c) => {
    const body = c.req.valid("json");
    const userId = c.get("userId");

    const items = await aiService.extractItems(
      body.text,
      body.boardId,
      userId,
      body.providerId,
      body.model
    );

    return c.json({ data: { extractedItems: items } });
  }
);

// Generate automation from natural language (Phase 4 placeholder)
aiRoutes.post(
  "/generate-automation",
  zValidator(
    "json",
    z.object({
      description: z.string().min(10).max(2000),
      boardId: z.string(),
    })
  ),
  async (c) => {
    return c.json({
      data: {
        suggestedAutomation: null,
        reasoning: "AI automation generation coming in Phase 4.",
      },
    });
  }
);

export { aiRoutes };
