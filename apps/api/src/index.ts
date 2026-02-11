import { serve } from "@hono/node-server";
import { app } from "./app.js";

const port = Number(process.env.API_PORT) || 3001;

console.log(`Forge API starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Forge API running at http://localhost:${port}`);
