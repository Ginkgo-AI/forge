import { Hono } from "hono";
import { auth } from "../lib/auth.js";

export const authRoutes = new Hono();

authRoutes.on(["POST", "GET"], "/*", (c) => {
  // Hono strips the mount prefix from c.req.raw, but Better Auth needs
  // the full path. Reconstruct the request with the original URL.
  const origUrl = new URL(c.req.url);
  const request = new Request(origUrl.toString(), c.req.raw);
  return auth.handler(request);
});
