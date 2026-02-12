import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { initAutomationListeners } from "./services/automation.service.js";
import { initAgentListeners } from "./services/agent.service.js";

const port = Number(process.env.API_PORT) || 3001;

console.log(`Forge API starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Forge API running at http://localhost:${port}`);

// Initialize event listeners for automations and agents
(async () => {
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
})();
