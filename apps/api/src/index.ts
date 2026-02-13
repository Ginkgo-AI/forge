import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { db } from "@forge/db";
import { sql } from "drizzle-orm";
import { initAutomationListeners } from "./services/automation.service.js";
import { initAgentListeners } from "./services/agent.service.js";

const port = Number(process.env.API_PORT) || 3001;

// Validate DB connection before starting
async function validateDb() {
  try {
    await db.execute(sql`SELECT 1`);
    console.log("[Startup] Database connection verified");
  } catch (err) {
    console.error("[Startup] Database connection failed:", err);
    process.exit(1);
  }
}

async function start() {
  await validateDb();

  const server = serve({
    fetch: app.fetch,
    port,
  });

  console.log(`Forge API running at http://localhost:${port}`);

  // Initialize event listeners for automations and agents
  try {
    await initAutomationListeners();
  } catch (err) {
    console.warn("[Startup] Failed to init automation listeners:", err);
  }
  try {
    await initAgentListeners();
  } catch (err) {
    console.warn("[Startup] Failed to init agent listeners:", err);
  }

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`\n[Shutdown] Received ${signal}, closing server...`);
    server.close(() => {
      console.log("[Shutdown] Server closed");
      process.exit(0);
    });
    // Force exit after 10s
    setTimeout(() => {
      console.error("[Shutdown] Forced exit after timeout");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// Process-level error handlers
process.on("unhandledRejection", (reason) => {
  console.error("[Process] Unhandled rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[Process] Uncaught exception:", err);
  process.exit(1);
});

console.log(`Forge API starting on port ${port}`);
start();
