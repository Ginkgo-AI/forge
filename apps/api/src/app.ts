import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { bodyLimit } from "hono/body-limit";
import { workspaceRoutes } from "./routes/workspaces.js";
import { boardRoutes } from "./routes/boards.js";
import { itemRoutes } from "./routes/items.js";
import { userRoutes } from "./routes/users.js";
import { agentRoutes } from "./routes/agents.js";
import { automationRoutes } from "./routes/automations.js";
import { aiRoutes } from "./routes/ai.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { authRoutes } from "./routes/auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import { requireAuth } from "./middleware/auth.js";

const app = new Hono();

// CORS origins from env (comma-separated) with localhost fallback
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

// Global middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use("*", bodyLimit({ maxSize: 1024 * 1024 })); // 1MB

// Health check (no auth)
app.get("/health", (c) =>
  c.json({ status: "ok", service: "forge-api", timestamp: new Date().toISOString() })
);

// Auth routes (public — mounted before requireAuth)
app.route("/api/auth", authRoutes);

// API routes (all require auth)
const api = new Hono();
api.use("*", requireAuth);
api.route("/workspaces", workspaceRoutes);
api.route("/boards", boardRoutes);
api.route("/items", itemRoutes);
api.route("/users", userRoutes);
api.route("/agents", agentRoutes);
api.route("/automations", automationRoutes);
api.route("/ai", aiRoutes);
api.route("/dashboard", dashboardRoutes);

app.route("/api/v1", api);

// Error handler
app.onError(errorHandler);

// 404
app.notFound((c) =>
  c.json({ error: "Not found", path: c.req.path }, 404)
);

export { app };
